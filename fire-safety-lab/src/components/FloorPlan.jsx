import { motion } from 'framer-motion'
import { COLS, ROWS, COMPARTMENT_COL, CORRIDOR_ROW, canIgnite, roomNumber } from '../lib/fireSim'

/*
 * 建物平面図（SVG）
 * 壁の行・列は細く描き、図面らしい見た目にしている。
 */
const CELL = 26
const THIN = 10
const PAD = 14
const THIN_COLS = new Set([4, 8, 12])
const THIN_ROWS = new Set([4, 6])

const colW = c => (THIN_COLS.has(c) ? THIN : CELL)
const rowH = r => (THIN_ROWS.has(r) ? THIN : CELL)
const X = [0]
for (let c = 0; c < COLS; c++) X.push(X[c] + colW(c))
const Y = [0]
for (let r = 0; r < ROWS; r++) Y.push(Y[r] + rowH(r))
const WIDTH = X[COLS]
const HEIGHT = Y[ROWS]

const cx = c => X[c] + colW(c) / 2
const cy = r => Y[r] + rowH(r) / 2

/** 熱量 → 色 */
function fireColor(heat) {
  if (heat >= 0.85) return '#c81e1e'
  if (heat >= 0.7) return '#e8401c'
  if (heat >= 0.55) return '#f2641f'
  return '#fb8a4a'
}

/** 廊下（避難経路）の安全度 → 色 */
function routeColor(heat, smoke) {
  const danger = Math.max(heat * 1.6, smoke * 1.25)
  if (danger < 0.15) return '#bfeee3'
  if (danger < 0.4) return '#fde68a'
  if (danger < 0.7) return '#fdba74'
  return '#fca5a5'
}

const ROOM_LABELS = (() => {
  const seen = new Set()
  const labels = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const n = roomNumber(r, c)
      if (n && !seen.has(n)) {
        seen.add(n)
        labels.push({ n, x: X[c] + 3, y: r < CORRIDOR_ROW ? Y[r] + 9 : Y[ROWS] - 4 })
      }
    }
  }
  return labels
})()

