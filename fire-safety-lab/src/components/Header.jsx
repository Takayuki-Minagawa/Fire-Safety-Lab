import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { path: '/', label: 'トップ' },
  { path: '/simulation', label: 'シミュレーション' },
  { path: '/learning', label: '学習解説' },
  { path: '/cases', label: '事例比較' },
  { path: '/quiz', label: 'クイズ' },
]

export default function Header() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M14 2C14 2 6 10 6 17a8 8 0 0016 0c0-7-8-15-8-15z" fill="#e85d26" opacity="0.9"/>
            <path d="M14 8c0 0-4 5-4 9a4 4 0 008 0c0-4-4-9-4-9z" fill="#f6a84b"/>
          </svg>
          <span className="font-bold text-gray-800 text-sm md:text-base">防耐火ラボ</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-1" aria-label="メインナビゲーション">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors no-underline ${
                location.pathname === item.path
                  ? 'bg-orange-50 text-orange-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニュー"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-gray-100"
            aria-label="モバイルナビゲーション"
          >
            <div className="px-4 py-2 flex flex-col gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm no-underline ${
                    location.pathname === item.path
                      ? 'bg-orange-50 text-orange-700 font-medium'
                      : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
