import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ProgressRing from './ProgressRing'
import { BADGES, summarize, useProgress } from '../lib/progress'
import { NAV_ITEMS } from '../data/nav'

export function Logo({ className = '' }) {
  return (
    <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="14" fill="#0f2036" />
      <path d="M14 50V26l18-12 18 12v24" fill="none" stroke="#94c5ff" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M32 26v24" stroke="#94c5ff" strokeWidth="2.5" strokeDasharray="3 3" />
      <path d="M31.5 50c-6 0-9.5-3.6-9.5-8.6 0-4.3 2.8-7.4 5.6-10.2.3 4.2 3.3 5.8 4.6 8.3 1.2-2.5.9-5.5-.5-8.2 5 3.1 9.3 7.2 9.3 12.1 0 4-3.7 6.6-9.5 6.6Z" fill="#f2641f" />
      <path d="M31.5 48c-2.7 0-4.7-1.7-4.7-4.1 0-2.1 1.5-3.7 3-5.4.2 2.1 1.7 3 2.4 4.3.8-1.2.8-2.8.2-4.4 2.4 1.6 4.5 3.6 4.5 5.8 0 2.2-2 3.8-5.4 3.8Z" fill="#fde047" />
    </svg>
  )
}

/** ヘッダー右上の「学習の進み具合」ポップオーバー */
function ProgressMenu() {
  const { progress, reset } = useProgress()
  const { steps, percent } = summarize(progress)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const location = useLocation()
  const [lastPath, setLastPath] = useState(location.pathname)

  // ページ移動したら閉じる（レンダー中に前回のパスと比較して更新）
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onDown = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = e => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const earned = BADGES.filter(b => b.check(progress))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
      >
        <ProgressRing percent={percent} size={30} stroke={3.5}>
          <span className="text-[9px] font-black text-ink-900 tabular-nums">{percent}</span>
        </ProgressRing>
        <span className="text-xs font-bold text-slate-600">
          <span className="hidden sm:inline">学習の</span>進み具合
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="学習の進み具合"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[min(92vw,340px)] bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50"
          >
            <div className="flex items-center gap-3 mb-4">
              <ProgressRing percent={percent} size={56} stroke={6}>
                <span className="text-sm font-black text-ink-900 tabular-nums">{percent}%</span>
              </ProgressRing>
              <div>
                <p className="text-sm font-black text-ink-900">学習の進み具合</p>
                <p className="text-xs text-slate-500">この端末のブラウザに保存されます</p>
              </div>
            </div>
            <ul className="space-y-2.5 mb-4">
              {steps.map(s => (
                <li key={s.id}>
                  <Link to={s.to} className="block group">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700 group-hover:text-fire-600">
                        <span aria-hidden="true" className="mr-1">{s.icon}</span>
                        {s.label}
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        {s.unit === '%' ? `最高 ${s.done}%` : `${s.done} / ${s.total} ${s.unit}`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-fire-500 rounded-full transition-all" style={{ width: `${Math.min(100, (s.done / s.total) * 100)}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-xs font-bold text-slate-500 mb-2">
              バッジ <span className="tabular-nums">{earned.length} / {BADGES.length}</span>
            </p>
            <ul className="grid grid-cols-4 gap-2">
              {BADGES.map(b => {
                const got = b.check(progress)
                return (
                  <li
                    key={b.id}
                    title={`${b.title}：${b.desc}`}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1 ${got ? 'bg-fire-50 border border-fire-200' : 'bg-slate-50 border border-slate-100'}`}
                  >
                    <span className={`text-xl ${got ? '' : 'grayscale opacity-30'}`} aria-hidden="true">{b.icon}</span>
                    <span className={`text-[9px] leading-tight font-bold mt-0.5 ${got ? 'text-fire-700' : 'text-slate-400'}`}>{b.title}</span>
                  </li>
                )
              })}
            </ul>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('学習の記録をすべてリセットしますか？')) reset()
              }}
              className="mt-4 text-[11px] text-slate-400 hover:text-danger-600 underline"
            >
              記録をリセット
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Header() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [lastPath, setLastPath] = useState(location.pathname)

  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMenuOpen(false)
  }

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="防耐火ラボ トップへ">
          <Logo />
          <span className="leading-tight">
            <span className="block font-black text-ink-900 text-base tracking-tight">防耐火ラボ</span>
            <span className="hidden sm:block text-[10px] text-slate-400 font-bold tracking-wider">FIRE SAFETY LAB</span>
          </span>
        </Link>

        <nav className="hidden lg:flex gap-1" aria-label="メインナビゲーション">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `relative px-3 py-2 rounded-lg text-sm font-bold transition-colors ${isActive ? 'text-fire-700' : 'text-slate-600 hover:text-ink-900 hover:bg-slate-50'}`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && <motion.span layoutId="nav-underline" className="absolute left-3 right-3 -bottom-[13px] h-[3px] rounded-full bg-fire-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ProgressMenu />
          <button
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
            aria-expanded={menuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-slate-100 bg-white"
            aria-label="モバイルナビゲーション"
          >
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-bold ${isActive ? 'bg-fire-50 text-fire-700' : 'bg-slate-50 text-slate-600'}`
                  }
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
