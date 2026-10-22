import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProgressRing from '../components/ProgressRing'
import { usePageTitle } from '../lib/hooks'
import { summarize, useProgress } from '../lib/progress'

/* ------------------------------------------------------------------
 * スクロールに合わせて進む「火災のストーリー」
 * ------------------------------------------------------------------ */
const STORY = [
  {
    tag: '00 平常時',
    title: '建物は、見えない仕組みで守られている',
    text: '壁や床の区画、燃えにくい材料、わかりやすい避難経路。ふだんは意識しない工夫が、火災のときに命を守ります。',
    color: '#1e3a5f',
  },
  {
    tag: '01 出火',
    title: '小さな火が、室内で成長する',
    text: '家具や内装材が燃え、熱い煙が天井に沿って広がります。内装が燃えやすいほど、火は速く大きくなります。',
    color: '#f2641f',
  },
  {
    tag: '02 煙の上昇',
    title: '煙は上へ、そして横へ',
    text: '煙は天井にたまって下りてきます。階段や吹抜けがあると、煙突のように上の階へ一気に広がります。',
    color: '#64748b',
  },
  {
    tag: '03 防火区画',
    title: '防火戸が閉まり、火を閉じ込める',
    text: '煙を感知すると防火戸やシャッターが閉まり、火と煙が広がる範囲を限定します。構造体は耐火性能で崩れずに耐えます。',
    color: '#b91c1c',
  },
  {
    tag: '04 避難',
    title: '2つの方向へ、安全に逃げる',
    text: '区画で守られた廊下と階段を通って屋外へ。どこで火が出ても逃げられるよう、2方向の避難経路を計画します。',
    color: '#0d8573',
  },
]

/** 0〜1 の範囲に収める */
const clamp01 = v => Math.max(0, Math.min(1, v))
/** progress のうち [a, b] の区間を 0〜1 に変換 */
const seg = (p, a, b) => clamp01((p - a) / (b - a))

