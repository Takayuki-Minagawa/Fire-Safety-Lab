import { Link } from 'react-router-dom'
import { Logo } from './Header'
import { NAV_ITEMS } from '../data/nav'

export default function Footer() {
  return (
    <footer className="bg-ink-950 text-slate-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <Logo />
            <span className="font-black text-white">防耐火ラボ</span>
          </div>
          <p className="text-sm text-slate-300 mb-2">火災から建築を守る仕組みを、見て・動かして・比べて学ぶ。</p>
          <p className="text-xs leading-relaxed max-w-xl">
            本アプリは建築学科の学生を対象とした教育目的の学習用ツールです。表示される数値や判定は学習用の簡易モデルによる目安であり、
            実務設計や法適合判定には使用できません。
          </p>
        </div>
        <nav aria-label="フッターナビゲーション">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {NAV_ITEMS.map(item => (
              <li key={item.path}>
                <Link to={item.path} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/5">
        <p className="max-w-6xl mx-auto px-4 py-4 text-xs text-slate-500">&copy; 2026 防耐火ラボ - 建築学科向け学習アプリ</p>
      </div>
    </footer>
  )
}