export default function FloorPlan({
  sim,
  frame,
  layers = { fire: true, smoke: true, evac: true },
  onSelectOrigin,
  compact = false,
  title = '建物平面図',
}) {
  const { kinds, config } = sim
  const { heat, smoke, ignitedAt, fuelLeft, fireDoorClosedAt, occupants } = frame
  const doorClosed = fireDoorClosedAt !== null && frame.step >= fireDoorClosedAt
  const interactive = Boolean(onSelectOrigin)

  const cells = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c
      cells.push({ r, c, i, kind: kinds[i], x: X[c], y: Y[r], w: colW(c), h: rowH(r) })
    }
  }

  return (
    <svg
      viewBox={`${-PAD} ${-PAD - 6} ${WIDTH + PAD * 2} ${HEIGHT + PAD * 2 + 10}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label={`${title}。出火から${frame.step}ステップ目の延焼・煙・避難の状態`}
    >
      {/* 外壁 */}
      <rect x={-4} y={-4} width={WIDTH + 8} height={HEIGHT + 8} fill="#334155" rx="2" />

      {/* 床 */}
      {cells.map(({ r, c, i, kind, x, y, w, h }) => {
        if (kind === 'room' || kind === 'door' || kind === 'fdoor' || kind === 'corridor') {
          const isRoute = r === CORRIDOR_ROW && (kind === 'corridor' || kind === 'fdoor')
          const fill = isRoute && layers.evac ? routeColor(heat[i], smoke[i]) : isRoute ? '#e8edf3' : '#fbfaf7'
          return (
            <rect
              key={`f${i}`}
              x={x}
              y={y}
              width={w}
              height={h}
              fill={fill}
              style={{ transition: 'fill 0.3s' }}
              className={interactive && canIgnite(r, c) ? 'cursor-crosshair' : undefined}
              onClick={interactive && canIgnite(r, c) ? () => onSelectOrigin({ row: r, col: c }) : undefined}
            />
          )
        }
        return null
      })}

      {/* 方眼（部屋のみ） */}
      {!compact &&
        cells
          .filter(cell => cell.kind === 'room')
          .map(({ i, x, y, w, h }) => (
            <rect key={`g${i}`} x={x + 0.5} y={y + 0.5} width={w - 1} height={h - 1} fill="none" stroke="#e7e5e0" strokeWidth="0.6" pointerEvents="none" />
          ))}

      {/* 火 */}
      {layers.fire &&
        cells.map(({ i, kind, x, y, w, h }) => {
          if (kind === 'wall' || kind === 'fwall' || kind === 'exit' || kind === 'exit-closed') return null
          const ignited = ignitedAt[i] >= 0 && ignitedAt[i] <= frame.step
          if (ignited && fuelLeft[i] <= 0.001) {
            return <rect key={`b${i}`} x={x} y={y} width={w} height={h} fill="#57534e" opacity={0.85} pointerEvents="none" />
          }
          if (ignited) {
            return (
              <rect
                key={`b${i}`}
                x={x}
                y={y}
                width={w}
                height={h}
                fill={fireColor(heat[i])}
                className="flame-flicker"
                style={{ animationDelay: `${(i % 7) * 0.13}s` }}
                pointerEvents="none"
              />
            )
          }
          if (heat[i] > 0.12) {
            return <rect key={`b${i}`} x={x} y={y} width={w} height={h} fill="#fbbf24" opacity={Math.min(0.6, heat[i])} pointerEvents="none" />
          }
          return null
        })}

      {/* 煙 */}
      {layers.smoke &&
        cells.map(({ i, kind, x, y, w, h }) => {
          if (smoke[i] < 0.03 || kind === 'wall' || kind === 'fwall') return null
          // 燃焼中のマスは炎が見えるよう煙を薄く描く
          const burning = layers.fire && ignitedAt[i] >= 0 && fuelLeft[i] > 0.001
          return (
            <rect key={`s${i}`} x={x} y={y} width={w} height={h} fill="#475569" opacity={Math.min(burning ? 0.2 : 0.72, smoke[i] * 0.8)} pointerEvents="none" />
          )
        })}

      {/* 壁・扉 */}
      {cells.map(({ i, kind, x, y, w, h, r }) => {
        if (kind === 'wall') return <rect key={`w${i}`} x={x} y={y} width={w} height={h} fill="#334155" />
        if (kind === 'fwall') return <rect key={`w${i}`} x={x} y={y} width={w} height={h} fill="#b91c1c" />
        if (kind === 'door') {
          // 居室の扉：閉＝扉板、開＝開いた扉の軌跡
          const closed = config.roomDoors === 'closed'
          const up = r < CORRIDOR_ROW
          return closed ? (
            <rect key={`d${i}`} x={x + 2} y={y + h / 2 - 1.5} width={w - 4} height={3} fill="#92400e" rx="1" pointerEvents="none" />
          ) : (
            <path
              key={`d${i}`}
              d={up ? `M${x + 3} ${y + h} l0 ${-14} M${x + 3} ${y + h - 14} A14 14 0 0 1 ${x + w - 3} ${y + h}` : `M${x + 3} ${y} l0 14 M${x + 3} ${y + 14} A14 14 0 0 0 ${x + w - 3} ${y}`}
              fill="none"
              stroke="#b45309"
              strokeWidth="1"
              strokeDasharray="2 2"
              pointerEvents="none"
            />
          )
        }
        if (kind === 'fdoor') {
          return (
            <g key={`fd${i}`} pointerEvents="none">
              <rect x={x} y={y - 3} width={w} height={3} fill="#b91c1c" />
              <rect x={x} y={y + h} width={w} height={3} fill="#b91c1c" />
              {doorClosed ? (
                <motion.rect
                  x={x + 1}
                  y={y}
                  width={w - 2}
                  height={h}
                  fill="#dc2626"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  style={{ transformOrigin: `${x + w / 2}px ${y}px`, transformBox: 'view-box' }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              ) : (
                <rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} fill="none" stroke="#dc2626" strokeWidth="1" strokeDasharray="3 2" />
              )}
            </g>
          )
        }
        if (kind === 'exit' || kind === 'exit-closed') {
          const open = kind === 'exit'
          return (
            <g key={`e${i}`}>
              <rect x={x} y={y} width={w} height={h} fill={open ? '#0d8573' : '#94a3b8'} />
              {open ? (
                <>
                  {/* 階段の段々 */}
                  {[5, 10, 15, 20].map(d => (
                    <line key={d} x1={x + 3} x2={x + w - 3} y1={y + d} y2={y + d} stroke="#c9f5ec" strokeWidth="0.8" opacity="0.6" />
                  ))}
                  <text x={x + w / 2} y={y + h / 2 + 3} fontSize="7.5" fontWeight="700" fill="#fff" textAnchor="middle">
                    EXIT
                  </text>
                </>
              ) : (
                <path d={`M${x + 7} ${y + 7} L${x + w - 7} ${y + h - 7} M${x + w - 7} ${y + 7} L${x + 7} ${y + h - 7}`} stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              )}
            </g>
          )
        }
        return null
      })}

      {/* 室名 */}
      {!compact &&
        ROOM_LABELS.map(l => (
          <text key={l.n} x={l.x} y={l.y} fontSize="7" fill="#94a3b8" pointerEvents="none">
            室{l.n}
          </text>
        ))}

      {/* 区画ラベル */}
      {config.compartment && (
        <text x={X[COMPARTMENT_COL] + THIN / 2} y={-PAD + 2} fontSize="8" fontWeight="700" fill="#b91c1c" textAnchor="middle">
          防火区画{doorClosed ? '（防火戸 閉鎖）' : ''}
        </text>
      )}

      {/* 出火点 */}
      <g transform={`translate(${cx(config.origin.col)} ${cy(config.origin.row)})`} pointerEvents="none">
        <circle r="9" fill="none" stroke="#dc2626" strokeWidth="1.5" className="pulse-ring" />
        <path
          d="M0 -8 C 3 -4 6 -2 6 2.5 A6 6 0 0 1 -6 2.5 C -6 -0.5 -3.5 -2 -2.5 -5 C -1.5 -3 -0.5 -2.5 0 -1.5 C 0.8 -3.5 0.5 -6 0 -8 Z"
          fill="#f2641f"
          stroke="#fff"
          strokeWidth="1.2"
        />
      </g>

      {/* 在館者 */}
      {layers.evac &&
        occupants.map(p => {
          const gone = p.status === 'evacuated'
          const trapped = p.status === 'trapped'
          return (
            <g
              key={p.id}
              style={{
                transform: `translate(${cx(p.c)}px, ${cy(p.r)}px)`,
                transition: 'transform 0.22s linear, opacity 0.4s',
                opacity: gone ? 0 : 1,
              }}
              pointerEvents="none"
            >
              <circle r={compact ? 4.5 : 5.5} fill={trapped ? '#b91c1c' : '#0d8573'} stroke="#fff" strokeWidth="1.5" />
              {trapped && (
                <text y="2.6" fontSize="7" fontWeight="900" fill="#fff" textAnchor="middle">
                  !
                </text>
              )}
            </g>
          )
        })}

      {/* 方位・凡例の補助 */}
      {!compact && (
        <>
          <text x={0} y={HEIGHT + PAD + 2} fontSize="7.5" fill="#64748b">
            ← 西
          </text>
          <text x={WIDTH} y={HEIGHT + PAD + 2} fontSize="7.5" fill="#64748b" textAnchor="end">
            東 →
          </text>
        </>
      )}
    </svg>
  )
}

/** 凡例 */
export function PlanLegend({ className = '' }) {
  const items = [
    { swatch: <span className="w-3.5 h-3.5 rounded-sm bg-amber-300/70" />, label: '加熱中' },
    { swatch: <span className="w-3.5 h-3.5 rounded-sm bg-fire-500" />, label: '燃焼中' },
    { swatch: <span className="w-3.5 h-3.5 rounded-sm bg-stone-600" />, label: '焼損' },
    { swatch: <span className="w-3.5 h-3.5 rounded-sm bg-slate-500/70" />, label: '煙' },
    { swatch: <span className="w-3.5 h-3.5 rounded-sm bg-[#bfeee3] border border-evac-500/40" />, label: '廊下（安全）' },
    { swatch: <span className="w-3.5 h-3.5 rounded-sm bg-[#fca5a5]" />, label: '廊下（危険）' },
    { swatch: <span className="w-3.5 h-3.5 rounded-full bg-evac-600 ring-2 ring-white" />, label: '避難中の人' },
    { swatch: <span className="w-3.5 h-3.5 rounded-full bg-danger-600 ring-2 ring-white" />, label: '要救助' },
    { swatch: <span className="w-3.5 h-1.5 bg-danger-600" />, label: '防火区画・防火戸' },
  ]
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600 ${className}`} aria-label="凡例">
      {items.map(item => (
        <li key={item.label} className="flex items-center gap-1.5">
          {item.swatch}
          {item.label}
        </li>
      ))}
    </ul>
  )
}
