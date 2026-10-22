import { motion } from 'framer-motion'

/*
 * 学習解説ページの図解（カテゴリごとに1枚）
 * 図はシンプルなSVGで描き、要点を色と動きで示す。
 */

function FireTriangle() {
  const items = [
    { x: 160, y: 30, label: '熱源', sub: '火の元', color: '#f2641f' },
    { x: 50, y: 200, label: '可燃物', sub: '燃えるもの', color: '#b45309' },
    { x: 270, y: 200, label: '酸素', sub: '空気', color: '#0ea5e9' },
  ]
  return (
    <svg viewBox="0 0 320 240" className="w-full h-auto" role="img" aria-label="燃焼の3要素：熱源・可燃物・酸素">
      <motion.path
        d="M160 50 L60 190 L260 190 Z"
        fill="#fff7ed"
        stroke="#f2641f"
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      />
      <g transform="translate(160 150) scale(1.1)">
        <path className="flame-flicker" d="M0 -40 C 12 -24 22 -14 22 0 L -22 0 C -22 -14 -14 -22 -8 -33 C -4 -22 0 -20 2 -18 C 4 -26 4 -33 0 -40 Z" fill="#f2641f" />
        <path d="M0 -22 C 6 -14 10 -8 10 0 L -10 0 C -10 -8 -6 -12 -2 -18 C 0 -12 2 -12 2 -10 C 3 -14 3 -18 0 -22 Z" fill="#fde047" />
      </g>
      {items.map((it, i) => (
        <motion.g key={it.label} initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.2 }}>
          <circle cx={it.x} cy={it.y} r="28" fill="#fff" stroke={it.color} strokeWidth="3" />
          <text x={it.x} y={it.y + 2} fontSize="12" fontWeight="900" fill={it.color} textAnchor="middle">{it.label}</text>
          <text x={it.x} y={it.y + 15} fontSize="8" fill="#64748b" textAnchor="middle">{it.sub}</text>
        </motion.g>
      ))}
      <text x="160" y="232" fontSize="10" fill="#64748b" textAnchor="middle">どれか1つを断てば火は消える</text>
    </svg>
  )
}

function HeatingDiagram() {
  // 標準加熱曲線と、被覆あり／なしの鋼材温度のイメージ
  const fire = 'M30 170 C 40 80, 80 55, 300 40'
  const bare = 'M30 175 C 60 160, 75 80, 300 55'
  const coated = 'M30 175 C 120 172, 200 130, 300 95'
  return (
    <svg viewBox="0 0 320 220" className="w-full h-auto" role="img" aria-label="火災温度と鋼材温度の上昇。被覆なしは短時間で限界温度に達し、被覆ありはゆっくり上昇する">
      <line x1="30" y1="180" x2="305" y2="180" stroke="#94a3b8" />
      <line x1="30" y1="20" x2="30" y2="180" stroke="#94a3b8" />
      <line x1="30" y1="105" x2="305" y2="105" stroke="#b91c1c" strokeDasharray="5 4" />
      <text x="300" y="100" fontSize="9" fill="#b91c1c" textAnchor="end" fontWeight="700">鋼材の限界温度の目安</text>
      {[
        { d: fire, c: '#f2641f', label: '火災温度', y: 36 },
        { d: bare, c: '#64748b', label: '被覆なし', y: 66 },
        { d: coated, c: '#1e3a5f', label: '被覆あり', y: 130 },
      ].map((l, i) => (
        <g key={l.label}>
          <motion.path d={l.d} fill="none" stroke={l.c} strokeWidth="3" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, delay: i * 0.3 }} />
          <text x="250" y={l.y} fontSize="10" fontWeight="700" fill={l.c}>{l.label}</text>
        </g>
      ))}
      <circle cx="96" cy="105" r="5" fill="#b91c1c" />
      <text x="100" y="122" fontSize="9" fill="#b91c1c">短時間で限界に</text>
      <text x="168" y="198" fontSize="10" fill="#64748b" textAnchor="middle">加熱時間 →</text>
      <text x="20" y="100" fontSize="10" fill="#64748b" textAnchor="middle" transform="rotate(-90 20 100)">温度 →</text>
    </svg>
  )
}

