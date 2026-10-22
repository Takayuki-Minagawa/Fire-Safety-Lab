import { motion } from 'framer-motion'

/** 各ページ共通の見出し帯（図面風の方眼背景） */
export function PageHeader({ icon, eyebrow, title, description, children }) {
  return (
    <section className="bg-blueprint text-white">
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-12 md:pt-14 md:pb-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {eyebrow && (
            <p className="text-xs font-bold tracking-[0.2em] text-fire-400 mb-3 flex items-center gap-2">
              {icon && <span className="text-base" aria-hidden="true">{icon}</span>}
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">{title}</h1>
          {description && <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed">{description}</p>}
          {children}
        </motion.div>
      </div>
    </section>
  )
}

/** 白いカード */
export function Panel({ title, icon, aside, children, className = '' }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`}>
      {(title || aside) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
          {title && (
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              {icon && <span aria-hidden="true">{icon}</span>}
              {title}
            </h2>
          )}
          {aside}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

/** ボタン型の単一選択（ラジオボタン相当） */
export function Segmented({ label, value, onChange, options, columns = options.length }) {
  return (
    <fieldset>
      {label && <legend className="text-xs font-bold text-slate-500 mb-2">{label}</legend>}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} role="radiogroup">
        {options.map(opt => {
          const active = opt.value === value
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={`relative text-left rounded-xl border px-3 py-2 text-sm transition-all ${
                active
                  ? 'border-fire-500 bg-fire-50 text-fire-700 shadow-sm ring-1 ring-fire-500'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold">
                {opt.swatch && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.swatch }} />}
                {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
                {opt.label}
              </span>
              {opt.desc && <span className={`block text-[11px] mt-0.5 ${active ? 'text-fire-700/80' : 'text-slate-400'}`}>{opt.desc}</span>}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** オン・オフのスイッチ */
export function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-3 cursor-pointer py-1">
      <span>
        <span className="block text-sm font-bold text-slate-700">{label}</span>
        {desc && <span className="block text-[11px] text-slate-400 mt-0.5">{desc}</span>}
      </span>
      <span className="relative inline-flex shrink-0 mt-0.5">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="w-11 h-6 rounded-full bg-slate-300 transition-colors peer-checked:bg-evac-500 peer-focus-visible:ring-4 peer-focus-visible:ring-fire-400/50" />
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

/** 横棒メーター */
export function Meter({ label, value, display, color, hint }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div>
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="font-bold tabular-nums" style={{ color }}>{display ?? `${pct}%`}</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden" role="meter" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.25 }} />
      </div>
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

/** 半円ゲージ（総合安全度など） */
export function Gauge({ value, label, color, size = 168, sub }) {
  const r = 64
  const len = Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.62} viewBox="0 0 160 100" role="img" aria-label={`${label} ${pct}点`}>
        <path d="M16 88 A64 64 0 0 1 144 88" fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
        <motion.path
          d="M16 88 A64 64 0 0 1 144 88"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={len}
          initial={false}
          animate={{ strokeDashoffset: len * (1 - pct / 100), stroke: color }}
          transition={{ duration: 0.35 }}
        />
        <text x="80" y="78" textAnchor="middle" fontSize="30" fontWeight="900" fill="#0f2036">
          {pct}
        </text>
        <text x="80" y="96" textAnchor="middle" fontSize="10" fill="#64748b">
          / 100
        </text>
      </svg>
      <p className="text-xs font-bold text-slate-500 -mt-1">{label}</p>
      {sub}
    </div>
  )
}

/** タイムスライダー（再生ボタン付き） */
export function PlaybackBar({ playback, max, formatLabel, color = '#f2641f', label = '火災発生からの経過時間' }) {
  const { step, seek, playing, toggle, restart, speed, setSpeed } = playback
  const pct = (step / max) * 100
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold text-white bg-fire-600 hover:bg-fire-500 shadow-sm transition-colors"
          aria-label={playing ? '一時停止' : '再生'}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="1" width="3.5" height="12" rx="1" fill="currentColor" /><rect x="8.5" y="1" width="3.5" height="12" rx="1" fill="currentColor" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9.5-5.5z" fill="currentColor" /></svg>
          )}
          {playing ? '一時停止' : step >= max ? 'もう一度' : step > 0 ? '再開' : '再生'}
        </button>
        <button
          type="button"
          onClick={restart}
          className="whitespace-nowrap px-3 py-2 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
          aria-label="最初へ戻る"
        >
          ⏮<span className="hidden sm:inline"> 最初へ</span>
        </button>
        <button
          type="button"
          onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
          className="px-3 py-2 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors tabular-nums"
          aria-label={`再生速度 ${speed}倍`}
        >
          ×{speed}
        </button>
        <span className="ml-auto text-right">
          <span className="block text-[11px] text-slate-400 leading-tight">{label}</span>
          <span className="block text-base font-black text-ink-900 tabular-nums leading-tight whitespace-nowrap">{formatLabel(step)}</span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={step}
        onChange={e => {
          playback.pause()
          seek(Number(e.target.value))
        }}
        className="slider w-full"
        style={{ '--pct': `${pct}%`, '--fill': color }}
        aria-label={label}
        aria-valuetext={formatLabel(step)}
      />
    </div>
  )
}
