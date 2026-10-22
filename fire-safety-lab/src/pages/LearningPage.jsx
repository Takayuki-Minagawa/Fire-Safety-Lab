import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader } from '../components/ui'
import LearningDiagram from '../components/LearningDiagrams'
import { CATEGORIES, GLOSSARY } from '../data/learning'
import { usePageTitle } from '../lib/hooks'
import { useProgress } from '../lib/progress'

/** カテゴリごとの配色（Tailwind のクラスは動的生成できないので列挙する） */
const COLORS = {
  orange: { tab: 'bg-fire-600', soft: 'bg-fire-50', border: 'border-fire-200', text: 'text-fire-700', ring: 'ring-fire-400', bar: 'bg-fire-500' },
  blue: { tab: 'bg-sky-700', soft: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800', ring: 'ring-sky-400', bar: 'bg-sky-600' },
  amber: { tab: 'bg-amber-600', soft: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', ring: 'ring-amber-400', bar: 'bg-amber-500' },
  teal: { tab: 'bg-evac-600', soft: 'bg-evac-50', border: 'border-evac-100', text: 'text-evac-700', ring: 'ring-evac-500', bar: 'bg-evac-500' },
  purple: { tab: 'bg-violet-700', soft: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', ring: 'ring-violet-400', bar: 'bg-violet-500' },
}

/** 「防火」と「耐火」の違い（常に表示するキーコンセプト） */
function KeyConcept() {
  const [open, setOpen] = useState(true)
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-black text-ink-900">
          <span className="text-fire-600">キーポイント</span>｜「防火」と「耐火」の違い
        </span>
        <span className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">▼</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-3 px-5 pb-5 items-stretch">
              <div className="rounded-xl bg-fire-50 border border-fire-200 p-4">
                <p className="text-2xl font-black text-fire-600">防火 <span className="text-xs font-bold text-slate-400">Fire Prevention</span></p>
                <p className="font-black text-ink-900 mt-1">火と煙を「広げない」</p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">火災の発生・拡大を防ぐ。防火区画・防火戸・内装制限・排煙など。</p>
                <p className="text-xs text-fire-700 mt-2 font-bold">問い：火はどこまで広がる？</p>
              </div>
              <div className="flex md:flex-col items-center justify-center text-slate-300 font-black text-sm">VS</div>
              <div className="rounded-xl bg-sky-50 border border-sky-200 p-4">
                <p className="text-2xl font-black text-sky-800">耐火 <span className="text-xs font-bold text-slate-400">Fire Resistance</span></p>
                <p className="font-black text-ink-900 mt-1">構造が「壊れない」</p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">柱・梁・床・壁が火災の熱に一定時間耐え、倒壊しない。耐火被覆・かぶり・燃えしろなど。</p>
                <p className="text-xs text-sky-800 mt-2 font-bold">問い：建物は何分耐えられる？</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function Glossary() {
  const [query, setQuery] = useState('')
  const q = query.trim()
  const items = q ? GLOSSARY.filter(g => g.term.includes(q) || g.reading.includes(q) || g.desc.includes(q)) : GLOSSARY
  return (
    <section className="mt-12" aria-labelledby="glossary-title">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-fire-600">GLOSSARY</p>
          <h2 id="glossary-title" className="text-xl font-black text-ink-900">用語集</h2>
        </div>
        <label className="relative">
          <input
            type="search"
            aria-label="用語を検索"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="用語を検索（例：区画、かぶり）"
            className="w-full sm:w-72 rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">🔍</span>
        </label>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">「{q}」に一致する用語はありません。</p>
      ) : (
        <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(g => (
            <div key={g.term} className="bg-white rounded-xl border border-slate-200/80 p-4">
              <dt className="font-black text-ink-900">
                {g.term}
                <span className="ml-2 text-[11px] font-normal text-slate-400">{g.reading}</span>
              </dt>
              <dd className="text-sm text-slate-600 mt-1 leading-relaxed">{g.desc}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

export default function LearningPage() {
  usePageTitle('学習解説')
  const [params, setParams] = useSearchParams()
  const { progress, setCardRead } = useProgress()
  const activeId = CATEGORIES.some(c => c.id === params.get('cat')) ? params.get('cat') : CATEGORIES[0].id
  const index = CATEGORIES.findIndex(c => c.id === activeId)
  const category = CATEGORIES[index]
  const colors = COLORS[category.color]
  const readCount = cat => cat.cards.filter(card => progress.readCards[card.id]).length
  const select = id => setParams(id === CATEGORIES[0].id ? {} : { cat: id }, { replace: true })
  const next = CATEGORIES[index + 1]
  const allRead = readCount(category) === category.cards.length

  return (
    <div>
      <PageHeader
        icon="📖"
        eyebrow="LEARNING"
        title="学習解説"
        description="5つのテーマを、図解とカードで短く学びましょう。読み終えたカードは「理解した」を押すと進み具合に記録されます。"
      />

      <div className="max-w-6xl mx-auto px-4 -mt-6 pb-16 space-y-6">
        <KeyConcept />

        {/* カテゴリのタブ */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x" role="tablist" aria-label="学習テーマ">
          {CATEGORIES.map(cat => {
            const active = cat.id === activeId
            const done = readCount(cat)
            const c = COLORS[cat.color]
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => select(cat.id)}
                className={`snap-start shrink-0 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  active ? `${c.tab} text-white shadow-md` : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span aria-hidden="true" className="text-lg">{cat.icon}</span>
                {cat.title}
                <span
                  className={`text-[10px] tabular-nums rounded-full px-1.5 py-0.5 ${
                    done === cat.cards.length ? 'bg-evac-500 text-white' : active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {done === cat.cards.length ? '✓' : `${done}/${cat.cards.length}`}
                </span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            {/* カテゴリの導入と図解 */}
            <div className={`grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-center rounded-2xl border ${colors.border} ${colors.soft} p-5 md:p-7 mb-6`}>
              <div>
                <p className={`text-xs font-black tracking-widest ${colors.text}`}>THEME {index + 1}</p>
                <h2 className="text-2xl md:text-3xl font-black text-ink-900 mt-1 mb-3">
                  <span aria-hidden="true" className="mr-2">{category.icon}</span>
                  {category.title}
                </h2>
                <p className="text-slate-700 leading-relaxed">{category.lead}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>このテーマの理解度</span>
                    <span className="tabular-nums">{readCount(category)} / {category.cards.length}</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <motion.div className={`h-full rounded-full ${colors.bar}`} initial={false} animate={{ width: `${(readCount(category) / category.cards.length) * 100}%` }} />
                  </div>
                </div>
                <Link to={category.try.to} className={`inline-flex items-center gap-1.5 mt-5 text-sm font-bold ${colors.text} hover:underline`}>
                  🔬 {category.try.label} →
                </Link>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <LearningDiagram type={category.diagram} />
              </div>
            </div>

            {/* 解説カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.cards.map((card, i) => {
                const read = Boolean(progress.readCards[card.id])
                return (
                  <motion.article
                    key={card.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`relative bg-white rounded-2xl border p-5 flex flex-col transition-shadow ${read ? `border-evac-500/40` : 'border-slate-200/80 hover:shadow-md'}`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`shrink-0 w-8 h-8 rounded-lg ${colors.soft} ${colors.text} font-black flex items-center justify-center text-sm`}>{i + 1}</span>
                      <div>
                        <h3 className="font-black text-ink-900 leading-snug">{card.title}</h3>
                        <p className={`text-xs font-bold mt-0.5 ${colors.text}`}>POINT：{card.point}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed flex-1">{card.content}</p>
                    {card.note && (
                      <p className="mt-3 text-xs bg-slate-50 rounded-lg px-3 py-2 text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-700">💡 用語メモ：</span>
                        {card.note}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setCardRead(card.id, !read)}
                      aria-pressed={read}
                      className={`mt-4 self-start inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1.5 transition-colors ${
                        read ? 'bg-evac-500 text-white hover:bg-evac-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {read ? '✓ 理解した' : '理解したらチェック'}
                    </button>
                  </motion.article>
                )
              })}
            </div>

            {/* 次へ */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white rounded-2xl border border-slate-200/80 p-4">
              <p className="text-sm text-slate-600">
                {allRead ? '🎉 このテーマのカードをすべて読みました！' : 'カードを読んだら「理解したらチェック」を押しましょう。'}
              </p>
              <div className="flex gap-2">
                <Link to="/quiz" className="text-sm font-bold px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-center">
                  クイズで確認
                </Link>
                {next && (
                  <button
                    type="button"
                    onClick={() => {
                      select(next.id)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="text-sm font-bold px-4 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-white"
                  >
                    次のテーマ：{next.title} →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <Glossary />
      </div>
    </div>
  )
}
