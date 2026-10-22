import { useCallback, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BADGES, EMPTY_PROGRESS, ProgressContext, loadProgress, saveProgress } from '../lib/progress'

/**
 * 学習進捗の状態を保持し、バッジ獲得時などにトースト通知を出す
 */
export default function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(loadProgress)
  const progressRef = useRef(progress)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const notify = useCallback(toast => {
    const id = ++toastId.current
    setToasts(list => [...list, { id, ...toast }])
    setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), 4500)
  }, [])

  /** 進捗を更新し、新しく獲得したバッジを通知する */
  const update = useCallback(
    fn => {
      const prev = progressRef.current
      const next = fn(prev)
      if (next === prev) return
      progressRef.current = next
      setProgress(next)
      saveProgress(next)
      for (const badge of BADGES) {
        if (badge.check(next) && !badge.check(prev)) {
          notify({ icon: badge.icon, title: `バッジ獲得：${badge.title}`, text: badge.desc })
        }
      }
    },
    [notify],
  )

  const actions = useMemo(
    () => ({
      setCardRead: (id, read) =>
        update(p => (Boolean(p.readCards[id]) === read ? p : { ...p, readCards: { ...p.readCards, [id]: read } })),
      viewCase: id => update(p => (p.viewedCases[id] ? p : { ...p, viewedCases: { ...p.viewedCases, [id]: true } })),
      completeRun: () => update(p => ({ ...p, simRuns: p.simRuns + 1 })),
      clearMission: id => update(p => (p.missions[id] ? p : { ...p, missions: { ...p.missions, [id]: true } })),
      recordMember: (id, minutes) =>
        update(p =>
          (p.memberRuns[id] ?? 0) >= minutes ? p : { ...p, memberRuns: { ...p.memberRuns, [id]: minutes } },
        ),
      recordQuiz: percent =>
        update(p => ({ ...p, quizAttempts: p.quizAttempts + 1, quizBest: Math.max(p.quizBest ?? 0, percent) })),
      reset: () => update(() => EMPTY_PROGRESS),
    }),
    [update],
  )

  const value = useMemo(() => ({ progress, notify, ...actions }), [progress, notify, actions])

  return (
    <ProgressContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 items-stretch sm:items-end pointer-events-none"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="pointer-events-auto flex items-start gap-3 bg-white border border-slate-200 shadow-lg rounded-xl px-4 py-3 sm:w-80"
            >
              <span className="text-2xl leading-none" aria-hidden="true">{t.icon}</span>
              <div>
                <p className="text-sm font-bold text-slate-800">{t.title}</p>
                {t.text && <p className="text-xs text-slate-500 mt-0.5">{t.text}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ProgressContext.Provider>
  )
}
