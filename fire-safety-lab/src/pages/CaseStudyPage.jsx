import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader, Meter, PlaybackBar } from '../components/ui'
import FloorPlan from '../components/FloorPlan'
import { CASES } from '../data/cases'
import { MAX_STEP, formatTime, safetyLevel, simulate } from '../lib/fireSim'
import { usePageTitle, usePlayback } from '../lib/hooks'
import { useProgress } from '../lib/progress'

/** A・B どちらか一方の結果カード */
function CaseColumn({ side, data, sim, step, winner }) {
  const frame = sim.frames[step]
  const { stats } = frame
  const level = safetyLevel(stats.safety)
  const isA = side === 'A'

  return (
    <div className={`bg-white rounded-2xl border-2 p-4 md:p-5 transition-colors ${winner ? 'border-evac-500/60' : 'border-slate-200/80'}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded-lg font-black text-white flex items-center justify-center ${isA ? 'bg-evac-600' : 'bg-fire-600'}`}>{side}</span>
          <h3 className="font-black text-ink-900">{data.label}</h3>
        </div>
        <span className={`text-xs font-black rounded-full px-2.5 py-1 ${level.bg} ${level.text}`}>
          安全度 <span className="tabular-nums">{stats.safety}</span>
        </span>
      </div>

      <ul className="flex flex-wrap gap-1.5 mb-3">
        {data.conditions.map(c => (
          <li key={c} className="text-[11px] bg-slate-100 text-slate-600 rounded-md px-2 py-0.5">{c}</li>
        ))}
      </ul>

      <div className="rounded-xl bg-slate-100/70 p-1.5">
        <FloorPlan sim={sim} frame={frame} compact title={`${side}：${data.label}の平面図`} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
        <Meter label="延焼面積" value={stats.burnRatio} color="#f2641f" />
        <Meter label="廊下の煙" value={stats.corridorSmoke} color="#64748b" />
        <Meter label="避難完了" value={stats.evacuated / stats.total} display={`${stats.evacuated}/${stats.total}人`} color="#14a38b" />
        <div className="text-xs">
          <p className="text-slate-600 font-medium mb-1">要救助</p>
          <p className={`text-lg font-black tabular-nums ${stats.trapped ? 'text-danger-600' : 'text-slate-300'}`}>{stats.trapped}人</p>
        </div>
      </div>
    </div>
  )
}

export default function CaseStudyPage() {
  usePageTitle('事例比較')
  const { progress, viewCase } = useProgress()
  const [activeId, setActiveId] = useState(CASES[0].id)
  const [showAnswer, setShowAnswer] = useState(false)
  const current = CASES.find(c => c.id === activeId)

  const sims = useMemo(() => ({ a: simulate(current.a.config), b: simulate(current.b.config) }), [current])
  const playback = usePlayback(MAX_STEP, { onEnd: () => viewCase(activeId) })
  const step = playback.step
  const safetyA = sims.a.frames[step].stats.safety
  const safetyB = sims.b.frames[step].stats.safety

  const select = id => {
    setActiveId(id)
    setShowAnswer(false)
    playback.restart()
  }

  return (
    <div>
      <PageHeader
        icon="⚖️"
        eyebrow="CASE STUDY"
        title="事例比較"
        description="条件が1つだけ違う2つの計画を、同じ時刻で並べて比べます。再生して、どこで差がつくのかを観察しましょう。"
      />

      <div className="max-w-6xl mx-auto px-4 -mt-6 pb-16 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="tablist" aria-label="比較する事例">
          {CASES.map((c, i) => {
            const active = c.id === activeId
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => select(c.id)}
                className={`relative text-left rounded-2xl p-4 border transition-all ${
                  active ? 'bg-ink-900 text-white border-ink-900 shadow-lg' : 'bg-white text-ink-900 border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <span className={`text-[10px] font-black tracking-widest ${active ? 'text-fire-400' : 'text-slate-400'}`}>CASE {i + 1}</span>
                <span className="flex items-center gap-2 font-black mt-0.5">
                  <span aria-hidden="true" className="text-xl">{c.icon}</span>
                  {c.title}
                </span>
                {progress.viewedCases[c.id] && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold bg-evac-500 text-white rounded-full px-2 py-0.5">観察済み</span>
                )}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeId} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
              <p className="text-sm text-slate-700">{current.description}</p>
              <PlaybackBar playback={playback} max={MAX_STEP} formatLabel={s => `${formatTime(s)} / 30分`} />
              {/* 安全度の差を左右のバーで表示 */}
              <div aria-label="安全度の比較" className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 text-xs font-bold">
                <span className="text-evac-700">A {safetyA}</span>
                <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden flex">
                  <motion.div className="h-full bg-evac-500" initial={false} animate={{ width: `${(safetyA / Math.max(1, safetyA + safetyB)) * 100}%` }} />
                  <motion.div className="h-full bg-fire-500 flex-1" />
                  <span className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white" />
                </div>
                <span className="text-fire-700">{safetyB} B</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <CaseColumn side="A" data={current.a} sim={sims.a} step={step} winner={safetyA > safetyB} />
              <CaseColumn side="B" data={current.b} sim={sims.b} step={step} winner={safetyB > safetyA} />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl bg-evac-50 border border-evac-100 p-5">
                <p className="text-xs font-black tracking-widest text-evac-700 mb-1">TAKEAWAY</p>
                <p className="font-black text-ink-900 mb-2">比べてわかること</p>
                <p className="text-sm text-slate-700 leading-relaxed">{current.takeaway}</p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/80 p-5">
                <p className="text-xs font-black tracking-widest text-fire-600 mb-1">THINK</p>
                <p className="font-black text-ink-900 mb-2">考えてみよう</p>
                <p className="text-sm text-slate-700 leading-relaxed">{current.question}</p>
                <AnimatePresence initial={false} mode="wait">
                  {showAnswer ? (
                    <motion.p key="a" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-sm text-slate-700 bg-fire-50 rounded-lg p-3 leading-relaxed">
                      {current.answer}
                    </motion.p>
                  ) : (
                    <motion.button key="b" type="button" onClick={() => setShowAnswer(true)} className="mt-3 text-sm font-bold text-fire-600 hover:underline">
                      考えたら答えを見る →
                    </motion.button>
                  )}
                </AnimatePresence>
                <Link to="/simulation" className="block mt-3 text-xs font-bold text-slate-500 hover:text-fire-600">
                  🔬 シミュレーションで自分で確かめる →
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          ※ 数値は学習用の簡易モデルによる目安です。実際の火災は建物の条件・火源・気象条件などにより大きく異なります。
        </p>
      </div>
    </div>
  )
}
