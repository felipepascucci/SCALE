import { Calculator, FlaskConical, Info, Moon, Sun } from 'lucide-react'
import React, { useState } from 'react'
import axios from 'axios'
import EmergyReport from './components/EmergyReport'
import LCIUploader from './components/LCIUploader'
import LandingPage from './components/LandingPage'
import NetworkViewer from './components/NetworkViewer'
import ProjectList from './components/ProjectList'


const TABS = [
  { id: 'home', label: '🏠 Início' },
  { id: 'dashboard', label: '📊 Dashboard' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [projectId, setProjectId] = useState(null)
  const [uploadInfo, setUploadInfo] = useState(null)
  const [report, setReport] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [calcError, setCalcError] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showUevInfo, setShowUevInfo] = useState(false)
  const [projectName, setProjectName] = useState(null)

  const dk = darkMode

  function handleProjectCreated(id, info) {
    setProjectId(id)
    setUploadInfo(info)
    setProjectName(info.name)
    setReport(null)
    setCalcError(null)
    setRefreshKey((k) => k + 1)
  }

  function handleSelectProject(id, name) {
    setProjectId(id)
    setProjectName(name)
    setReport(null)
    setUploadInfo(null)
    setCalcError(null)
  }

  function handleDeleteProject(id) {
    if (id === projectId) {
      setProjectId(null)
      setProjectName(null)
      setReport(null)
      setUploadInfo(null)
      setCalcError(null)
    }
  }

  async function handleCalculate() {
    setCalculating(true)
    setCalcError(null)
    setReport(null)
    try {
      const { data } = await axios.post(`/api/v1/projects/${projectId}/calculate`)
      setReport(data)
    } catch (err) {
      const detail = err.response?.data?.detail ?? err.message
      setCalcError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif', background: dk ? '#0f172a' : '#f9fafb' }}>

      <nav style={navStyle(dk)}>
        <button
          onClick={() => setDarkMode(!dk)}
          style={themeBtnStyle(dk)}
          title={dk ? 'Modo claro' : 'Modo escuro'}
        >
          {dk ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 24 }}>
          <FlaskConical size={18} color="#2563eb" />
          <span style={{ fontWeight: 700, fontSize: 16, color: dk ? '#f1f5f9' : '#111827' }}>APSScale</span>
        </div>

        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={tabBtnStyle(activeTab === tab.id, dk)}
          >
            {tab.label}
          </button>
        ))}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: 4 }}>
          <button
            onMouseEnter={() => setShowUevInfo(true)}
            onMouseLeave={() => setShowUevInfo(false)}
            style={infoBtnStyle(dk)}
            title="Ver transformidades e método de cálculo"
          >
            <Info size={15} />
          </button>

          {showUevInfo && (
            <div style={tooltipStyle(dk)}>
              <p style={tooltipSectionTitle(dk)}>⚗️ Transformidades fixas (UEVs)</p>
              <p style={{ margin: '0 0 6px', fontSize: 11, color: dk ? '#64748b' : '#9ca3af' }}>Fonte: Odum 1996 / Brown &amp; Ulgiati</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Fonte', 'Valor (sej/J)'].map((h) => (
                      <th key={h} style={ttThStyle(dk)}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Sol',                '1,0'    ],
                    ['Vento',              '2.450'  ],
                    ['Chuva-química',      '30.500' ],
                    ['Chuva-geopotencial', '8.900'  ],
                    ['Geotérmico',         '12.000' ],
                    ['Marés',              '16.800' ],
                  ].map(([src, val]) => (
                    <tr key={src}>
                      <td style={ttTdStyle(dk)}>{src}</td>
                      <td style={{ ...ttTdStyle(dk), textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: `1px solid ${dk ? '#334155' : '#e5e7eb'}`, margin: '12px 0 10px' }} />

              <p style={tooltipSectionTitle(dk)}>📐 Método de cálculo</p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  'DFS no grafo LCI a partir do nó TARGET',
                  'Regra 1 — Soma: emergias de fontes independentes são somadas',
                  'Regra 2 — Não-dupla-contagem: bifurcações contadas apenas uma vez',
                  'Regra 3 — Co-produto integral: sem rateio entre co-produtos',
                ].map((rule) => (
                  <li key={rule} style={{ fontSize: 12, color: dk ? '#94a3b8' : '#4b5563', lineHeight: 1.5 }}>{rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </nav>

      {activeTab === 'home' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <LandingPage
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            darkMode={dk}
          />
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '720px 1fr', flex: 1, overflow: 'hidden' }}>
          <aside style={sidebarStyle(dk)}>
            <section>
              <h2 style={sectionTitleStyle(dk)}>1. Upload da Matriz LCI</h2>
              <LCIUploader onProjectCreated={handleProjectCreated} darkMode={dk} />
            </section>

            <section style={{ marginTop: 20 }}>
              <h2 style={sectionTitleStyle(dk)}>Projetos Salvos</h2>
              <ProjectList
                activeProjectId={projectId}
                onSelectProject={handleSelectProject}
                onDeleteProject={handleDeleteProject}
                refreshKey={refreshKey}
                darkMode={dk}
              />
            </section>

            {uploadInfo && (
              <section style={{ marginTop: 20 }}>
                <p style={infoStyle(dk)}>
                  ✓ Projeto <strong>{uploadInfo.name}</strong> — {uploadInfo.process_count} processos, {uploadInfo.flow_count} fluxos
                </p>
              </section>
            )}

            {projectId && (
              <section style={{ marginTop: 24 }}>
                <h2 style={sectionTitleStyle(dk)}>2. Calcular Emergia</h2>
                <button onClick={handleCalculate} disabled={calculating} style={calcBtnStyle}>
                  <Calculator size={15} />
                  {calculating ? ' Calculando…' : ' Calcular Emergia'}
                </button>

                {calcError && (
                  <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{calcError}</p>
                )}

                {report && <EmergyReport report={report} darkMode={dk} projectName={projectName} />}
              </section>
            )}
          </aside>

          <main style={{ height: '100%', overflow: 'hidden' }}>
            <NetworkViewer projectId={projectId} darkMode={dk} />
          </main>
        </div>
      )}


    </div>
  )
}

