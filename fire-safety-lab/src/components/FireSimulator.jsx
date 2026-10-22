import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FloorPlan, { PlanLegend } from './FloorPlan'
import { ChartLegend, SmokeSection, TimelineChart } from './Charts'
import { Gauge, Meter, Panel, PlaybackBar, Segmented, Toggle } from './ui'
import {
  DEFAULT_CONFIG, MATERIALS, MATERIAL_ORDER, MAX_STEP, ROOMS, STEP_SECONDS,
  explainResult, formatTime, roomNumber, safetyLevel, simulate,
} from '../lib/fireSim'
import { usePlayback } from '../lib/hooks'
import { useProgress } from '../lib/progress'
import { MISSIONS } from '../data/missions'

/** URL の ?preset= で開いたときの初期条件 */
const PRESETS = {
  material: { material: 'combustible', compartment: false, roomDoors: 'open' },
  evacuation: { twoWay: false, material: 'retardant', compartment: false, roomDoors: 'open' },
  compartment: { compartment: false, material: 'combustible', roomDoors: 'open' },
}

const MATERIAL_DESC = {
  noncombustible: '20分燃えない',
  quasi: '10分燃えない',
  retardant: '5分燃えない',
  combustible: '燃えやすい',
}

const stepsPerMinute = 60 / STEP_SECONDS

function summarizeConfig(config) {
  return [
    `室${roomNumber(config.origin.row, config.origin.col)}出火`,
    MATERIALS[config.material].label,
    config.compartment ? (config.fireDoor === 'auto' ? '区画あり' : '区画あり(戸が閉まらない)') : '区画なし',
    config.roomDoors === 'closed' ? '扉閉' : '扉開',
    config.twoWay ? '2方向避難' : '1方向避難',
    config.exhaust ? '排煙あり' : '排煙なし',
  ]
}

