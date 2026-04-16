import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

function renderWithRouter(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  )
}

describe('App', () => {
  it('renders the header with app title', () => {
    renderWithRouter()
    expect(screen.getByText('防耐火ラボ')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    renderWithRouter()
    const nav = screen.getByLabelText('メインナビゲーション')
    expect(nav).toBeInTheDocument()
    expect(nav.textContent).toContain('シミュレーション')
    expect(nav.textContent).toContain('クイズ')
  })

  it('renders the footer disclaimer', () => {
    renderWithRouter()
    expect(screen.getByText(/教育目的の学習用ツール/)).toBeInTheDocument()
  })

  it('renders top page hero section', () => {
    renderWithRouter('/')
    expect(screen.getByText('学習を始める')).toBeInTheDocument()
  })

  it('renders simulation page', () => {
    renderWithRouter('/simulation')
    expect(screen.getByText('防耐火シミュレーション')).toBeInTheDocument()
    expect(screen.getByText('条件設定')).toBeInTheDocument()
  })

  it('renders learning page heading', () => {
    renderWithRouter('/learning')
    expect(screen.getByRole('heading', { level: 1, name: '学習解説' })).toBeInTheDocument()
    expect(screen.getByText('防火の基本')).toBeInTheDocument()
    expect(screen.getByText('耐火の基本')).toBeInTheDocument()
  })

  it('renders case study page heading', () => {
    renderWithRouter('/cases')
    expect(screen.getByRole('heading', { level: 1, name: '事例比較' })).toBeInTheDocument()
    expect(screen.getByText('防火区画の有無')).toBeInTheDocument()
  })

  it('renders quiz page', () => {
    renderWithRouter('/quiz')
    expect(screen.getByRole('heading', { level: 1, name: '確認クイズ' })).toBeInTheDocument()
  })
})
