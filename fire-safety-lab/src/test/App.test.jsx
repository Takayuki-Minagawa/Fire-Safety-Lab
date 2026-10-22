import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { MAX_STEP } from '../lib/fireSim'

function renderWithRouter(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('renders the header with app title and navigation', () => {
    renderWithRouter()
    expect(screen.getAllByText('防耐火ラボ').length).toBeGreaterThan(0)
    const nav = screen.getByLabelText('メインナビゲーション')
    expect(nav.textContent).toContain('シミュレーション')
    expect(nav.textContent).toContain('クイズ')
  })

  it('renders the footer disclaimer', () => {
    renderWithRouter()
    expect(screen.getByText(/教育目的の学習用ツール/)).toBeInTheDocument()
  })

  it('renders top page hero and learning roadmap', () => {
    renderWithRouter('/')
    expect(screen.getByText('学習を始める')).toBeInTheDocument()
    expect(screen.getByText('あなたの学習の進み具合')).toBeInTheDocument()
    expect(screen.getByText('「防火」と「耐火」は、ちがう。')).toBeInTheDocument()
  })

  it('shows a not found page for unknown routes', () => {
    renderWithRouter('/unknown')
    expect(screen.getByRole('heading', { level: 1, name: 'ページが見つかりません' })).toBeInTheDocument()
  })
})

describe('SimulationPage', () => {
  it('renders the fire simulation with conditions', () => {
    renderWithRouter('/simulation')
    expect(screen.getByRole('heading', { level: 1, name: '防耐火シミュレーション' })).toBeInTheDocument()
    expect(screen.getByText('条件設定')).toBeInTheDocument()
    expect(screen.getByText('建物平面図')).toBeInTheDocument()
    expect(screen.getByText('総合安全度')).toBeInTheDocument()
  })

  it('updates the plan when the time slider moves and clears a mission at the end', () => {
    renderWithRouter('/simulation')
    const slider = screen.getByRole('slider', { name: '火災発生からの経過時間' })
    fireEvent.change(slider, { target: { value: String(MAX_STEP) } })
    expect(screen.getByText('30分00秒 / 30分')).toBeInTheDocument()
    expect(screen.getByText('ミッション達成：まずは観察')).toBeInTheDocument()
  })

  it('switches to the member fire resistance simulator', () => {
    renderWithRouter('/simulation?mode=member')
    expect(screen.getByText('耐火試験のシミュレーション')).toBeInTheDocument()
    expect(screen.getByText('耐火時間の目安')).toBeInTheDocument()
  })
})

describe('LearningPage', () => {
  it('renders categories and records read cards', () => {
    renderWithRouter('/learning')
    expect(screen.getByRole('heading', { level: 1, name: '学習解説' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /防火の基本/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /耐火の基本/ })).toBeInTheDocument()

    const buttons = screen.getAllByRole('button', { name: '理解したらチェック' })
    fireEvent.click(buttons[0])
    expect(screen.getByRole('button', { name: '✓ 理解した' })).toBeInTheDocument()
    expect(screen.getByText('バッジ獲得：はじめの一歩')).toBeInTheDocument()
  })

  it('opens the category given in the URL', () => {
    renderWithRouter('/learning?cat=smoke-evacuation')
    expect(screen.getByRole('tab', { name: /煙と避難/, selected: true })).toBeInTheDocument()
    expect(screen.getByText('煙の危険性')).toBeInTheDocument()
  })

  it('filters the glossary', () => {
    renderWithRouter('/learning')
    fireEvent.change(screen.getByLabelText('用語を検索'), { target: { value: 'かぶり' } })
    const glossary = screen.getByRole('heading', { name: '用語集' }).closest('section')
    expect(within(glossary).getByText('かぶり厚さ')).toBeInTheDocument()
    expect(within(glossary).queryByText('フラッシュオーバー')).not.toBeInTheDocument()
  })
})

describe('CaseStudyPage', () => {
  it('renders case tabs and both plans', () => {
    renderWithRouter('/cases')
    expect(screen.getByRole('heading', { level: 1, name: '事例比較' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /防火区画の有無/ })).toBeInTheDocument()
    expect(screen.getByText('区画あり')).toBeInTheDocument()
    expect(screen.getByText('区画なし')).toBeInTheDocument()
  })
})

describe('QuizPage', () => {
  it('plays a 5 question round to the result screen', async () => {
    renderWithRouter('/quiz')
    expect(screen.getByRole('heading', { level: 1, name: '確認クイズ' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /5問チャレンジ/ }))

    for (let i = 0; i < 5; i++) {
      // 切り替えアニメーションが終わり、i 問目が表示されるのを待つ
      const card = await waitFor(() => {
        const el = document.querySelector(`[data-question="${i}"]`)
        expect(el).not.toBeNull()
        return el
      })
      // 最初の選択肢を選ぶ（正誤はランダム）
      fireEvent.click(within(card).getAllByRole('button')[0])
      fireEvent.click(within(card).getByRole('button', { name: i < 4 ? '次の問題へ →' : '結果を見る 🏁' }))
    }

    expect(screen.getByText('あなたの称号')).toBeInTheDocument()
    expect(screen.getByText('ふりかえり')).toBeInTheDocument()
  })
})