const navStyle = (dk) => ({
  display: 'flex',
  alignItems: 'center',
  background: dk ? '#1e293b' : '#ffffff',
  borderBottom: `1px solid ${dk ? '#334155' : '#e5e7eb'}`,
  padding: '0 20px',
  height: 48,
  flexShrink: 0,
  gap: 4,
})

const themeBtnStyle = (dk) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  border: `1px solid ${dk ? '#475569' : '#e5e7eb'}`,
  borderRadius: 6,
  background: 'none',
  color: dk ? '#94a3b8' : '#6b7280',
  cursor: 'pointer',
  marginRight: 12,
  flexShrink: 0,
})

const tabBtnStyle = (active, dk) => {
  const inactiveColor = dk ? '#94a3b8' : '#6b7280'
  const color = active ? '#2563eb' : inactiveColor
  return {
    padding: '0 16px',
    height: 48,
    border: 'none',
    borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
    background: 'none',
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    color,
    cursor: 'pointer',
  }
}

const sidebarStyle = (dk) => ({
  height: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
  background: dk ? '#1e293b' : '#ffffff',
  borderRight: `1px solid ${dk ? '#334155' : '#e5e7eb'}`,
  padding: '24px 16px',
  boxSizing: 'border-box',
})

const sectionTitleStyle = (dk) => ({
  fontSize: 13,
  fontWeight: 700,
  color: dk ? '#94a3b8' : '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 12,
})

const infoStyle = (dk) => ({
  fontSize: 13,
  color: '#059669',
  background: dk ? '#052e16' : '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: 6,
  padding: '8px 10px',
  margin: 0,
})

const calcBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '9px 14px',
  background: '#7c3aed',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  width: '100%',
  justifyContent: 'center',
}

const infoBtnStyle = (dk) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  border: 'none',
  borderRadius: 6,
  background: 'none',
  color: dk ? '#64748b' : '#9ca3af',
  cursor: 'pointer',
  padding: 0,
})

const tooltipStyle = (dk) => ({
  position: 'absolute',
  top: 40,
  left: 0,
  zIndex: 100,
  width: 360,
  background: dk ? '#1e293b' : '#ffffff',
  border: `1px solid ${dk ? '#334155' : '#e5e7eb'}`,
  borderRadius: 10,
  padding: '16px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
})

const tooltipSectionTitle = (dk) => ({
  margin: '0 0 8px',
  fontSize: 13,
  fontWeight: 700,
  color: dk ? '#f1f5f9' : '#111827',
})

const ttThStyle = (dk) => ({
  padding: '4px 6px',
  textAlign: 'left',
  fontWeight: 700,
  fontSize: 11,
  color: dk ? '#94a3b8' : '#6b7280',
  borderBottom: `1px solid ${dk ? '#334155' : '#e5e7eb'}`,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
})

const ttTdStyle = (dk) => ({
  padding: '4px 6px',
  color: dk ? '#e2e8f0' : '#374151',
  borderBottom: `1px solid ${dk ? '#1e293b' : '#f3f4f6'}`,
})
