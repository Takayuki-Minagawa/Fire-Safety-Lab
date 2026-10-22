import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader } from '../components/ui'
import ProgressRing from '../components/ProgressRing'
import { QUESTIONS, buildRound, rankFor } from '../data/quiz'
import { CATEGORIES } from '../data/learning'
import { usePageTitle } from '../lib/hooks'
import { useProgress } from '../lib/progress'

const TYPE_LABEL = { choice: '3択', ox: '○×', compare: 'どっちが有利？' }
const LETTERS = ['A', 'B', 'C']
const categoryTitle = id => CATEGORIES.find(c => c.id === id)?.title ?? ''

/** 全問正解のときの紙吹雪 */
function Confetti() {
  const pieces = Array.from({ length: 36 }, (_, i) => i)
  const colors = ['#f2641f', '#14a38b', '#fbbf24', '#1e3a5f', '#ef4444']
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40" aria-hidden="true">
      {pieces.map(i => (
        <motion.span
          key={i}
          className="absolute top-0 w-2 h-3 rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, backgroundColor: colors[i % colors.length] }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', rotate: 360 + i * 20, opacity: [1, 1, 0] }}
          transition={{ duration: 2.4 + (i % 5) * 0.3, delay: (i % 9) * 0.08, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

function StartScreen({ onStart, best, attempts }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8">
      <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
        <div className="text-6xl" aria-hidden="true">🧯</div>
        <div className="flex-1">
          <h2 className="text-xl font-black text-ink-900 mb-1">理解度をチェックしよう</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            3択・○×・「どっちが有利？」の3タイプ、全{QUESTIONS.length}問からランダムに出題。選択肢の順番も毎回変わります。
            連続正解でコンボ、全問正解で称号「防耐火マイスター」を獲得！
          </p>
          {attempts > 0 && (
            <p className="mt-2 text-xs font-bold text-slate-500">
              これまでの挑戦：{attempts}回 ／ 最高正答率：<span className="text-fire-600">{best}%</span>
            </p>
          )}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        <button type="button" onClick={() => onStart(5)} className="rounded-xl bg-fire-600 hover:bg-fire-500 text-white p-4 text-left shadow-sm transition-colors">
          <span className="block text-lg font-black">⚡ 5問チャレンジ</span>
          <span className="block text-xs text-white/80">約2分。気軽に腕試し</span>
        </button>
        <button type="button" onClick={() => onStart(QUESTIONS.length)} className="rounded-xl bg-ink-800 hover:bg-ink-700 text-white p-4 text-left shadow-sm transition-colors">
          <span className="block text-lg font-black">📚 全{QUESTIONS.length}問モード</span>
          <span className="block text-xs text-white/80">すべての問題に挑戦</span>
        </button>
      </div>
      <p className="mt-4 text-[11px] text-slate-400">キーボード操作：1〜3 または A〜C で回答、Enter で次へ</p>
    </motion.div>
  )
}

function ResultScreen({ round, answers, onRetry, onHome }) {
  const score = answers.filter((a, i) => a === round[i].answer).length
  const percent = Math.round((score / round.length) * 100)
  const rank = rankFor(percent)
  const wrongCategories = [...new Set(round.filter((q, i) => answers[i] !== q.answer).map(q => q.category))]

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
      {percent === 100 && <Confetti />}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 text-center">
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.2 }} className="text-6xl mb-2" aria-hidden="true">
          {rank.icon}
        </motion.div>
        <p className="text-xs font-bold text-slate-400">あなたの称号</p>
        <h2 className="text-2xl md:text-3xl font-black text-ink-900 mb-4">{rank.title}</h2>
        <div className="flex justify-center mb-4">
          <ProgressRing percent={percent} size={120} stroke={10} color={percent >= 80 ? '#14a38b' : percent >= 60 ? '#f2641f' : '#b91c1c'}>
            <span className="text-center">
              <span className="block text-3xl font-black text-ink-900 tabular-nums">{score}<span className="text-base text-slate-400">/{round.length}</span></span>
              <span className="block text-xs text-slate-500 tabular-nums">正答率 {percent}%</span>
            </span>
          </ProgressRing>
        </div>
        <p className="text-sm text-slate-600 mb-6">{rank.message}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button type="button" onClick={onRetry} className="px-6 py-2.5 bg-fire-600 text-white rounded-xl font-bold hover:bg-fire-500 transition-colors">
            もう一度挑戦
          </button>
          <button type="button" onClick={onHome} className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">
            モード選択へ
          </button>
        </div>
      </div>

      {wrongCategories.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="font-black text-ink-900 mb-2">📌 復習のおすすめ</p>
          <div className="flex flex-wrap gap-2">
            {wrongCategories.map(id => (
              <Link key={id} to={`/learning?cat=${id}`} className="text-sm font-bold bg-white border border-amber-200 rounded-full px-3 py-1 text-amber-800 hover:bg-amber-100">
                {categoryTitle(id)} を読む →
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <p className="font-black text-ink-900 mb-3">ふりかえり</p>
        <ol className="space-y-3">
          {round.map((q, i) => {
            const ok = answers[i] === q.answer
            return (
              <li key={q.id} className="flex gap-3 text-sm">
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${ok ? 'bg-evac-500' : 'bg-danger-600'}`}>{ok ? '○' : '×'}</span>
                <div>
                  <p className="font-bold text-slate-800">{q.question}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    正解：{q.options[q.answer]}
                    {!ok && <span className="text-danger-600">（あなたの回答：{q.options[answers[i]]}）</span>}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </motion.div>
  )
}

export default function QuizPage() {
  usePageTitle('確認クイズ')
  const { progress, recordQuiz } = useProgress()
  const [round, setRound] = useState(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)

  const start = count => {
    setRound(buildRound(count))
    setCurrent(0)
    setAnswers([])
    setFinished(false)
  }

  const quiz = round?.[current]
  const answered = answers.length > current
  const selected = answers[current]
  const correctCount = answers.filter((a, i) => round && a === round[i].answer).length
  // 現在の連続正解数
  let combo = 0
  for (let i = answers.length - 1; i >= 0 && round && answers[i] === round[i].answer; i--) combo++

  // 切り替えアニメーション中の古い画面から呼ばれても二重に進まないよう、
  // 「何問目に対する操作か」を確認してから状態を更新する
  const answer = optionIndex => {
    if (!quiz || answered) return
    setAnswers(a => (a.length === current ? [...a, optionIndex] : a))
  }

  const next = () => {
    if (!answered) return
    if (current < round.length - 1) {
      const from = current
      setCurrent(c => (c === from ? c + 1 : c))
    } else if (!finished) {
      setFinished(true)
      recordQuiz(Math.round((correctCount / round.length) * 100))
    }
  }

  // キーボード操作
  useEffect(() => {
    if (!quiz || finished) return
    const onKey = e => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      const key = e.key.toUpperCase()
      const pos = ['1', '2', '3'].indexOf(key) >= 0 ? ['1', '2', '3'].indexOf(key) : LETTERS.indexOf(key)
      if (pos >= 0 && pos < quiz.order.length && !answered) answer(quiz.order[pos])
      if (e.key === 'Enter' && answered) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div>
      <PageHeader icon="✅" eyebrow="QUIZ" title="確認クイズ" description="学んだことを確かめましょう。正解・不正解にかかわらず、理由の解説が表示されます。" />

      <div className="max-w-3xl mx-auto px-4 -mt-6 pb-16">
        {!round ? (
          <StartScreen onStart={start} best={progress.quizBest ?? 0} attempts={progress.quizAttempts} />
        ) : finished ? (
          <ResultScreen round={round} answers={answers} onRetry={() => start(round.length)} onHome={() => setRound(null)} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-7">
            {/* 進行状況 */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm font-black text-ink-900 tabular-nums shrink-0">
                Q{current + 1}<span className="text-slate-400 font-bold">/{round.length}</span>
              </span>
              <ol className="flex-1 flex gap-1" aria-label="回答状況">
                {round.map((q, i) => {
                  const done = i < answers.length
                  const ok = done && answers[i] === q.answer
                  return (
                    <li
                      key={q.id}
                      className={`h-2 flex-1 rounded-full transition-colors ${done ? (ok ? 'bg-evac-500' : 'bg-danger-600') : i === current ? 'bg-fire-400' : 'bg-slate-200'}`}
                      aria-label={done ? (ok ? `第${i + 1}問 正解` : `第${i + 1}問 不正解`) : `第${i + 1}問`}
                    />
                  )
                })}
              </ol>
              <AnimatePresence>
                {combo >= 2 && (
                  <motion.span
                    key={combo}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="shrink-0 text-xs font-black text-white bg-gradient-to-r from-fire-500 to-amber-500 rounded-full px-2.5 py-1"
                  >
                    🔥 {combo}連続！
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={current} data-question={current} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24, pointerEvents: 'none' }} transition={{ duration: 0.25 }}>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[11px] font-bold bg-ink-900 text-white rounded-full px-2.5 py-0.5">{TYPE_LABEL[quiz.type]}</span>
                  <span className="text-[11px] font-bold bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5">{categoryTitle(quiz.category)}</span>
                </div>
                <h2 className="text-lg md:text-xl font-black text-ink-900 mb-6 leading-relaxed">{quiz.question}</h2>

                <div className={quiz.type === 'choice' ? 'space-y-3' : 'grid grid-cols-2 gap-3'}>
                  {quiz.order.map((optIndex, pos) => {
                    const isCorrect = optIndex === quiz.answer
                    const isSelected = optIndex === selected
                    let style = 'border-slate-200 hover:border-fire-400 hover:bg-fire-50/40 text-slate-700'
                    if (answered) {
                      if (isCorrect) style = 'border-evac-500 bg-evac-50 text-evac-700'
                      else if (isSelected) style = 'border-danger-600 bg-red-50 text-danger-700'
                      else style = 'border-slate-100 text-slate-400'
                    }
                    const mark = answered && isCorrect ? '✓' : answered && isSelected ? '✗' : null
                    return (
                      <motion.button
                        key={optIndex}
                        type="button"
                        onClick={() => answer(optIndex)}
                        disabled={answered}
                        whileTap={answered ? undefined : { scale: 0.98 }}
                        animate={answered && isSelected && !isCorrect ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                        className={`relative w-full rounded-xl border-2 transition-colors ${style} ${
                          quiz.type === 'ox'
                            ? 'py-6 text-5xl font-black text-center'
                            : quiz.type === 'compare'
                              ? 'p-4 text-left text-sm font-bold min-h-28 flex flex-col gap-2'
                              : 'p-4 text-left text-sm font-medium flex items-center gap-3'
                        }`}
                      >
                        {quiz.type === 'choice' && (
                          <span className="shrink-0 w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-black flex items-center justify-center">{LETTERS[pos]}</span>
                        )}
                        {quiz.type === 'compare' && (
                          <span className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-black flex items-center justify-center">{LETTERS[pos]}</span>
                            <span className="text-2xl" aria-hidden="true">{quiz.icons[optIndex]}</span>
                          </span>
                        )}
                        <span className={quiz.type === 'ox' ? (optIndex === 0 ? 'text-evac-600' : 'text-danger-600') : ''}>{quiz.options[optIndex]}</span>
                        {mark && (
                          <span className={`absolute top-2 right-3 text-base font-black ${isCorrect ? 'text-evac-600' : 'text-danger-600'}`} aria-label={isCorrect ? '正解' : '不正解'}>
                            {mark}
                          </span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                <AnimatePresence>
                  {answered && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6" aria-live="polite">
                      <div className={`p-4 rounded-xl border ${selected === quiz.answer ? 'bg-evac-50 border-evac-100' : 'bg-red-50 border-red-200'}`}>
                        <p className={`text-base font-black mb-1 ${selected === quiz.answer ? 'text-evac-700' : 'text-danger-600'}`}>
                          {selected === quiz.answer ? (combo >= 3 ? `🎉 正解！ ${combo}問連続！` : '⭕ 正解！') : '❌ 残念…'}
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">{quiz.explanation}</p>
                        <Link to={`/learning?cat=${quiz.category}`} className="inline-block mt-2 text-xs font-bold text-slate-500 hover:text-fire-600">
                          📖 「{categoryTitle(quiz.category)}」で詳しく →
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={next}
                        autoFocus
                        className="mt-4 w-full py-3 bg-ink-900 text-white rounded-xl font-black hover:bg-ink-800 transition-colors"
                      >
                        {current < round.length - 1 ? '次の問題へ →' : '結果を見る 🏁'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
