import { Trash2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function ProjectList({ activeProjectId, onSelectProject, onDeleteProject, refreshKey, darkMode }) {
  const dk = darkMode
  const [projects, setProjects] = useState([])

  useEffect(() => {
    axios.get('/api/v1/projects').then(({ data }) => setProjects(data))
  }, [refreshKey])

  async function handleDelete(e, id) {
    e.stopPropagation()
    await axios.delete(`/api/v1/projects/${id}`)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    onDeleteProject(id)
  }

  if (projects.length === 0) {
    return (
      <p style={{ fontSize: 12, color: dk ? '#64748b' : '#9ca3af', margin: 0 }}>
        Nenhum projeto salvo.
      </p>
    )
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {projects.map((p) => {
        const active = p.id === activeProjectId
        return (
          <li
            key={p.id}
            onClick={() => onSelectProject(p.id, p.name)}
            style={itemStyle(active, dk)}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: active ? 700 : 500, color: dk ? '#f1f5f9' : '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: dk ? '#64748b' : '#9ca3af' }}>
                {new Date(p.created_at + 'Z').toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
            <button
              onClick={(e) => handleDelete(e, p.id)}
              title="Excluir projeto"
              style={trashBtnStyle(dk)}
            >
              <Trash2 size={14} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

const itemStyle = (active, dk) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '7px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  background: active
    ? (dk ? '#1e3a5f' : '#dbeafe')
    : (dk ? '#0f172a' : '#f9fafb'),
  border: `1px solid ${active ? '#2563eb' : (dk ? '#1e293b' : '#e5e7eb')}`,
})

const trashBtnStyle = (dk) => ({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: dk ? '#64748b' : '#9ca3af',
  padding: 2,
  borderRadius: 4,
})
