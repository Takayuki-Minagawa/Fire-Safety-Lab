/*
 * 軽量なSVGチャート（時系列グラフと煙層の断面図）
 */

/**
 * 時系列の折れ線グラフ。現在時刻に縦線（プレイヘッド）を表示する。
 * series: [{ label, color, values: number[], dashed? }]
 */
export function TimelineChart({ series, current, maxX, yMax = 1, yTicks = [0, 0.5, 1], formatY = v => `${Math.round(v * 100)}%`, xTicks = [], formatX = v => v, width = 320, height = 150, refLines = [], ariaLabel }) {
  const W = width
  const H = height
  const L = 34
  const R = 8
  const T = 10
  const B = 22
  const sx = x => L + (x / maxX) * (W - L - R)
  const sy = y => T + (1 - Math.min(yMax, y) / yMax) * (H - T - B)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
      {yTicks.map(t => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="#e2e8f0" strokeWidth="1" />
          <text x={L - 5} y={sy(t) + 3} fontSize="9" fill="#94a3b8" textAnchor="end">{formatY(t)}</text>
        </g>
      ))}
      {xTicks.map((t, i) => (
        <text key={t} x={sx(t)} y={H - 6} fontSize="9" fill="#94a3b8" textAnchor={i === xTicks.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'}>
          {formatX(t)}
        </text>
      ))}
      {refLines.map(ref => (
        <g key={ref.label}>
          <line x1={L} x2={W - R} y1={sy(ref.y)} y2={sy(ref.y)} stroke={ref.color} strokeWidth="1.2" strokeDasharray="4 3" />
          <text x={W - R - 2} y={sy(ref.y) - 4} fontSize="9" fill={ref.color} textAnchor="end" fontWeight="700">{ref.label}</text>
        </g>
      ))}
      {series.map(s => {
        const step = Math.max(1, Math.floor(s.values.length / 160))
        const pts = s.values
          .map((v, i) => (i % step === 0 || i === s.values.length - 1 ? `${sx((i / (s.values.length - 1)) * maxX).toFixed(1)},${sy(v).toFixed(1)}` : null))
          .filter(Boolean)
          .join(' ')
        return (
          <polyline
            key={s.label}
            points={pts}
            fill="none"
            stroke={s.color}
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeDasharray={s.dashed ? '5 4' : undefined}
          />
        )
      })}
      <line x1={sx(current)} x2={sx(current)} y1={T - 4} y2={H - B} stroke="#0f2036" strokeWidth="1.2" />
      {series.map(s => {
        const i = Math.round((current / maxX) * (s.values.length - 1))
        return <circle key={s.label} cx={sx(current)} cy={sy(s.values[i] ?? 0)} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2" />
      })}
    </svg>
  )
}

export function ChartLegend({ items }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
      {items.map(item => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded" style={{ backgroundColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

/**
 * 廊下の断面図：煙層がどこまで下りてきているかを人の身長と比べて示す
 * smoke: 0〜1（廊下の平均煙濃度）
 */
export function SmokeSection({ smoke }) {
  const CEIL = 2.7 // 天井高さ（m）
  const layerBottom = Math.max(0.3, CEIL - Math.min(1, smoke * 1.15) * (CEIL - 0.3))
  const H = 120
  const toY = h => 12 + (1 - h / CEIL) * (H - 24)
  const danger = layerBottom < 1.7
  const caution = layerBottom < 2.1

  return (
    <div>
      <svg viewBox={`0 0 240 ${H}`} className="w-full h-auto" role="img" aria-label={`廊下の断面図。煙層の下端は床から約${layerBottom.toFixed(1)}m`}>
        {/* 天井と床 */}
        <rect x="10" y="4" width="220" height="8" fill="#334155" />
        <rect x="10" y={H - 12} width="220" height="8" fill="#334155" />
        {/* 煙層 */}
        <rect x="10" y="12" width="220" height={Math.max(0, toY(layerBottom) - 12)} fill="#64748b" opacity={0.25 + smoke * 0.5} style={{ transition: 'height 0.3s' }} />
        {smoke > 0.05 &&
          [40, 95, 150, 200].map((x, i) => (
            <circle key={x} cx={x} cy={toY(layerBottom) - 6} r="7" fill="#64748b" opacity="0.4" className="smoke-rise" style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
        <line x1="10" x2="230" y1={toY(layerBottom)} y2={toY(layerBottom)} stroke="#475569" strokeWidth="1" strokeDasharray="4 3" />
        {/* 人（身長1.7m） */}
        <g transform={`translate(120 ${toY(0)})`}>
          <circle cx="0" cy={toY(1.55) - toY(0)} r="6" fill={danger ? '#b91c1c' : '#0d8573'} />
          <path d={`M0 ${toY(1.42) - toY(0)} L0 ${toY(0.8) - toY(0)} M0 ${toY(0.8) - toY(0)} L-7 0 M0 ${toY(0.8) - toY(0)} L7 0 M-9 ${toY(1.2) - toY(0)} L9 ${toY(1.2) - toY(0)}`} stroke={danger ? '#b91c1c' : '#0d8573'} strokeWidth="3" strokeLinecap="round" />
        </g>
        <line x1="150" x2="150" y1={toY(1.7)} y2={toY(0)} stroke="#94a3b8" strokeWidth="0.8" />
        <text x="154" y={toY(0.9)} fontSize="9" fill="#64748b">1.7m</text>
        <text x="16" y={toY(layerBottom) + 12} fontSize="9" fill="#475569" fontWeight="700">煙層の下端 {layerBottom.toFixed(1)}m</text>
      </svg>
      <p className={`text-xs font-bold mt-1 ${danger ? 'text-danger-600' : caution ? 'text-amber-600' : 'text-evac-700'}`}>
        {danger ? '煙層が頭の高さより下に。避難は非常に危険です' : caution ? '煙層が下りてきています。姿勢を低く' : '煙層は天井付近。避難できる状態です'}
      </p>
    </div>
  )
}
