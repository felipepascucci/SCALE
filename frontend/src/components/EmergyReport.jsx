import { ChevronDown, Download } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

function toSuperscript(exp) {
  const map = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻','+':'' }
  return String(exp).split('').map(c => map[c] ?? c).join('')
}

function mathNotation(value, digits = 3) {
  const [coeff, exp] = value.toExponential(digits).split('e')
  return `${coeff} × 10${toSuperscript(exp)}`
}

function sciFormatter(value) {
  return mathNotation(value, 3) + ' sej'
}

export default function EmergyReport({ report, darkMode, projectName }) {
  const dk = darkMode
  const total = report.total_emergy_sej
  const entries = Object.entries(report.contributions_by_source)
  const pieData = entries.map(([name, value]) => ({ name, value }))

  const chartRef = useRef(null)
  const dropdownRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function handleExportExcel() {
    setIsOpen(false)
    const rows = [
      ...(projectName ? [['Projeto', projectName]] : []),
      ['Produto Alvo', report.target_name],
      ['Emergia Total (sej)', report.total_emergy_sej],
      ['Minflow Threshold', report.minflow_threshold],
      ['Emergia Descartada (%)', report.emergy_cut_pct],
      [],
      ['Fonte', 'Emergia (sej)', '% do Total'],
      ...entries.map(([src, val]) => [
        src,
        val,
        total > 0 ? parseFloat(((val / total) * 100).toFixed(2)) : 0,
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Emergia')
    XLSX.writeFile(wb, 'relatorio_emergia.xlsx')
  }

  async function handleExportPNG() {
    setIsOpen(false)
    if (!chartRef.current) return
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: dk ? '#1e1a2e' : '#faf5ff',
    })
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'grafico_emergia.png'
    a.click()
  }

  return (
    <div style={cardStyle(dk)}>
      <div ref={chartRef}>
        <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: dk ? '#94a3b8' : '#6b7280', textTransform: 'uppercase' }}>
          {projectName && <span>{projectName} — </span>}Alvo: {report.target_name}
        </p>
        <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#7c3aed' }}>
          {mathNotation(total, 4)} sej
        </p>

        {pieData.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={sciFormatter}
                contentStyle={{
                  background: dk ? '#1e293b' : '#ffffff',
                  border: `1px solid ${dk ? '#475569' : '#e5e7eb'}`,
                  color: dk ? '#f1f5f9' : '#111827',
                }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: dk ? '#cbd5e1' : '#374151' }} />
            </PieChart>
          </ResponsiveContainer>
        )}

        <table style={tableStyle(dk)}>
          <thead>
            <tr>
              <th style={thStyle(dk)}>Fonte</th>
              <th style={{ ...thStyle(dk), textAlign: 'right' }}>Emergia (sej)</th>
              <th style={{ ...thStyle(dk), textAlign: 'right' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([src, val]) => (
              <tr key={src}>
                <td style={tdStyle(dk)}>{src}</td>
                <td style={{ ...tdStyle(dk), textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {mathNotation(val, 3)}
                </td>
                <td style={{ ...tdStyle(dk), textAlign: 'right' }}>
                  {total > 0 ? ((val / total) * 100).toFixed(2) : '—'}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', marginTop: 12 }}>
        <div style={exportGroupStyle}>
          <button onClick={handleExportExcel} style={exportMainBtnStyle}>
            <Download size={13} />
            Exportar Relatório
          </button>
          <button onClick={() => setIsOpen((v) => !v)} style={exportChevronStyle}>
            <ChevronDown size={13} />
          </button>
        </div>

        {isOpen && (
          <div style={dropdownStyle(dk)}>
            <button onClick={handleExportExcel} style={dropdownItemStyle(dk)}>
              📊 Exportar Dados (Excel)
            </button>
            <button onClick={handleExportPNG} style={dropdownItemStyle(dk)}>
              🖼️ Exportar Gráfico (PNG)
            </button>
          </div>
        )}
      </div>

      {report.emergy_cut_pct > 0 && (
        <p style={{ margin: '8px 0 0', fontSize: 11, color: dk ? '#94a3b8' : '#6b7280' }}>
          ⚠ {report.emergy_cut_pct}% cortado pelo minflow ({report.minflow_threshold.toExponential(0)})
        </p>
      )}
    </div>
  )
}

const cardStyle = (dk) => ({
  background: dk ? '#1e1a2e' : '#faf5ff',
  border: `1px solid ${dk ? '#4c1d95' : '#e9d5ff'}`,
  borderRadius: 8,
  padding: '12px 14px',
  marginTop: 14,
})

const tableStyle = (dk) => ({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 11,
  marginTop: 12,
  color: dk ? '#f1f5f9' : '#374151',
})

const thStyle = (dk) => ({
  padding: '4px 6px',
  borderBottom: `1px solid ${dk ? '#4c1d95' : '#e9d5ff'}`,
  fontWeight: 700,
  color: dk ? '#c4b5fd' : '#374151',
  textAlign: 'left',
})

const tdStyle = (dk) => ({
  padding: '4px 6px',
  borderBottom: `1px solid ${dk ? '#2d2440' : '#f3f4f6'}`,
  color: dk ? '#e2e8f0' : '#374151',
})

const exportGroupStyle = {
  display: 'flex',
  borderRadius: 6,
  overflow: 'hidden',
  border: '1px solid #1d4ed8',
}

const exportMainBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 12px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const exportChevronStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '7px 8px',
  background: '#1d4ed8',
  color: '#fff',
  border: 'none',
  borderLeft: '1px solid #1e40af',
  cursor: 'pointer',
}

const dropdownStyle = (dk) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  zIndex: 50,
  marginTop: 4,
  background: dk ? '#1e293b' : '#ffffff',
  border: `1px solid ${dk ? '#334155' : '#e5e7eb'}`,
  borderRadius: 6,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  minWidth: 200,
  overflow: 'hidden',
})

const dropdownItemStyle = (dk) => ({
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '9px 14px',
  background: 'none',
  border: 'none',
  fontSize: 13,
  color: dk ? '#e2e8f0' : '#374151',
  cursor: 'pointer',
})