export default function FireSimulator({ preset }) {
  const { progress, clearMission, completeRun, notify } = useProgress()
  const [config, setConfig] = useState(() => ({ ...DEFAULT_CONFIG, ...(PRESETS[preset] ?? {}) }))
  const [layers, setLayers] = useState({ fire: true, smoke: true, evac: true })
  const [activeMission, setActiveMission] = useState(null)
  const [missionResult, setMissionResult] = useState(null)
  const [records, setRecords] = useState([])
  const lastRunKey = useRef(null)

  const sim = useMemo(() => simulate(config), [config])

  // 最後まで再生したら、ミッションの達成判定を行う
  const handleEnd = () => {
    const key = JSON.stringify(config)
    if (lastRunKey.current === key) return
    lastRunKey.current = key
    completeRun()
    const achieved = MISSIONS.filter(m => m.check(config, sim.frames))
    for (const m of achieved) {
      if (!progress.missions[m.id]) {
        clearMission(m.id)
        notify({ icon: m.icon, title: `ミッション達成：${m.title}`, text: m.goal })
      }
    }
    if (activeMission) setMissionResult({ id: activeMission, success: achieved.some(m => m.id === activeMission) })
  }

  const playback = usePlayback(MAX_STEP, { onEnd: handleEnd })
  const frame = sim.frames[playback.step]
  const { stats } = frame
  const level = safetyLevel(stats.safety)
  const tips = explainResult(config, frame)

  const update = patch => {
    setConfig(c => ({ ...c, ...patch }))
    setMissionResult(null)
  }

  const startMission = m => {
    setActiveMission(m.id)
    setMissionResult(null)
    if (m.start) setConfig(c => ({ ...DEFAULT_CONFIG, origin: c.origin, ...m.start }))
    playback.restart()
  }

  const series = useMemo(
    () => [
      { label: '延焼面積', color: '#f2641f', values: sim.frames.map(f => f.stats.burnRatio) },
      { label: '廊下の煙濃度', color: '#64748b', values: sim.frames.map(f => f.stats.corridorSmoke) },
      { label: '避難完了率', color: '#14a38b', values: sim.frames.map(f => f.stats.evacuated / f.stats.total), dashed: true },
    ],
    [sim],
  )

  const addRecord = () => {
    const end = sim.frames[MAX_STEP].stats
    const maxSmoke = Math.max(...sim.frames.map(f => f.stats.corridorSmoke))
    setRecords(list =>
      [{ id: Date.now(), conditions: summarizeConfig(config), end, maxSmoke }, ...list].slice(0, 5),
    )
  }

  const mission = MISSIONS.find(m => m.id === activeMission)
  const originRoom = roomNumber(config.origin.row, config.origin.col)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-5 items-start">
      {/* ───────── 平面図（スマホでは最初に表示） ───────── */}
      <div className="min-w-0 lg:col-start-2 lg:row-start-1">
        <Panel
          title="建物平面図"
          icon="📐"
          aside={
            <div className="flex gap-1" role="group" aria-label="表示する情報">
              {[
                { key: 'fire', label: '火', color: 'bg-fire-500' },
                { key: 'smoke', label: '煙', color: 'bg-slate-500' },
                { key: 'evac', label: '避難', color: 'bg-evac-500' },
              ].map(l => (
                <button
                  key={l.key}
                  type="button"
                  aria-pressed={layers[l.key]}
                  onClick={() => setLayers(s => ({ ...s, [l.key]: !s[l.key] }))}
                  className={`flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-1 border transition-colors ${
                    layers[l.key] ? 'border-slate-300 bg-white text-slate-700' : 'border-transparent bg-slate-100 text-slate-400 line-through'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${layers[l.key] ? l.color : 'bg-slate-300'}`} />
                  {l.label}
                </button>
              ))}
            </div>
          }
        >
          <PlaybackBar playback={playback} max={MAX_STEP} formatLabel={step => `${formatTime(step)} / 30分`} />
          <div className="mt-4 rounded-xl bg-slate-100/70 p-2 sm:p-3">
            <FloorPlan sim={sim} frame={frame} layers={layers} onSelectOrigin={origin => update({ origin })} />
          </div>
          <PlanLegend className="mt-3" />
        </Panel>
      </div>

      {/* ───────── 左カラム：ミッションと条件 ───────── */}
      <div className="space-y-5 lg:col-start-1 lg:row-start-1 lg:row-span-2">
        <Panel
          title="ミッション"
          icon="🎯"
          aside={
            <span className="text-xs font-bold text-evac-700 bg-evac-50 rounded-full px-2 py-0.5">
              {Object.values(progress.missions).filter(Boolean).length} / {MISSIONS.length} クリア
            </span>
          }
        >
          <ul className="grid grid-cols-4 gap-2 mb-3">
            {MISSIONS.map(m => {
              const cleared = progress.missions[m.id]
              const active = activeMission === m.id
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => startMission(m)}
                    title={m.title}
                    aria-label={`${m.title}${cleared ? '（クリア済み）' : ''}`}
                    aria-pressed={active}
                    className={`relative w-full aspect-square rounded-xl text-xl flex items-center justify-center border transition-all ${
                      active
                        ? 'border-fire-500 ring-2 ring-fire-400 bg-fire-50'
                        : cleared
                          ? 'border-evac-500/40 bg-evac-50'
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <span aria-hidden="true" className={cleared || active ? '' : 'grayscale opacity-70'}>{m.icon}</span>
                    {cleared && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-evac-500 text-white text-[11px] font-black flex items-center justify-center shadow">✓</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          <AnimatePresence mode="wait">
            {mission ? (
              <motion.div key={mission.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                  <span aria-hidden="true">{mission.icon}</span>
                  {mission.title}
                  {progress.missions[mission.id] && <span className="text-[10px] font-bold text-evac-700 bg-evac-100 rounded-full px-2 py-0.5">クリア済み</span>}
                </p>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">{mission.goal}</p>
                <details className="mt-2 text-xs text-slate-500">
                  <summary className="cursor-pointer font-bold text-slate-600">ヒントを見る</summary>
                  <p className="mt-1 leading-relaxed">{mission.hint}</p>
                </details>
                {missionResult?.id === mission.id && (
                  <p className={`mt-2 text-sm font-bold rounded-lg px-3 py-2 ${missionResult.success ? 'bg-evac-100 text-evac-700' : 'bg-amber-100 text-amber-800'}`}>
                    {missionResult.success ? '🎉 ミッション達成！' : '🤔 まだ達成できていません。条件を変えて再挑戦！'}
                  </p>
                )}
              </motion.div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed">
                アイコンを選ぶとミッションが始まります。条件を工夫して、最後（30分後）まで再生すると達成判定されます。
              </p>
            )}
          </AnimatePresence>
        </Panel>

        <Panel
          title="条件設定"
          icon="🛠️"
          aside={
            <button type="button" onClick={() => update({ ...DEFAULT_CONFIG, origin: config.origin })} className="text-xs font-bold text-slate-500 hover:text-fire-600">
              初期値に戻す
            </button>
          }
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="origin" className="block text-xs font-bold text-slate-500 mb-2">出火場所</label>
              <select
                id="origin"
                value={originRoom}
                onChange={e => update({ origin: ROOMS.find(r => r.n === Number(e.target.value)).cell })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"
              >
                {ROOMS.map(r => (
                  <option key={r.n} value={r.n}>
                    室{r.n}（{r.cell.col < 8 ? '西' : '東'}側・{r.cell.row < 5 ? '北' : '南'}）
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">平面図の部屋をクリックしても出火点を選べます</p>
            </div>

            <Segmented
              label="内装材料（壁・天井の仕上げ）"
              value={config.material}
              onChange={material => update({ material })}
              columns={2}
              options={MATERIAL_ORDER.map(id => ({ value: id, label: MATERIALS[id].label, desc: MATERIAL_DESC[id], swatch: MATERIALS[id].color }))}
            />

            <div className="space-y-2">
              <Toggle label="防火区画" desc="フロア中央を耐火性能のある壁で区切る" checked={config.compartment} onChange={compartment => update({ compartment })} />
              <AnimatePresence initial={false}>
                {config.compartment && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <Segmented
                      label="廊下の防火戸"
                      value={config.fireDoor}
                      onChange={fireDoor => update({ fireDoor })}
                      options={[
                        { value: 'auto', label: '自動で閉まる', icon: '🚪', desc: '煙を感知して閉鎖' },
                        { value: 'blocked', label: '閉まらない', icon: '📦', desc: '前に物が置かれている' },
                      ]}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Segmented
              label="居室の扉（開口部）"
              value={config.roomDoors}
              onChange={roomDoors => update({ roomDoors })}
              options={[
                { value: 'closed', label: '閉じている', desc: '火・煙が漏れにくい' },
                { value: 'open', label: '開いたまま', desc: '火・煙が廊下へ' },
              ]}
            />

            <Segmented
              label="避難経路"
              value={config.twoWay}
              onChange={twoWay => update({ twoWay })}
              options={[
                { value: true, label: '2方向避難', icon: '⇆', desc: '廊下の両端に階段' },
                { value: false, label: '1方向避難', icon: '←', desc: '西側の階段のみ' },
              ]}
            />

            <Toggle label="排煙設備" desc="煙を屋外に排出する" checked={config.exhaust} onChange={exhaust => update({ exhaust })} />
          </div>
        </Panel>
      </div>

      {/* ───────── 結果 ───────── */}
      <div className="space-y-5 lg:col-start-2 lg:row-start-2 min-w-0">

        <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-5">
          <Panel title="総合安全度" icon="🛡️">
            <Gauge
              value={stats.safety}
              label="学習用の目安"
              color={level.color}
              sub={<span className={`mt-2 text-sm font-black px-3 py-0.5 rounded-full ${level.bg} ${level.text}`}>{level.label}</span>}
            />
            <div className="mt-4 space-y-3">
              <Meter label="延焼面積" value={stats.burnRatio} color="#f2641f" />
              <Meter label="廊下の煙濃度" value={stats.corridorSmoke} color="#64748b" />
              <Meter
                label="避難完了"
                value={stats.evacuated / stats.total}
                display={`${stats.evacuated} / ${stats.total}人`}
                color="#14a38b"
              />
              {stats.trapped > 0 && (
                <p className="text-xs font-bold text-danger-600 bg-red-50 rounded-lg px-3 py-2">⚠ 要救助 {stats.trapped}人</p>
              )}
            </div>
          </Panel>

          <Panel title="なぜこうなった？" icon="💡">
            <ul className="space-y-2">
              {tips.map(t => (
                <li key={t.text} className="flex gap-2 text-sm leading-relaxed">
                  <span
                    className={`shrink-0 mt-0.5 w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                      t.type === 'good' ? 'bg-evac-100 text-evac-700' : t.type === 'bad' ? 'bg-red-100 text-danger-600' : 'bg-slate-100 text-slate-500'
                    }`}
                    aria-hidden="true"
                  >
                    {t.type === 'good' ? '✓' : t.type === 'bad' ? '!' : 'i'}
                  </span>
                  <span className="text-slate-700">{t.text}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Panel title="時間変化のグラフ" icon="📈">
            <TimelineChart
              series={series}
              current={playback.step}
              maxX={MAX_STEP}
              xTicks={[0, 30, 60, 90]}
              formatX={v => `${v / stepsPerMinute}分`}
              ariaLabel="延焼面積・煙濃度・避難完了率の時間変化"
            />
            <ChartLegend items={series} />
          </Panel>
          <Panel title="廊下の断面（煙層の高さ）" icon="🌫️">
            <SmokeSection smoke={stats.corridorSmoke} />
          </Panel>
        </div>

        <Panel
          title="結果を記録して比較"
          icon="🗂️"
          aside={
            <button type="button" onClick={addRecord} className="text-xs font-bold text-white bg-ink-800 hover:bg-ink-700 rounded-lg px-3 py-1.5">
              ＋ この条件の30分後を記録
            </button>
          }
        >
          {records.length === 0 ? (
            <p className="text-sm text-slate-500">条件を変えるたびに記録すると、結果を一覧で比べられます（最大5件）。</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="text-xs text-slate-500 text-left">
                    <th className="font-bold px-2 py-1">条件</th>
                    <th className="font-bold px-2 py-1 text-right">延焼</th>
                    <th className="font-bold px-2 py-1 text-right">煙(最大)</th>
                    <th className="font-bold px-2 py-1 text-right">避難</th>
                    <th className="font-bold px-2 py-1 text-right">安全度</th>
                    <th className="px-2 py-1"><span className="sr-only">削除</span></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {records.map(rec => {
                      const lv = safetyLevel(rec.end.safety)
                      return (
                        <motion.tr key={rec.id} initial={{ opacity: 0, backgroundColor: '#fff5ed' }} animate={{ opacity: 1, backgroundColor: '#ffffff' }} exit={{ opacity: 0 }} className="border-t border-slate-100">
                          <td className="px-2 py-2">
                            <div className="flex flex-wrap gap-1">
                              {rec.conditions.map(c => (
                                <span key={c} className="text-[11px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{c}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums">{Math.round(rec.end.burnRatio * 100)}%</td>
                          <td className="px-2 py-2 text-right tabular-nums">{Math.round(rec.maxSmoke * 100)}%</td>
                          <td className="px-2 py-2 text-right tabular-nums">{rec.end.evacuated}/{rec.end.total}</td>
                          <td className="px-2 py-2 text-right">
                            <span className={`font-black tabular-nums ${lv.text}`}>{rec.end.safety}</span>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button type="button" onClick={() => setRecords(list => list.filter(r => r.id !== rec.id))} className="text-slate-400 hover:text-danger-600 text-xs" aria-label="この記録を削除">
                              ✕
                            </button>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