function MaterialsDiagram() {
  const rows = [
    { label: '不燃材料', min: 20, color: '#3b82f6', ex: 'コンクリート・石膏ボード' },
    { label: '準不燃材料', min: 10, color: '#10b981', ex: '木毛セメント板など' },
    { label: '難燃材料', min: 5, color: '#f59e0b', ex: '難燃合板など' },
  ]
  return (
    <svg viewBox="0 0 320 200" className="w-full h-auto" role="img" aria-label="不燃材料20分、準不燃材料10分、難燃材料5分の比較">
      <text x="10" y="18" fontSize="10" fill="#64748b">加熱しても燃えない時間</text>
      {rows.map((r, i) => (
        <g key={r.label} transform={`translate(0 ${36 + i * 52})`}>
          <text x="10" y="14" fontSize="12" fontWeight="900" fill="#0f2036">{r.label}</text>
          <text x="10" y="28" fontSize="8.5" fill="#94a3b8">{r.ex}</text>
          <rect x="110" y="2" width="180" height="22" rx="6" fill="#f1f5f9" />
          <motion.rect x="110" y="2" height="22" rx="6" fill={r.color} initial={{ width: 0 }} whileInView={{ width: (r.min / 20) * 180 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.15 }} />
          <text x={116} y="17" fontSize="11" fontWeight="900" fill="#fff">{r.min}分</text>
        </g>
      ))}
    </svg>
  )
}

function SmokeDiagram() {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-auto" role="img" aria-label="煙は天井付近にたまって下降する。防煙垂れ壁が煙の広がりを遅らせる">
      <rect x="10" y="20" width="300" height="160" fill="#fbfaf7" stroke="#334155" strokeWidth="3" />
      {/* 煙層 */}
      <motion.rect x="12" y="22" width="190" fill="#64748b" opacity="0.5" initial={{ height: 10 }} whileInView={{ height: 70 }} viewport={{ once: true }} transition={{ duration: 3, ease: 'easeInOut' }} />
      <motion.rect x="212" y="22" width="96" fill="#64748b" opacity="0.35" initial={{ height: 0 }} whileInView={{ height: 18 }} viewport={{ once: true }} transition={{ duration: 3, delay: 1, ease: 'easeInOut' }} />
      {/* 防煙垂れ壁 */}
      <rect x="202" y="20" width="10" height="48" fill="#334155" />
      <text x="207" y="86" fontSize="9" fill="#334155" textAnchor="middle" fontWeight="700">防煙垂れ壁</text>
      {/* 火 */}
      <g transform="translate(75 178) scale(0.8)">
        <path className="flame-flicker" d="M0 -40 C 12 -24 22 -14 22 0 L -22 0 C -22 -14 -14 -22 -8 -33 C -4 -22 0 -20 2 -18 C 4 -26 4 -33 0 -40 Z" fill="#f2641f" />
      </g>
      {/* 上昇気流 */}
      {[60, 75, 90].map((x, i) => (
        <path key={x} d={`M${x} 135 C ${x - 5} 110, ${x + 5} 90, ${x} 60`} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" className="smoke-rise" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
      {/* 人（低い姿勢で避難） */}
      <g transform="translate(250 176)">
        <circle cx="-6" cy="-28" r="6" fill="#0d8573" />
        <path d="M-2 -24 L10 -12 M10 -12 L2 0 M10 -12 L18 0 M0 -18 L14 -22" stroke="#0d8573" strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="150" y="196" fontSize="10" fill="#64748b" textAnchor="middle">煙は上にたまり、時間とともに下りてくる</text>
    </svg>
  )
}

function PlanDiagram() {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-auto" role="img" aria-label="防火区画と2方向避難を組み合わせた平面計画の例">
      <rect x="10" y="10" width="300" height="160" fill="#fbfaf7" stroke="#334155" strokeWidth="3" />
      <path d="M10 75 H310 M10 105 H310 M85 10 V75 M235 10 V75 M85 105 V170 M235 105 V170" stroke="#334155" strokeWidth="2" />
      <rect x="156" y="10" width="8" height="160" fill="#b91c1c" />
      <text x="160" y="186" fontSize="9" fill="#b91c1c" textAnchor="middle" fontWeight="700">防火区画</text>
      <rect x="10" y="78" width="18" height="24" fill="#14a38b" />
      <rect x="292" y="78" width="18" height="24" fill="#14a38b" />
      <motion.path d="M160 90 H 30" stroke="#14a38b" strokeWidth="3" strokeDasharray="8 6" fill="none" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2 }} />
      <motion.path d="M160 90 H 290" stroke="#14a38b" strokeWidth="3" strokeDasharray="8 6" fill="none" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2 }} />
      <text x="40" y="45" fontSize="10" fill="#64748b">居室</text>
      <text x="100" y="94" fontSize="9" fill="#0d8573" fontWeight="700">← 避難</text>
      <text x="200" y="94" fontSize="9" fill="#0d8573" fontWeight="700">避難 →</text>
      <text x="20" y="196" fontSize="9" fill="#0d8573">階段A</text>
      <text x="300" y="196" fontSize="9" fill="#0d8573" textAnchor="end">階段B</text>
    </svg>
  )
}

export default function LearningDiagram({ type }) {
  switch (type) {
    case 'triangle': return <FireTriangle />
    case 'heating': return <HeatingDiagram />
    case 'materials': return <MaterialsDiagram />
    case 'smoke': return <SmokeDiagram />
    case 'plan': return <PlanDiagram />
    default: return null
  }
}
