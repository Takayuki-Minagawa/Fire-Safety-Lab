import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChartLegend, TimelineChart } from './Charts'
import { Panel, PlaybackBar, Segmented } from './ui'
import {
  CHAR_RATE, CRITICAL_TEMP, MAX_MINUTES, MEMBERS, MEMBER_ORDER, RATINGS,
  fireTemperature, formatMinutes, pointAt, simulateMember,
} from '../lib/memberSim'
import { usePlayback } from '../lib/hooks'
import { useProgress } from '../lib/progress'

const CHALLENGES = [
  { id: 'coated', target: 60, text: '鉄骨柱で「1時間」耐えられる被覆の厚さを見つけよう' },
  { id: 'wood', target: 45, text: '木造柱で「45分」耐えられる断面寸法を見つけよう' },
  { id: 'rc', target: 120, text: 'RC柱で「2時間」耐えられるかぶり厚さを見つけよう' },
]

/** 温度 → 色（常温の灰色 → 黄 → 橙 → 赤） */
function tempColor(t) {
  const stops = [
    [20, [203, 213, 225]],
    [200, [253, 224, 71]],
    [400, [251, 146, 60]],
    [550, [239, 68, 68]],
    [900, [153, 27, 27]],
  ]
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1]
      const [t1, c1] = stops[i]
      const k = (t - t0) / (t1 - t0)
      return `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(',')})`
    }
  }
  return 'rgb(153,27,27)'
}

/** 部材の断面図 */
function CrossSection({ memberId, value, point }) {
  const fire = point.fire
  const glow = Math.min(1, (fire - 20) / 900)

  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[260px] mx-auto h-auto" role="img" aria-label="部材の断面図">
      {/* 周囲の火災 */}
      <rect x="0" y="0" width="220" height="220" rx="16" fill="#fff7ed" />
      <g opacity={glow * 0.55}>
        <rect x="0" y="0" width="220" height="220" rx="16" fill="#f97316" className="flame-flicker" />
      </g>

      {memberId === 'steel' || memberId === 'coated' ? (
        <g>
          {memberId === 'coated' && (
            <rect
              x={60 - value * 0.6}
              y={50 - value * 0.6}
              width={100 + value * 1.2}
              height={120 + value * 1.2}
              rx="6"
              fill="#e7e5e4"
              stroke="#a8a29e"
              strokeDasharray="3 2"
            />
          )}
          {/* H形鋼 */}
          <path d="M60 50 h100 v14 h-43 v92 h43 v14 h-100 v-14 h43 v-92 h-43 z" fill={tempColor(point.member)} stroke="#334155" strokeWidth="1.5" />
          <text x="110" y="205" textAnchor="middle" fontSize="11" fill="#475569">
            {memberId === 'coated' ? `耐火被覆 ${value}mm` : '被覆なし（むき出し）'}
          </text>
        </g>
      ) : memberId === 'rc' ? (
        <g>
          <rect x="40" y="40" width="140" height="140" rx="3" fill="#d6d3d1" stroke="#78716c" strokeWidth="1.5" />
          {/* 表面ほど熱い：外側から温度のグラデーション */}
          <rect x="40" y="40" width="140" height="140" rx="3" fill="none" stroke={tempColor(fire * 0.9)} strokeWidth={Math.min(30, 6 + point.t / 6)} opacity="0.75" />
          {(() => {
            const d = 44 + value * 0.5 // かぶり位置（表示用に縮尺）
            const pos = [d, 110, 220 - d]
            return pos.flatMap(x => pos.map(y => (x === 110 && y === 110 ? null : (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill={tempColor(point.member)} stroke="#1f2937" strokeWidth="1.5" />
            ))))
          })()}
          <text x="110" y="205" textAnchor="middle" fontSize="11" fill="#475569">かぶり厚さ {value}mm（●＝鉄筋）</text>
        </g>
      ) : (
        <g>
          {(() => {
            const scale = 150 / 450
            const size = value * scale
            const char = Math.min(size / 2, CHAR_RATE * point.t * scale)
            const x0 = 110 - size / 2
            return (
              <>
                <rect x={x0} y={x0 - 5} width={size} height={size} fill="#1c1917" rx="2" />
                <rect x={x0 + char} y={x0 - 5 + char} width={Math.max(0, size - char * 2)} height={Math.max(0, size - char * 2)} fill="#d4a373" rx="1" />
                {/* 年輪っぽい模様 */}
                {size - char * 2 > 10 && (
                  <circle cx="110" cy="105" r={Math.max(2, (size - char * 2) / 4)} fill="none" stroke="#b08155" strokeWidth="1" />
                )}
              </>
            )
          })()}
          <text x="110" y="205" textAnchor="middle" fontSize="11" fill="#475569">{value}mm角（黒＝炭化層）</text>
        </g>
      )}
    </svg>
  )
}

