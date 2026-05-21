import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function UEVManager({ darkMode }) {
  const dk = darkMode
  const [uevs, setUevs] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => { fetchUevs() }, [])

  async function fetchUevs() {
    const { data } = await axios.get('/api/v1/uevs')
    setUevs(data)
  }

  function startEdit(uev) {
    setEditingId(uev.id)
    setEditValue(String(uev.value))
    setEditUnit(uev.unit)
    setError(null)
  }

  async function saveEdit(id) {
    try {
      const { data } = await axios.put(`/api/v1/uevs/${id}`, {
        value: parseFloat(editValue),
        unit: editUnit,
      })
      setUevs((prev) => prev.map((u) => (u.id === id ? data : u)))
      setEditingId(null)
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    try {
      const { data } = await axios.post('/api/v1/uevs', {
        name: newName.trim(),
        value: parseFloat(newValue),
        unit: newUnit.trim(),
      })
      setUevs((prev) => [...prev, data])
      setNewName('')
      setNewValue('')
      setNewUnit('')
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message)
    }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 860, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: dk ? '#f1f5f9' : '#111827', marginBottom: 8 }}>
        ⚗️ Gerenciar Transformidades (UEVs)
      </h2>
      <p style={{ fontSize: 13, color: dk ? '#94a3b8' : '#6b7280', marginBottom: 20 }}>
        Edite os valores de Unit Emergy Value (sej/unidade) usados no cálculo emergético.
        As alterações são refletidas imediatamente nos próximos cálculos.
      </p>

      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <table style={tableStyle(dk)}>
        <thead>
          <tr style={{ background: dk ? '#1e293b' : '#f9fafb' }}>
            <th style={thStyle(dk)}>Nome</th>
            <th style={thStyle(dk)}>Valor</th>
            <th style={thStyle(dk)}>Unidade</th>
            <th style={thStyle(dk)}>Referência</th>
            <th style={thStyle(dk)}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {uevs.map((uev) =>
            editingId === uev.id ? (
              <tr key={uev.id} style={{ background: dk ? '#1e293b' : '#ffffff' }}>
                <td style={tdStyle(dk)}>{uev.name}</td>
                <td style={tdStyle(dk)}>
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    style={inlineInputStyle(dk)}
                  />
                </td>
                <td style={tdStyle(dk)}>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    style={inlineInputStyle(dk)}
                  />
                </td>
                <td style={tdStyle(dk)}>{uev.reference ?? '—'}</td>
                <td style={tdStyle(dk)}>
                  <button onClick={() => saveEdit(uev.id)} style={btnSave}>Salvar</button>
                  <button onClick={() => setEditingId(null)} style={btnCancel}>Cancelar</button>
                </td>
              </tr>
            ) : (
              <tr key={uev.id} style={{ background: dk ? '#0f172a' : '#ffffff' }}>
                <td style={tdStyle(dk)}>{uev.name}</td>
                <td style={tdStyle(dk)}>{uev.value.toExponential(3)}</td>
                <td style={tdStyle(dk)}>{uev.unit}</td>
                <td style={tdStyle(dk)}>{uev.reference ?? '—'}</td>
                <td style={tdStyle(dk)}>
                  <button onClick={() => startEdit(uev)} style={btnEdit}>Editar</button>
                </td>
              </tr>
            )
          )}

          {/* Linha de criação */}
          <tr style={{ background: dk ? '#052e16' : '#f0fdf4' }}>
            <td style={tdStyle(dk)}>
              <input
                type="text"
                placeholder="Nome"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={inlineInputStyle(dk)}
              />
            </td>
            <td style={tdStyle(dk)}>
              <input
                type="number"
                placeholder="Valor"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                style={inlineInputStyle(dk)}
              />
            </td>
            <td style={tdStyle(dk)}>
              <input
                type="text"
                placeholder="sej/J"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                style={inlineInputStyle(dk)}
              />
            </td>
            <td style={tdStyle(dk)} colSpan={2}>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || !newValue || !newUnit.trim()}
                style={btnAdd}
              >
                + Adicionar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const tableStyle = (dk) => ({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
  border: `1px solid ${dk ? '#334155' : '#e5e7eb'}`,
  borderRadius: 8,
  overflow: 'hidden',
})

const thStyle = (dk) => ({
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 700,
  color: dk ? '#94a3b8' : '#374151',
  borderBottom: `1px solid ${dk ? '#334155' : '#e5e7eb'}`,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
})

const tdStyle = (dk) => ({
  padding: '9px 12px',
  borderBottom: `1px solid ${dk ? '#1e293b' : '#f3f4f6'}`,
  color: dk ? '#e2e8f0' : '#374151',
  verticalAlign: 'middle',
})

const inlineInputStyle = (dk) => ({
  padding: '4px 8px',
  border: `1px solid ${dk ? '#475569' : '#d1d5db'}`,
  borderRadius: 4,
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
  background: dk ? '#0f172a' : '#ffffff',
  color: dk ? '#f1f5f9' : '#111827',
})

const btnBase = {
  border: 'none',
  borderRadius: 4,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  marginRight: 4,
}
const btnEdit   = { ...btnBase, background: '#dbeafe', color: '#1d4ed8' }
const btnSave   = { ...btnBase, background: '#d1fae5', color: '#065f46' }
const btnCancel = { ...btnBase, background: '#fee2e2', color: '#991b1b' }
const btnAdd    = { ...btnBase, background: '#2563eb', color: '#fff', padding: '5px 14px' }
