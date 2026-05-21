import React, { useCallback, useEffect, useState } from 'react'
import ReactFlow, { Background, Controls, useEdgesState, useNodesState } from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from '@dagrejs/dagre'
import axios from 'axios'

const NODE_WIDTH = 180
const NODE_HEIGHT = 50

function applyDagreLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 100 })

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  edges.forEach((e) => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return nodes.map((n) => {
    const { x, y } = g.node(n.id)
    return { ...n, position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 } }
  })
}

const nodeTypeColors = {
  light: { source: '#d1fae5', process: '#dbeafe', target: '#fef3c7' },
  dark:  { source: '#064e3b', process: '#1e3a5f', target: '#78350f' },
}

function buildStyledNodes(rawNodes, darkMode) {
  const palette = darkMode ? nodeTypeColors.dark : nodeTypeColors.light
  return rawNodes.map((n) => ({
    ...n,
    style: {
      background: palette[n.data.node_type] ?? (darkMode ? '#1e293b' : '#f3f4f6'),
      border: `1px solid ${darkMode ? '#475569' : '#9ca3af'}`,
      borderRadius: 8,
      fontSize: 12,
      padding: '6px 10px',
      width: NODE_WIDTH,
      color: darkMode ? '#f1f5f9' : '#111827',
    },
  }))
}

export default function NetworkViewer({ projectId, darkMode }) {
  const dk = darkMode
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchGraph = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.get(`/api/v1/projects/${projectId}/graph`)
      const styled = buildStyledNodes(data.nodes, dk)
      const laid = applyDagreLayout(styled, data.edges)
      setNodes(laid)
      setEdges(
        data.edges.map((e) => ({
          ...e,
          animated: false,
          style: { stroke: dk ? '#94a3b8' : '#6b7280' },
          labelStyle: { fontSize: 11, fill: dk ? '#cbd5e1' : '#374151' },
          labelBgStyle: { fill: dk ? '#0f172a' : '#ffffff', fillOpacity: 1 },
          labelBgPadding: [4, 4],
        }))
      )
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, dk, setNodes, setEdges])

  useEffect(() => { fetchGraph() }, [fetchGraph])

  if (loading) return <CenteredMsg darkMode={dk}>Carregando grafo…</CenteredMsg>
  if (error) return <CenteredMsg darkMode={dk} color="#dc2626">Erro: {error}</CenteredMsg>
  if (!projectId) return <CenteredMsg darkMode={dk}>Faça upload de uma matriz LCI para visualizar o grafo.</CenteredMsg>

  return (
    <div style={{ width: '100%', height: '100%', background: dk ? '#0f172a' : '#ffffff' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background color={dk ? '#334155' : '#e5e7eb'} gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  )
}

function CenteredMsg({ children, color, darkMode }) {
  const defaultColor = darkMode ? '#94a3b8' : '#6b7280'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: color ?? defaultColor, fontSize: 14,
      background: darkMode ? '#0f172a' : '#ffffff',
    }}>
      {children}
    </div>
  )
}
