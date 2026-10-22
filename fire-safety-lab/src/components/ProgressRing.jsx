import { motion } from 'framer-motion'

/** 円形の進捗リング */
export default function ProgressRing({ percent, size = 36, stroke = 4, color = '#f2641f', track = '#e2e8f0', children }) {
  const r = (size - stroke) / 2
  const len = 2 * Math.PI * r
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={len}
          initial={false}
          animate={{ strokeDashoffset: len * (1 - percent / 100) }}
          transition={{ duration: 0.6 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  )
}
