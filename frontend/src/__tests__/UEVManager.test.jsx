import React from 'react'
import { render, screen } from '@testing-library/react'
import UEVManager from '../components/UEVManager'
import axios from 'axios'

jest.mock('axios')

describe('UEVManager — renderização básica', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: [] })
  })

  it('renderiza o título da tabela', () => {
    render(<UEVManager />)
    expect(screen.getByText(/Gerenciar Transformidades/i)).toBeInTheDocument()
  })

  it('renderiza o botão Adicionar', () => {
    render(<UEVManager />)
    expect(screen.getByText('+ Adicionar')).toBeInTheDocument()
  })
})
