import { BookOpen, FlaskConical, Leaf, Network } from 'lucide-react'
import React from 'react'

const CARDS = [
  {
    icon: <Leaf size={32} color="#16a34a" />,
    title: 'O que é Emergia?',
    items: [
      'Quantidade total de energia solar equivalente necessária para produzir um bem ou serviço.',
      'Medida em solar emjoules (sej), representa a "memória energética" acumulada em toda a cadeia produtiva.',
      'Perspectiva donor-oriented: avalia o custo imposto à natureza, não o benefício percebido pelo consumidor.',
      'Conceito formalizado por H.T. Odum (1996) como ferramenta de contabilidade ambiental sistêmica.',
    ],
  },
  {
    icon: <Network size={32} color="#2563eb" />,
    title: 'Inventário do Ciclo de Vida (LCI)',
    items: [
      'Modelado como uma matriz tecnológica n×n: célula A[i][j] indica produção (positivo) ou consumo (negativo) do produto i pelo processo j.',
      'O sistema constrói um grafo orientado a partir da matriz com três tipos de nó:',
      'SOURCE — entrada primária da natureza com Transformidade (UEV) associada.',
      'PROCESS — processo tecnológico intermediário que consome e produz fluxos.',
      'TARGET — produto final cujo conteúdo emergético é calculado.',
    ],
  },
  {
    icon: <BookOpen size={32} color="#7c3aed" />,
    title: 'Como o Sistema Funciona',
    items: [
      'Motor de cálculo aplica as 3 regras da álgebra emergética via busca em profundidade (DFS) no grafo.',
      'Regra 1 — Soma de co-geração: fluxos de origens independentes têm suas emergias somadas.',
      'Regra 2 — Não-dupla-contagem: o mesmo fluxo rastreado por dois caminhos é computado apenas uma vez.',
      'Regra 3 — Co-produto integral: cada co-produto recebe a emergia total do processo, sem rateio.',
      'Parâmetro minflow controla o corte de caminhos com contribuição irrelevante.',
    ],
  },
]

export default function LandingPage({ onNavigateToDashboard, darkMode }) {
  const dk = darkMode

  return (
    <div style={{ background: dk ? '#0f172a' : '#f9fafb', minHeight: '100%' }}>

      {/* Hero */}
      <section style={heroStyle(dk)}>
        <FlaskConical size={52} color={dk ? '#93c5fd' : '#2563eb'} strokeWidth={1.5} />
        <h1 style={h1Style(dk)}>
          APSScale — Simulador de Cálculo de Emergia
        </h1>
        <p style={subtitleStyle(dk)}>
          Ferramenta acadêmica para análise emergética baseada em matrizes de Inventário do Ciclo de Vida (LCI).
          Quantifique o trabalho exergético da geobiosfera incorporado em produtos e processos tecnológicos,
          aplicando as regras formalizadas por Odum (1996).
        </p>
        <button onClick={onNavigateToDashboard} style={ctaStyle}>
          Acessar o Dashboard →
        </button>
      </section>

      {/* Cards */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 40px' }}>
        <div style={gridStyle}>
          {CARDS.map((card) => (
            <div key={card.title} style={cardStyle(dk)}>
              <div style={{ marginBottom: 16 }}>{card.icon}</div>
              <h3 style={cardTitleStyle(dk)}>{card.title}</h3>
              <ul style={listStyle}>
                {card.items.map((item) => (
                  <li key={item} style={listItemStyle(dk)}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={footerStyle(dk)}>
        APSScale &nbsp;·&nbsp; Trabalho Acadêmico &nbsp;·&nbsp; Disciplina: Engenharia de Software &nbsp;·&nbsp; 2026
      </footer>

    </div>
  )
}

const heroStyle = (dk) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: '72px 24px 64px',
  background: dk
    ? 'linear-gradient(135deg, #1e3a5f 0%, #064e3b 100%)'
    : 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
  borderBottom: `1px solid ${dk ? '#1e293b' : '#e5e7eb'}`,
})

const h1Style = (dk) => ({
  margin: '20px 0 16px',
  fontSize: 32,
  fontWeight: 800,
  color: dk ? '#f1f5f9' : '#111827',
  lineHeight: 1.25,
  maxWidth: 640,
})

const subtitleStyle = (dk) => ({
  margin: '0 0 32px',
  fontSize: 16,
  color: dk ? '#94a3b8' : '#4b5563',
  lineHeight: 1.7,
  maxWidth: 620,
})

const ctaStyle = {
  padding: '14px 36px',
  background: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
  letterSpacing: '0.01em',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 24,
}

const cardStyle = (dk) => ({
  background: dk ? '#1e293b' : '#ffffff',
  border: `1px solid ${dk ? '#334155' : '#e5e7eb'}`,
  borderRadius: 12,
  padding: '40px 32px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
})

const cardTitleStyle = (dk) => ({
  margin: '0 0 20px',
  fontSize: 20,
  fontWeight: 700,
  color: dk ? '#f1f5f9' : '#111827',
})

const listStyle = {
  margin: 0,
  padding: '0 0 0 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const listItemStyle = (dk) => ({
  fontSize: 15,
  color: dk ? '#94a3b8' : '#4b5563',
  lineHeight: 1.65,
})

const footerStyle = (dk) => ({
  textAlign: 'center',
  padding: '20px 24px',
  fontSize: 12,
  color: dk ? '#475569' : '#9ca3af',
  borderTop: `1px solid ${dk ? '#1e293b' : '#e5e7eb'}`,
})
