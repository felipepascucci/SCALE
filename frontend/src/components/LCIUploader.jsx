import { Download, Upload } from 'lucide-react'
import React, { useState } from 'react'
import axios from 'axios'

export default function LCIUploader({ onProjectCreated, darkMode }) {
  const dk = darkMode
  const [file, setFile] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [nameError, setNameError] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!projectName.trim()) {
      setNameError(true)
      return
    }
    if (!file) return

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', projectName.trim())

    try {
      const { data } = await axios.post('/api/v1/projects/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onProjectCreated(data.project_id, data)
    } catch (err) {
      const detail = err.response?.data?.detail
      let msg = 'Erro ao processar o arquivo.'
      if (detail) {
        msg = typeof detail === 'string' ? detail : JSON.stringify(detail)
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={labelStyle(dk)}>Nome do Projeto</label>
      <input
        type="text"
        placeholder="Ex: Produção de Pellets"
        value={projectName}
        onChange={(e) => { setProjectName(e.target.value); setNameError(false) }}
        style={inputStyle(dk)}
      />
      {nameError && (
        <p style={{ color: '#dc2626', fontSize: 12, margin: '-4px 0 0' }}>Preencha o nome do projeto.</p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={labelStyle(dk)}>Matriz LCI (.csv ou .xlsx)</label>
        <a
          href="/api/v1/projects/template"
          download="template_lci.csv"
          title="Baixar Planilha Padrão"
          style={templateLinkStyle}
        >
          <Download size={13} /> Baixar Template
        </a>
      </div>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => setFile(e.target.files[0] ?? null)}
        required
        style={inputStyle(dk)}
      />

      {error && (
        <div style={{ fontSize: 12, margin: 0 }}>
          <p style={{ color: '#dc2626', margin: '0 0 4px' }}>{error}</p>
          <p style={{ color: '#dc2626', margin: 0 }}>
            Verifique se o arquivo está no formato correto.{' '}
            <a href="/api/v1/projects/template" download="template_lci.csv" style={{ color: '#2563eb', fontWeight: 600 }}>
              Baixar Template
            </a>
          </p>
        </div>
      )}

      <button type="submit" disabled={loading || !file} style={btnStyle}>
        <Upload size={15} />
        {loading ? ' Enviando…' : ' Fazer Upload'}
      </button>
    </form>
  )
}

const labelStyle = (dk) => ({
  fontSize: 13,
  fontWeight: 600,
  color: dk ? '#f1f5f9' : '#111827',
})

const inputStyle = (dk) => ({
  padding: '8px 10px',
  border: `1px solid ${dk ? '#475569' : '#d1d5db'}`,
  borderRadius: 6,
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
  background: dk ? '#0f172a' : '#ffffff',
  color: dk ? '#f1f5f9' : '#111827',
})

const templateLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 12,
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 600,
}

const btnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '9px 14px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}