/** 断面図（3階建て）。p = 0〜1 でストーリーが進む */
function StorySection({ p }) {
  const fire = seg(p, 0.12, 0.35)
  const smoke = seg(p, 0.3, 0.55)
  const shutter = seg(p, 0.55, 0.72)
  const evac = seg(p, 0.75, 0.95)

  const floors = [
    { y: 40, label: '3F' },
    { y: 140, label: '2F' },
    { y: 240, label: '1F' },
  ]
  const people = [
    { x0: 225, y: 318 },
    { x0: 120, y: 218 },
    { x0: 170, y: 118 },
  ]

  return (
    <svg viewBox="0 0 520 380" className="w-full h-auto" role="img" aria-label="3階建ての建物断面図。スクロールに合わせて出火・煙・防火区画・避難の様子が変化します">
      <defs>
        <linearGradient id="smokeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#475569" stopOpacity="0.75" />
          <stop offset="1" stopColor="#475569" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id="fireGlow">
          <stop offset="0" stopColor="#fb923c" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 地面 */}
      <rect x="0" y="340" width="520" height="40" fill="#e2e8f0" />
      <line x1="0" y1="340" x2="520" y2="340" stroke="#94a3b8" strokeWidth="2" />

      {/* 建物 */}
      <rect x="60" y="40" width="400" height="300" fill="#fbfaf7" stroke="#1e3a5f" strokeWidth="3" />
      {floors.map(f => (
        <g key={f.label}>
          <line x1="60" x2="460" y1={f.y + 100} y2={f.y + 100} stroke="#1e3a5f" strokeWidth="3" />
          <text x="40" y={f.y + 56} fontSize="13" fontWeight="700" fill="#64748b" textAnchor="middle">{f.label}</text>
        </g>
      ))}
      {/* 階段室（右） */}
      <rect x="390" y="40" width="70" height="300" fill="#ecfdf5" stroke="#1e3a5f" strokeWidth="2" />
      {[0, 1, 2].map(i => (
        <path key={i} d={`M398 ${330 - i * 100} l15 -12 l15 -12 l15 -12 l15 -12 l0 -20`} fill="none" stroke="#14a38b" strokeWidth="2" opacity="0.6" />
      ))}
      <text x="425" y="32" fontSize="11" fill="#0d8573" fontWeight="700" textAnchor="middle">避難階段</text>

      {/* 防火区画の壁と防火戸（1F・2F・3F） */}
      {floors.map(f => (
        <g key={`wall-${f.label}`}>
          <rect x="384" y={f.y} width="6" height="100" fill="#cbd5e1" />
          <rect x="384" y={f.y} width="6" height={100 * shutter} fill="#b91c1c" />
        </g>
      ))}
      {/* 竪穴（吹抜け）：煙の通り道 */}
      <rect x="250" y="40" width="40" height="300" fill="none" stroke="#94a3b8" strokeDasharray="5 4" />
      <text x="270" y="56" fontSize="10" fill="#94a3b8" textAnchor="middle">吹抜け</text>

      {/* 煙 */}
      <g opacity={smoke}>
        <rect x="63" y="243" width="320" height={18 + smoke * 34} fill="url(#smokeGrad)" />
        <rect x="252" y={340 - smoke * 300} width="36" height={smoke * 300} fill="#64748b" opacity="0.35" />
        <rect x="63" y="143" width="320" height={smoke * 30} fill="url(#smokeGrad)" opacity="0.8" />
        <rect x="63" y="43" width="320" height={smoke * 26} fill="url(#smokeGrad)" opacity="0.6" />
        {[90, 160, 230].map((x, i) => (
          <circle key={x} cx={x} cy={262 + smoke * 20} r="10" fill="#64748b" opacity="0.4" className="smoke-rise" style={{ animationDelay: `${i * 0.6}s` }} />
        ))}
      </g>
      {/* 区画の外（階段室）には煙が入らない */}
      {shutter > 0.9 && (
        <text x="425" y="210" fontSize="10" fill="#0d8573" fontWeight="700" textAnchor="middle">煙が入らない</text>
      )}

      {/* 火 */}
      <g transform={`translate(115 336) scale(${0.25 + fire * 0.75})`} opacity={fire > 0 ? 1 : 0}>
        <circle r="60" cy="-30" fill="url(#fireGlow)" />
        <path className="flame-flicker" d="M0 -70 C 22 -40 38 -25 38 0 L -38 0 C -38 -25 -24 -38 -14 -58 C -8 -40 -2 -36 0 -30 C 6 -45 6 -58 0 -70 Z" fill="#f2641f" />
        <path d="M0 -40 C 10 -25 18 -16 18 0 L -18 0 C -18 -14 -10 -22 -4 -32 C -2 -24 0 -22 2 -20 C 4 -28 4 -34 0 -40 Z" fill="#fde047" />
      </g>

      {/* 避難する人と経路 */}
      <g opacity={evac}>
        {people.map((pp, i) => (
          <path key={i} d={`M${pp.x0} ${pp.y + 4} H 410`} stroke="#14a38b" strokeWidth="3" strokeDasharray="8 6" fill="none" />
        ))}
        <path d="M455 330 h50" stroke="#14a38b" strokeWidth="3" markerEnd="" />
        <path d="M497 322 l10 8 l-10 8" fill="none" stroke="#14a38b" strokeWidth="3" />
      </g>
      {people.map((pp, i) => {
        const x = pp.x0 + (410 - pp.x0) * evac
        return (
          <g key={i} transform={`translate(${x} ${pp.y})`} opacity={p > 0.02 ? 1 : 0.6}>
            <circle cy="-16" r="5" fill="#0d8573" />
            <path d="M0 -10 v12 M0 2 l-5 8 M0 2 l5 8 M-6 -5 l12 0" stroke="#0d8573" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )
      })}
      {evac > 0.95 && (
        <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x="460" y="368" fontSize="13" fontWeight="900" fill="#0d8573" textAnchor="middle">
          避難完了！
        </motion.text>
      )}
    </svg>
  )
}

