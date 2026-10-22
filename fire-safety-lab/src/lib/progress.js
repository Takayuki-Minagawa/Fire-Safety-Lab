/**
 * 学習の進み具合（ブラウザの localStorage に保存）
 * サーバーには送信せず、この端末のブラウザだけに記録する。
 */
import { createContext, useContext } from 'react'
import { ALL_CARD_IDS } from '../data/learning.js'
import { CASES } from '../data/cases.js'
import { MISSIONS } from '../data/missions.js'

const STORAGE_KEY = 'fire-safety-lab:progress:v1'

export const EMPTY_PROGRESS = {
  readCards: {}, // { [cardId]: true }
  viewedCases: {}, // { [caseId]: true }
  missions: {}, // { [missionId]: true }
  memberRuns: {}, // { [memberId]: 最高の耐火時間（分） }
  simRuns: 0,
  quizBest: null, // 最高正答率（%）
  quizAttempts: 0,
}

export function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_PROGRESS
    return { ...EMPTY_PROGRESS, ...JSON.parse(raw) }
  } catch {
    return EMPTY_PROGRESS
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // プライベートモードなどで保存できない場合は何もしない
  }
}

const count = obj => Object.values(obj).filter(Boolean).length

/** 現在のミッション一覧に含まれるクリア済みミッションの数（廃止されたミッションは数えない） */
export const countMissions = p => MISSIONS.filter(m => p.missions[m.id]).length

/** 学習ステップごとの達成率と全体の達成率（%） */
export function summarize(p) {
  const steps = [
    { id: 'learn', label: '学ぶ', icon: '📖', to: '/learning', done: count(p.readCards), total: ALL_CARD_IDS.length, unit: '枚' },
    { id: 'try', label: '試す', icon: '🔬', to: '/simulation', done: countMissions(p), total: MISSIONS.length, unit: 'ミッション' },
    { id: 'compare', label: '比べる', icon: '⚖️', to: '/cases', done: count(p.viewedCases), total: CASES.length, unit: '事例' },
    { id: 'check', label: '確かめる', icon: '✅', to: '/quiz', done: p.quizBest ?? 0, total: 100, unit: '%' },
  ]
  const weights = { learn: 0.35, try: 0.3, compare: 0.15, check: 0.2 }
  const percent = Math.round(
    steps.reduce((sum, s) => sum + weights[s.id] * Math.min(1, s.done / s.total), 0) * 100,
  )
  return { steps, percent }
}

/** バッジ（実績） */
export const BADGES = [
  { id: 'first-card', icon: '🔰', title: 'はじめの一歩', desc: '解説カードを1枚読んだ', check: p => count(p.readCards) >= 1 },
  { id: 'all-cards', icon: '📚', title: '知識の土台', desc: '解説カードをすべて読んだ', check: p => count(p.readCards) >= ALL_CARD_IDS.length },
  { id: 'experimenter', icon: '🔬', title: '実験好き', desc: 'シミュレーションを3回最後まで観察した', check: p => p.simRuns >= 3 },
  { id: 'missions-3', icon: '🎯', title: 'ミッション挑戦者', desc: 'ミッションを3つクリアした', check: p => countMissions(p) >= 3 },
  { id: 'missions-all', icon: '🧑‍🚒', title: '防火計画の達人', desc: 'ミッションをすべてクリアした', check: p => countMissions(p) >= MISSIONS.length },
  { id: 'member-60', icon: '🏗️', title: '1時間耐火', desc: '部材シミュレーションで耐火時間60分以上を達成した', check: p => Object.values(p.memberRuns).some(m => m >= 60) },
  { id: 'cases', icon: '⚖️', title: '比較の目', desc: '事例比較をすべて見た', check: p => count(p.viewedCases) >= CASES.length },
  { id: 'quiz-perfect', icon: '🏆', title: '防耐火マイスター', desc: 'クイズで全問正解した', check: p => p.quizBest === 100 },
]

export const ProgressContext = createContext(null)

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>')
  return ctx
}
