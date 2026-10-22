import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PageHeader } from '../components/ui'
import FireSimulator from '../components/FireSimulator'
import MemberSimulator from '../components/MemberSimulator'
import { usePageTitle } from '../lib/hooks'

const MODES = [
  { id: 'fire', icon: '🔥', label: '延焼・煙・避難', sub: '防火：火と煙を広げない' },
  { id: 'member', icon: '🏗️', label: '部材の耐火', sub: '耐火：構造が壊れない' },
]

export default function SimulationPage() {
  usePageTitle('シミュレーション')
  const [params, setParams] = useSearchParams()
  const mode = params.get('mode') === 'member' ? 'member' : 'fire'

  return (
    <div>
      <PageHeader
        icon="🔬"
        eyebrow="SIMULATION"
        title="防耐火シミュレーション"
        description="条件を変えると結果がすぐに変わります。「防火」と「耐火」、2つの視点で火災時の建築の振る舞いを観察しましょう。"
      >
        <div className="mt-6 inline-flex flex-wrap gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5" role="tablist" aria-label="シミュレーションの種類">
          {MODES.map(m => {
            const active = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setParams(m.id === 'fire' ? {} : { mode: m.id }, { replace: true })}
                className={`relative text-left rounded-xl px-4 py-2.5 transition-colors ${active ? 'text-ink-900' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                {active && <motion.span layoutId="sim-tab" className="absolute inset-0 rounded-xl bg-white shadow" transition={{ type: 'spring', duration: 0.4 }} />}
                <span className="relative block text-sm font-black">
                  <span aria-hidden="true" className="mr-1.5">{m.icon}</span>
                  {m.label}
                </span>
                <span className={`relative block text-[11px] ${active ? 'text-slate-500' : 'text-slate-400'}`}>{m.sub}</span>
              </button>
            )
          })}
        </div>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-4 -mt-6 pb-12">
        <motion.div key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {mode === 'fire' ? <FireSimulator preset={params.get('preset')} /> : <MemberSimulator />}
        </motion.div>
        <p className="mt-6 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 leading-relaxed">
          ⚠ このシミュレーションは、条件による違いを直感的に理解するための<strong>学習用の簡易モデル</strong>です。
          表示される時間・割合・点数は目安であり、実際の火災性状や法適合の判定、実務設計には使用できません。
        </p>
      </div>
    </div>
  )
}