/** セクションのスクロール進捗（0〜1）を返す */
function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let raf = null
    const update = () => {
      raf = null
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      setProgress(total > 0 ? clamp01(-rect.top / total) : 0)
    }
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [ref])
  return progress
}

function Story() {
  const ref = useRef(null)
  const p = useScrollProgress(ref)
  const active = Math.min(STORY.length - 1, Math.floor(p * STORY.length))

  return (
    <section ref={ref} className="relative bg-white" style={{ height: `${STORY.length * 80 + 40}vh` }} aria-label="火災のストーリー">
      <div className="sticky top-16 h-[calc(100svh-4rem)] flex items-center overflow-hidden bg-grid-light">
        <div className="max-w-6xl mx-auto px-4 w-full grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-6 lg:gap-12 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-bold tracking-[0.2em] text-slate-400 mb-4">SCROLL STORY</p>
            {/* ステップのインジケーター */}
            <ol className="flex gap-1.5 mb-5" aria-hidden="true">
              {STORY.map((s, i) => (
                <li key={s.tag} className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
                  <span
                    className="block h-full rounded-full transition-all duration-300"
                    style={{ width: i <= active ? '100%' : '0%', backgroundColor: STORY[active].color }}
                  />
                </li>
              ))}
            </ol>
            <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} aria-live="polite">
              <p className="text-sm font-black mb-2" style={{ color: STORY[active].color }}>{STORY[active].tag}</p>
              <h2 className="text-2xl md:text-3xl font-black text-ink-900 mb-3 leading-snug">{STORY[active].title}</h2>
              <p className="text-slate-600 leading-relaxed">{STORY[active].text}</p>
            </motion.div>
            <p className="mt-6 text-xs text-slate-400 flex items-center gap-2">
              <span className="inline-block animate-bounce" aria-hidden="true">↓</span>
              スクロールで火災が進行します
            </p>
          </div>
          <div className="order-1 lg:order-2 max-h-[48svh] lg:max-h-none flex justify-center">
            <div className="w-full max-w-[560px] max-h-[48svh] lg:max-h-none aspect-[520/380]">
              <StorySection p={p} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------
 * ヒーロー
 * ------------------------------------------------------------------ */
function HeroPlan() {
  // ヒーローの背景に置く、図面風の平面図アニメーション
  return (
    <svg viewBox="0 0 400 260" className="w-full h-auto" aria-hidden="true">
      <g fill="none" stroke="#94c5ff" strokeWidth="2" opacity="0.8">
        <rect x="10" y="10" width="380" height="240" />
        <path d="M10 110 H390 M10 150 H390 M100 10 V110 M200 10 V110 M300 10 V110 M100 150 V250 M200 150 V250 M300 150 V250" />
      </g>
      <rect x="196" y="10" width="8" height="240" fill="#ef4444" opacity="0.85">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3s" repeatCount="indefinite" />
      </rect>
      {/* 延焼の広がり */}
      <circle cx="55" cy="60" r="10" fill="#f2641f" opacity="0.8">
        <animate attributeName="r" values="8;42;8" dur="5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0.25;0.9" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx="55" cy="60" r="6" fill="#fde047" />
      {/* 避難経路 */}
      <path d="M150 130 H 380" stroke="#2dd4bf" strokeWidth="3" strokeDasharray="10 8">
        <animate attributeName="stroke-dashoffset" values="0;-36" dur="1.2s" repeatCount="indefinite" />
      </path>
      <path d="M150 130 H 20" stroke="#2dd4bf" strokeWidth="3" strokeDasharray="10 8">
        <animate attributeName="stroke-dashoffset" values="0;-36" dur="1.2s" repeatCount="indefinite" />
      </path>
      <rect x="0" y="118" width="14" height="24" fill="#14a38b" />
      <rect x="386" y="118" width="14" height="24" fill="#14a38b" />
      <text x="200" y="275" fill="#94c5ff" fontSize="10" textAnchor="middle" opacity="0.6">PLAN 1:200</text>
    </svg>
  )
}

const FEATURES = [
  {
    icon: '📖',
    title: '学習解説',
    desc: '防火・耐火・材料・煙と避難・建築計画の5テーマを図解つきカードで。',
    link: '/learning',
    cta: '読んで学ぶ',
    accent: 'from-orange-50',
  },
  {
    icon: '🔬',
    title: 'シミュレーション',
    desc: '出火点・材料・区画・扉・避難経路を変えて、火と煙と人の動きを観察。8つのミッションに挑戦。',
    link: '/simulation',
    cta: '動かして試す',
    accent: 'from-sky-50',
  },
  {
    icon: '⚖️',
    title: '事例比較',
    desc: '区画の有無、材料の違い、避難経路の違いを、同じ時刻で並べて比較。',
    link: '/cases',
    cta: '比べて考える',
    accent: 'from-violet-50',
  },
  {
    icon: '✅',
    title: '確認クイズ',
    desc: '3択・○×・どっちが有利？の問題で理解度をチェック。称号を目指そう。',
    link: '/quiz',
    cta: '確かめる',
    accent: 'from-emerald-50',
  },
]

export default function TopPage() {
  usePageTitle(null)
  const { progress } = useProgress()
  const { steps, percent } = summarize(progress)
  const nextStep = steps.find(s => s.done < s.total) ?? steps[0]

  return (
    <div>
      {/* ───────── ヒーロー ───────── */}
      <section className="relative bg-blueprint text-white overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-fire-500/20 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-evac-500/15 rounded-full blur-3xl" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-10 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 text-xs font-bold tracking-wider bg-white/10 border border-white/10 rounded-full px-3 py-1 mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-fire-400 animate-pulse" />
              建築学科のための防耐火学習アプリ
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl md:text-6xl font-black leading-[1.15] tracking-tight mb-6"
            >
              火災から建築を
              <br />
              守る<span className="text-fire-400">仕組み</span>を、
              <br />
              <span className="bg-gradient-to-r from-fire-400 to-amber-300 bg-clip-text text-transparent">体験して学ぶ。</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-base md:text-lg text-slate-300 mb-8 max-w-xl leading-relaxed"
            >
              防火・耐火・防火区画・材料・煙と避難。<br className="hidden sm:inline" />
              <strong className="text-white">見る・動かす・比べる・確かめる</strong>の4ステップで、安全な建築計画の考え方を身につけよう。
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                to="/learning"
                className="inline-flex items-center gap-2 bg-fire-600 hover:bg-fire-500 text-white font-black py-3.5 px-7 rounded-xl text-base transition-all shadow-lg shadow-fire-900/40 hover:-translate-y-0.5"
              >
                学習を始める
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                to="/simulation"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold py-3.5 px-6 rounded-xl text-base transition-colors"
              >
                🔬 シミュレーションで遊ぶ
              </Link>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="hidden lg:block">
            <HeroPlan />
          </motion.div>
        </div>
      </section>

      {/* ───────── 学習ロードマップと進み具合 ───────── */}
      <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-5 md:p-6 grid md:grid-cols-[auto_minmax(0,1fr)] gap-6 items-center">
          <div className="flex items-center gap-4">
            <ProgressRing percent={percent} size={72} stroke={7}>
              <span className="text-base font-black text-ink-900 tabular-nums">{percent}%</span>
            </ProgressRing>
            <div>
              <p className="text-xs font-bold text-slate-400">あなたの学習の進み具合</p>
              <p className="text-sm font-black text-ink-900">
                {percent === 0 ? 'まずは「学ぶ」から始めよう' : percent >= 100 ? 'コンプリート！おめでとう🎉' : `次は「${nextStep.label}」に挑戦しよう`}
              </p>
            </div>
          </div>
          <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {steps.map((s, i) => {
              const ratio = Math.min(1, s.done / s.total)
              return (
                <li key={s.id}>
                  <Link to={s.to} className={`block rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${s === nextStep && percent < 100 ? 'border-fire-400 bg-fire-50/60' : 'border-slate-200 bg-white'}`}>
                    <p className="text-[10px] font-bold text-slate-400">STEP {i + 1}</p>
                    <p className="text-sm font-black text-ink-900">
                      <span aria-hidden="true" className="mr-1">{s.icon}</span>
                      {s.label}
                    </p>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                      <div className="h-full rounded-full bg-fire-500 transition-all" style={{ width: `${ratio * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 tabular-nums">
                      {s.unit === '%' ? `クイズ最高 ${s.done}%` : `${s.done}/${s.total} ${s.unit}`}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* ───────── 防火と耐火 ───────── */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-[0.2em] text-fire-600 mb-2">KEY CONCEPT</p>
          <h2 className="text-2xl md:text-3xl font-black text-ink-900">「防火」と「耐火」は、ちがう。</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              title: '防火',
              en: 'Fire Prevention',
              catch: '火と煙を「広げない」',
              text: '防火区画・防火戸・内装制限・排煙などで、火災の発生と拡大を防ぐ考え方。',
              color: 'text-fire-600',
              bg: 'bg-fire-50 border-fire-200',
              icon: '🧱',
              to: '/simulation',
            },
            {
              title: '耐火',
              en: 'Fire Resistance',
              catch: '構造が「壊れない」',
              text: '柱・梁・床・壁が火災の熱に一定時間耐え、倒壊しない性能。避難と消火の時間を支える。',
              color: 'text-ink-700',
              bg: 'bg-sky-50 border-sky-200',
              icon: '🏗️',
              to: '/simulation?mode=member',
            },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={c.to} className={`block h-full rounded-2xl border p-6 md:p-8 ${c.bg} hover:shadow-md transition-shadow`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`text-4xl font-black ${c.color}`}>{c.title}</p>
                    <p className="text-xs font-bold text-slate-400 tracking-wider">{c.en}</p>
                  </div>
                  <span className="text-4xl" aria-hidden="true">{c.icon}</span>
                </div>
                <p className="text-lg font-black text-ink-900 mb-2">{c.catch}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{c.text}</p>
                <p className={`mt-4 text-sm font-bold ${c.color}`}>シミュレーションで体験 →</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── スクロールストーリー ───────── */}
      <Story />

      {/* ───────── コンテンツ ───────── */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.2em] text-fire-600 mb-2">CONTENTS</p>
            <h2 className="text-2xl md:text-3xl font-black text-ink-900">4つのステップで学ぶ</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  to={card.link}
                  className={`group flex flex-col h-full bg-gradient-to-b ${card.accent} to-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all`}
                >
                  <span className="text-[10px] font-black text-slate-400 tracking-widest">STEP {i + 1}</span>
                  <span className="text-4xl my-3" aria-hidden="true">{card.icon}</span>
                  <h3 className="font-black text-ink-900 text-lg mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">{card.desc}</p>
                  <span className="mt-4 text-sm font-bold text-fire-600 group-hover:translate-x-1 transition-transform">{card.cta} →</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── 注意書き ───────── */}
      <section className="py-8 bg-amber-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-amber-900 leading-relaxed">
            本アプリは建築学科の学生を対象とした<strong>教育用の学習ツール</strong>です。
            表示される情報は学習用の簡易モデルであり、実務設計や法適合判定には使用できません。
          </p>
        </div>
      </section>
    </div>
  )
}