export default function MemberSimulator() {
  const { recordMember, notify } = useProgress()
  const [memberId, setMemberId] = useState('coated')
  const [values, setValues] = useState(() =>
    Object.fromEntries(MEMBER_ORDER.map(id => [id, MEMBERS[id].param?.default ?? 0])),
  )
  const [pinned, setPinned] = useState([])

  const member = MEMBERS[memberId]
  const value = values[memberId]
  const result = useMemo(() => simulateMember(memberId, value), [memberId, value])
  const failTime = result.failTime
  const minutes = failTime ?? MAX_MINUTES

  const handleEnd = () => {
    recordMember(memberId, minutes)
    const ch = CHALLENGES.find(c => c.id === memberId)
    if (ch && minutes >= ch.target) {
      notify({ icon: '🏗️', title: 'チャレンジ達成！', text: `${member.label}：${formatMinutes(failTime)}耐えました` })
    }
  }
  const playback = usePlayback(MAX_MINUTES * 2, { baseInterval: 40, onEnd: handleEnd })
  const t = playback.step / 2
  const point = pointAt(result.series, t)
  const failed = failTime !== null && t >= failTime
  const isWood = memberId === 'wood'

  const series = isWood
    ? [
        { label: '残っている断面の割合', color: '#b45309', values: result.series.map(p => p.residual) },
      ]
    : [
        { label: '火災温度（標準加熱曲線）', color: '#f2641f', values: result.series.map(p => p.fire) },
        { label: memberId === 'rc' ? '鉄筋の温度' : '鋼材の温度', color: '#1e3a5f', values: result.series.map(p => p.member) },
      ]

  const challenge = CHALLENGES.find(c => c.id === memberId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-5 items-start">
      <div className="min-w-0 lg:col-start-2 lg:row-start-1">
        <Panel title="耐火試験のシミュレーション" icon="🔥">
          <PlaybackBar
            playback={playback}
            max={MAX_MINUTES * 2}
            formatLabel={() => `${Math.floor(t)}分 / ${MAX_MINUTES}分`}
            color="#1e3a5f"
            label="加熱開始からの時間"
          />
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-5 mt-5 items-center">
            <div className="relative">
              <CrossSection memberId={memberId} value={value} point={point} />
              {failed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-x-0 top-2 mx-auto w-fit bg-danger-600 text-white text-xs font-black rounded-full px-3 py-1 shadow"
                >
                  ⚠ 耐力の限界（{Math.round(failTime)}分）
                </motion.div>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-fire-50 p-3">
                <dt className="text-[11px] font-bold text-fire-700">火災温度</dt>
                <dd className="text-2xl font-black text-fire-700 tabular-nums">{Math.round(fireTemperature(t))}℃</dd>
              </div>
              <div className={`rounded-xl p-3 ${failed ? 'bg-red-50' : 'bg-slate-50'}`}>
                <dt className="text-[11px] font-bold text-slate-500">
                  {isWood ? '炭化した深さ' : memberId === 'rc' ? '鉄筋の温度' : '鋼材の温度'}
                </dt>
                <dd className={`text-2xl font-black tabular-nums ${failed ? 'text-danger-600' : 'text-ink-900'}`}>
                  {isWood ? `${Math.round(point.member)}mm` : `${Math.round(point.member)}℃`}
                </dd>
              </div>
              <div className="col-span-2 rounded-xl bg-ink-900 text-white p-4">
                <dt className="text-xs font-bold text-slate-300">耐火時間の目安</dt>
                <dd className="text-3xl font-black tabular-nums">{formatMinutes(failTime)}</dd>
                <dd className="text-[11px] text-slate-400 mt-1">
                  {isWood
                    ? `炭化速度 ${CHAR_RATE}mm/分として、残りの断面が半分を下回るまで`
                    : `${memberId === 'rc' ? '鉄筋' : '鋼材'}が限界温度（${CRITICAL_TEMP}℃）に達するまで`}
                </dd>
              </div>
            </dl>
          </div>

          <ul className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {RATINGS.map(r => {
              const ok = minutes >= r.minutes
              return (
                <li key={r.minutes} className={`rounded-xl border px-3 py-2 text-xs font-bold flex items-center gap-1.5 ${ok ? 'border-evac-500/40 bg-evac-50 text-evac-700' : 'border-slate-200 text-slate-400'}`}>
                  <span aria-hidden="true">{ok ? '✓' : '–'}</span>
                  {r.label}
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <div className="space-y-5 lg:col-start-1 lg:row-start-1 lg:row-span-2">
        <Panel title="部材と構法" icon="🏗️">
          <div className="space-y-5">
            <Segmented
              value={memberId}
              onChange={id => {
                setMemberId(id)
                playback.restart()
              }}
              columns={2}
              options={MEMBER_ORDER.map(id => ({ value: id, label: MEMBERS[id].short, desc: MEMBERS[id].label }))}
            />
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3">{member.description}</p>
            {member.param && (
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label htmlFor="member-param" className="text-xs font-bold text-slate-500">{member.param.label}</label>
                  <span className="text-lg font-black text-ink-900 tabular-nums">
                    {value}
                    <span className="text-xs font-bold text-slate-500 ml-0.5">{member.param.unit}</span>
                  </span>
                </div>
                <input
                  id="member-param"
                  type="range"
                  min={member.param.min}
                  max={member.param.max}
                  step={member.param.step}
                  value={value}
                  onChange={e => setValues(v => ({ ...v, [memberId]: Number(e.target.value) }))}
                  className="slider w-full"
                  style={{
                    '--pct': `${((value - member.param.min) / (member.param.max - member.param.min)) * 100}%`,
                    '--fill': '#1e3a5f',
                  }}
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>{member.param.min}{member.param.unit}</span>
                  <span>{member.param.max}{member.param.unit}</span>
                </div>
              </div>
            )}
          </div>
        </Panel>

        {challenge && (
          <Panel title="チャレンジ" icon="🎯">
            <p className="text-sm text-slate-700 leading-relaxed">{challenge.text}</p>
            <p className={`mt-2 text-sm font-bold rounded-lg px-3 py-2 ${minutes >= challenge.target ? 'bg-evac-100 text-evac-700' : 'bg-slate-100 text-slate-500'}`}>
              {minutes >= challenge.target
                ? `✓ 現在の条件で目標の${challenge.target}分をクリア！ 最後まで再生して確かめよう`
                : `現在：${formatMinutes(failTime)}（目標 ${challenge.target}分）`}
            </p>
          </Panel>
        )}

        <Panel title="考えてみよう" icon="🤔">
          <ul className="text-sm text-slate-600 space-y-2 leading-relaxed list-disc pl-5">
            <li>被覆の厚さを2倍にすると、耐火時間はちょうど2倍になる？</li>
            <li>同じ「1時間」でも、鉄骨・RC・木造で守り方はどう違う？</li>
            <li>木造の柱を太くすると、なぜ火災に強くなるのだろう？</li>
          </ul>
        </Panel>
      </div>

      <div className="space-y-5 min-w-0 lg:col-start-2 lg:row-start-2">

        <Panel title={isWood ? '残っている断面の変化' : '温度の変化'} icon="📈">
          <TimelineChart
            series={series}
            current={t}
            maxX={MAX_MINUTES}
            yMax={isWood ? 1 : 1100}
            yTicks={isWood ? [0, 0.5, 1] : [0, 250, 550, 800, 1100]}
            formatY={isWood ? v => `${Math.round(v * 100)}%` : v => `${v}℃`}
            xTicks={[0, 30, 60, 90, 120, 150, 180]}
            formatX={v => `${v}分`}
            refLines={isWood ? [{ y: 0.5, label: '必要な断面', color: '#b91c1c' }] : [{ y: CRITICAL_TEMP, label: `限界温度 ${CRITICAL_TEMP}℃`, color: '#b91c1c' }]}
            width={600}
            height={260}
            ariaLabel="加熱時間と温度の関係"
          />
          <ChartLegend items={series} />
          {!isWood && (
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              火災温度は耐火試験で使う「標準加熱曲線（ISO 834）」です。30分で約840℃、1時間で約950℃に達します。
            </p>
          )}
        </Panel>

        <Panel
          title="構法を比べる"
          icon="⚖️"
          aside={
            <button
              type="button"
              onClick={() =>
                setPinned(list =>
                  [{ id: Date.now(), label: member.short, detail: member.param ? `${value}${member.param.unit}` : '', minutes }, ...list].slice(0, 6),
                )
              }
              className="text-xs font-bold text-white bg-ink-800 hover:bg-ink-700 rounded-lg px-3 py-1.5"
            >
              ＋ 今の条件を追加
            </button>
          }
        >
          {pinned.length === 0 ? (
            <p className="text-sm text-slate-500">部材や寸法を変えて追加すると、耐火時間を棒グラフで比べられます。</p>
          ) : (
            <ul className="space-y-2">
              {pinned.map(p => (
                <li key={p.id} className="grid grid-cols-[110px_minmax(0,1fr)_64px_20px] items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700 truncate">
                    {p.label} <span className="text-slate-400">{p.detail}</span>
                  </span>
                  <span className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.span
                      className="block h-full rounded-full bg-ink-700"
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.minutes / MAX_MINUTES) * 100}%` }}
                    />
                  </span>
                  <span className="font-black tabular-nums text-right text-ink-900">{p.minutes >= MAX_MINUTES ? '180分+' : `${Math.round(p.minutes)}分`}</span>
                  <button type="button" onClick={() => setPinned(list => list.filter(x => x.id !== p.id))} className="text-slate-400 hover:text-danger-600" aria-label="削除">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
