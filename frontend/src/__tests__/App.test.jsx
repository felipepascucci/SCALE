import React from 'react'
import { render, screen } from '@testing-library/react'
import App from '../App'

jest.mock('../components/NetworkViewer', () => () => <div data-testid="network-viewer" />)
jest.mock('../components/LCIUploader', () => ({ onProjectCreated }) => <div data-testid="lci-uploader" />)
jest.mock('../components/EmergyReport', () => () => <div data-testid="emergy-report" />)
jest.mock('../components/LandingPage', () => ({ onNavigateToDashboard }) => <div data-testid="landing-page" />)
jest.mock('../components/ProjectList', () => () => <div data-testid="project-list" />)

describe('App — navegação por abas', () => {
  it('renderiza a aba Início', () => {
    render(<App />)
    expect(screen.getByText(/Início/i)).toBeInTheDocument()
  })

  it('renderiza a aba Dashboard', () => {
    render(<App />)
    expect(screen.getByText(/📊 Dashboard/i)).toBeInTheDocument()
  })
})
