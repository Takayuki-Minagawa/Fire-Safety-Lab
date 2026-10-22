/**
 * 延焼・煙・避難の学習用簡易シミュレーションエンジン
 *
 * 平面図をマス目（セルオートマトン）で表し、1ステップごとに
 *   1. 熱の伝わり（延焼）
 *   2. 煙の発生と拡散
 *   3. 防火戸の自動閉鎖
 *   4. 在館者の避難行動
 * を計算する。乱数は使わず、同じ条件なら必ず同じ結果になる（決定論的）。
 * そのため全ステップを事前計算しておき、タイムスライダーで自由に行き来できる。
 *
 * ※ 物理的に厳密なモデルではなく、「条件の違いで結果がどう変わるか」を
 *    直感的に理解するための教育用モデルである。
 */

// ---------------------------------------------------------------------------
// 平面図の定義
//   .  居室の床      |  間仕切り壁     D  居室の扉
//   =  廊下          F  防火区画の壁   G  防火戸（区画なしの場合は廊下）
//   E  階段（避難口）
// ---------------------------------------------------------------------------
const ROOM_ROW = '....|...F...|....'
const DOOR_ROW = '||D|||D|F|D|||D||'
export const PLAN = [
  ROOM_ROW, ROOM_ROW, ROOM_ROW, ROOM_ROW,
  DOOR_ROW,
  'E=======G=======E',
  DOOR_ROW,
  ROOM_ROW, ROOM_ROW, ROOM_ROW, ROOM_ROW,
]
export const ROWS = PLAN.length
export const COLS = PLAN[0].length
export const CORRIDOR_ROW = 5
export const COMPARTMENT_COL = 8

/** 1ステップあたりの経過時間（秒） */
export const STEP_SECONDS = 20
/** 計算するステップ数（90ステップ = 30分） */
export const MAX_STEP = 90

/** 内装材料ごとのパラメータ（数値は学習用に調整した相対値） */
export const MATERIALS = {
  noncombustible: {
    id: 'noncombustible', label: '不燃材料', example: '石膏ボード・コンクリートなど',
    spread: 0.05, smoke: 0.35, fuel: 0.6, wallFuel: 0, wallCond: 0.15, color: '#60a5fa',
  },
  quasi: {
    id: 'quasi', label: '準不燃材料', example: '木毛セメント板など',
    spread: 0.085, smoke: 0.5, fuel: 0.8, wallFuel: 0, wallCond: 0.25, color: '#34d399',
  },
  retardant: {
    id: 'retardant', label: '難燃材料', example: '難燃合板など',
    spread: 0.12, smoke: 0.7, fuel: 0.95, wallFuel: 0.25, wallCond: 0.35, color: '#fbbf24',
  },
  combustible: {
    id: 'combustible', label: '可燃材料', example: '一般の木質パネル・可燃性の装飾など',
    spread: 0.2, smoke: 1, fuel: 1.2, wallFuel: 0.45, wallCond: 0.55, color: '#f87171',
  },
}
export const MATERIAL_ORDER = ['noncombustible', 'quasi', 'retardant', 'combustible']

export const DEFAULT_CONFIG = {
  material: 'quasi',
  compartment: true,
  fireDoor: 'auto', // 'auto' = 自動閉鎖 / 'blocked' = 物が置かれて閉まらない
  roomDoors: 'closed', // 'closed' = 居室の扉は閉 / 'open' = 開けたまま
  twoWay: true, // true = 2方向避難（両端に階段）
  exhaust: false, // 排煙設備
  origin: { row: 2, col: 2 },
}

/** 在館者の初期位置 */
export const OCCUPANT_START = [
  [1, 1], [2, 3], [1, 6], [2, 10], [1, 14], [2, 15],
  [8, 1], [9, 6], [8, 7], [8, 10], [9, 14], [8, 15],
]

const IGNITION = 0.5 // この熱量を超えると着火
const GROWTH = 0.22 // 燃焼中セルの火勢の成長率
const BURN_RATE = 0.035 // 燃料の消費速度
const SMOKE_DIFFUSION = 0.22
const ALARM_STEP = 2 // 火災報知・避難開始までのステップ（出火室の人は即座に避難開始）
const SMOKE_SLOW = 0.35 // この煙濃度以上で歩行が遅くなる
const EXPOSURE_LIMIT = 7 // 煙・熱への暴露がこれを超えると自力避難困難
const NEIGHBORS = [[-1, 0], [1, 0], [0, -1], [0, 1]]

const idx = (r, c) => r * COLS + c

/** マスごとのわずかなばらつき（決定論的な疑似ノイズ） */
function noise(r, c) {
  const x = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453
  return 0.85 + (x - Math.floor(x)) * 0.3
}

/** 居室の番号（1〜8）を返す。居室でなければ 0 */
export function roomNumber(r, c) {
  if (PLAN[r][c] !== '.') return 0
  const colGroup = c < 4 ? 0 : c < 8 ? 1 : c < 12 ? 2 : 3
  return (r < CORRIDOR_ROW ? 1 : 5) + colGroup
}

/** 出火場所の選択肢：各室の中央付近のマス */
export const ROOMS = (() => {
  const rooms = {}
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const n = roomNumber(r, c)
      if (n) (rooms[n] ??= []).push({ row: r, col: c })
    }
  }
  return Object.entries(rooms)
    .map(([n, cells]) => {
      const mid = key => Math.round((Math.min(...cells.map(x => x[key])) + Math.max(...cells.map(x => x[key]))) / 2)
      return { n: Number(n), cell: { row: mid('row'), col: mid('col') } }
    })
    .sort((a, b) => a.n - b.n)
})()

/** 区画の東西（防火区画の壁より左が西側） */
export const sideOf = c => (c < COMPARTMENT_COL ? 'west' : c > COMPARTMENT_COL ? 'east' : 'line')

/** 条件に応じてセルの種類を決める */
export function buildLayout(config) {
  const kinds = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = PLAN[r][c]
      let kind
      switch (ch) {
        case '.': kind = 'room'; break
        case '=': kind = 'corridor'; break
        case '|': kind = 'wall'; break
        case 'D': kind = 'door'; break
        case 'F': kind = config.compartment ? 'fwall' : 'wall'; break
        case 'G': kind = config.compartment ? 'fdoor' : 'corridor'; break
        case 'E': kind = c === 0 || config.twoWay ? 'exit' : 'exit-closed'; break
        default: kind = 'wall'
      }
      kinds.push(kind)
    }
  }
  return kinds
}

export const isFloor = kind => kind === 'room' || kind === 'corridor' || kind === 'door' || kind === 'fdoor'
const isWalkable = kind => isFloor(kind) || kind === 'exit'

/** 出火点に選べるマスかどうか */
export function canIgnite(r, c) {
  return PLAN[r]?.[c] === '.'
}

/**
 * 条件 config で MAX_STEP まで計算し、各ステップの状態（frames）を返す。
 */
export function simulate(config = DEFAULT_CONFIG, maxStep = MAX_STEP) {
  const mat = MATERIALS[config.material] ?? MATERIALS.quasi
  const kinds = buildLayout(config)
  const n = ROWS * COLS

  // 燃料（燃えるものの量）
  const fuel = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const k = kinds[i]
    if (k === 'room') fuel[i] = mat.fuel
    else if (k === 'corridor' || k === 'door' || k === 'fdoor') fuel[i] = mat.fuel * 0.5
    else if (k === 'wall') fuel[i] = mat.wallFuel
  }

  let heat = new Float32Array(n)
  let smoke = new Float32Array(n)
  const ignitedAt = new Int16Array(n).fill(-1)

  const o = config.origin
  const oi = idx(o.row, o.col)
  if (canIgnite(o.row, o.col)) {
    heat[oi] = 0.6
    ignitedAt[oi] = 0
  }

  const originRoom = roomNumber(o.row, o.col)
  let occupants = OCCUPANT_START.map(([r, c], id) => ({
    id, r, c, status: 'waiting', exposure: 0, startStep: roomNumber(r, c) === originRoom ? 0 : ALARM_STEP,
  }))

  let fireDoorClosedAt = null

  /** 熱の伝わりやすさ（0〜1） */
  const heatFactor = i => {
    switch (kinds[i]) {
      case 'room':
      case 'corridor': return 1
      case 'door': return config.roomDoors === 'open' ? 0.9 : 0.12
      case 'wall': return mat.wallCond
      case 'fdoor': return fireDoorClosedAt === null ? 1 : 0
      default: return 0
    }
  }
  /** 煙の流れやすさ（0〜1） */
  const smokeFactor = i => {
    switch (kinds[i]) {
      case 'room':
      case 'corridor': return 1
      case 'door': return config.roomDoors === 'open' ? 1 : 0.2
      case 'fdoor': return fireDoorClosedAt === null ? 1 : 0.02
      default: return 0
    }
  }

  const frames = []
  const snapshot = step => {
    const floorCells = []
    let burned = 0
    let corridorSmoke = 0
    let corridorCount = 0
    const sideBurned = { west: 0, east: 0 }
    for (let i = 0; i < n; i++) {
      if (!isFloor(kinds[i])) continue
      floorCells.push(i)
      if (ignitedAt[i] >= 0) {
        burned++
        sideBurned[sideOf(i % COLS)] = (sideBurned[sideOf(i % COLS)] ?? 0) + 1
      }
      if (Math.floor(i / COLS) === CORRIDOR_ROW) {
        corridorSmoke += smoke[i]
        corridorCount++
      }
    }
    const evacuated = occupants.filter(p => p.status === 'evacuated').length
    const trapped = occupants.filter(p => p.status === 'trapped').length
    const burnRatio = burned / floorCells.length
    const smokeRatio = corridorSmoke / corridorCount
    frames.push({
      step,
      heat: Float32Array.from(heat),
      smoke: Float32Array.from(smoke),
      ignitedAt: Int16Array.from(ignitedAt),
      fuelLeft: Float32Array.from(fuel),
      fireDoorClosedAt,
      occupants: occupants.map(p => ({ ...p })),
      stats: {
        burnRatio,
        corridorSmoke: smokeRatio,
        evacuated,
        trapped,
        total: occupants.length,
        sideBurned,
        safety: safetyScore(burnRatio, smokeRatio, trapped / occupants.length),
      },
    })
  }

  snapshot(0)

  for (let step = 1; step <= maxStep; step++) {
    const nextHeat = Float32Array.from(heat)
    const nextSmoke = Float32Array.from(smoke)

    // --- 1. 延焼 ---------------------------------------------------------
    for (let i = 0; i < n; i++) {
      const kind = kinds[i]
      if (kind === 'fwall' || kind === 'exit' || kind === 'exit-closed') continue
      const r = Math.floor(i / COLS)
      const c = i % COLS
      const burning = ignitedAt[i] >= 0 && fuel[i] > 0

      if (burning) {
        nextHeat[i] = heat[i] + GROWTH * (1 - heat[i])
        fuel[i] = Math.max(0, fuel[i] - BURN_RATE * heat[i])
      } else if (ignitedAt[i] >= 0) {
        nextHeat[i] = heat[i] * 0.9 // 燃え尽きて冷えていく
      } else {
        nextHeat[i] = heat[i] * 0.96
      }

      // 隣接セルから受け取る熱
      const f = heatFactor(i)
      if (f > 0) {
        let q = 0
        for (const [dr, dc] of NEIGHBORS) {
          const nr = r + dr
          const nc = c + dc
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
          const j = idx(nr, nc)
          const src = ignitedAt[j] >= 0 && fuel[j] > 0
            ? heat[j]
            : kinds[j] === 'wall' || kinds[j] === 'door' ? heat[j] * 0.6 : 0
          if (src > 0) q += mat.spread * src * Math.min(f, heatFactor(j) || 0) * noise(r, c)
        }
        nextHeat[i] = Math.min(1, nextHeat[i] + q * (1 - nextHeat[i]) * 2)
      }

      if (ignitedAt[i] < 0 && fuel[i] > 0 && nextHeat[i] >= IGNITION) ignitedAt[i] = step
    }

    // --- 2. 煙 -----------------------------------------------------------
    for (let i = 0; i < n; i++) {
      const f = smokeFactor(i)
      if (f === 0) continue
      const r = Math.floor(i / COLS)
      const c = i % COLS
      if (ignitedAt[i] >= 0 && fuel[i] > 0) nextSmoke[i] += mat.smoke * heat[i] * 0.22
      for (const [dr, dc] of NEIGHBORS) {
        const nr = r + dr
        const nc = c + dc
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
        const j = idx(nr, nc)
        const g = Math.min(f, smokeFactor(j))
        if (g > 0) nextSmoke[i] += SMOKE_DIFFUSION * g * (smoke[j] - smoke[i])
      }
      const loss = config.exhaust ? 0.12 : 0.004
      nextSmoke[i] = Math.max(0, Math.min(1, nextSmoke[i] * (1 - loss)))
    }

    heat = nextHeat
    smoke = nextSmoke

    // --- 3. 防火戸の自動閉鎖（煙感知器が煙を感知したら閉まる） ------------
    if (config.compartment && config.fireDoor === 'auto' && fireDoorClosedAt === null) {
      const west = smoke[idx(CORRIDOR_ROW, COMPARTMENT_COL - 1)]
      const east = smoke[idx(CORRIDOR_ROW, COMPARTMENT_COL + 1)]
      if (Math.max(west, east) > 0.06) fireDoorClosedAt = step
    }

    // --- 4. 避難 ---------------------------------------------------------
    const dist = evacuationCostMap(kinds, heat, smoke)
    occupants = occupants.map(p => movePerson(p, step, dist, heat, smoke))

    snapshot(step)
  }

  return { config, kinds, frames }
}

/** 総合安全度（0〜100）。延焼・煙・逃げ遅れを重み付けした学習用の指標 */
export function safetyScore(burnRatio, smokeRatio, trappedRatio) {
  const risk = 0.3 * burnRatio + 0.25 * Math.min(1, smokeRatio * 1.4) + 0.45 * trappedRatio
  return Math.round(Math.max(0, Math.min(1, 1 - risk)) * 100)
}

/** 避難口までの「避難コスト」をダイクストラ法で求める（煙・熱が濃いほど高コスト） */
function evacuationCostMap(kinds, heat, smoke) {
  const n = ROWS * COLS
  const dist = new Float32Array(n).fill(Infinity)
  const queue = []
  for (let i = 0; i < n; i++) {
    if (kinds[i] === 'exit') {
      dist[i] = 0
      queue.push(i)
    }
  }
  // セル数が少ないので単純な配列ベースの優先度キューで十分
  while (queue.length) {
    let best = 0
    for (let k = 1; k < queue.length; k++) if (dist[queue[k]] < dist[queue[best]]) best = k
    const i = queue.splice(best, 1)[0]
    const r = Math.floor(i / COLS)
    const c = i % COLS
    for (const [dr, dc] of NEIGHBORS) {
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
      const j = idx(nr, nc)
      if (!isWalkable(kinds[j]) || kinds[j] === 'exit' || heat[j] >= 0.55) continue
      const cost = 1 + smoke[j] * 6 + (heat[j] > 0.3 ? 5 : 0)
      if (dist[i] + cost < dist[j]) {
        dist[j] = dist[i] + cost
        queue.push(j)
      }
    }
  }
  return dist
}

function movePerson(p, step, dist, heat, smoke) {
  if (p.status === 'evacuated' || p.status === 'trapped') return p
  const here = idx(p.r, p.c)
  const next = { ...p }

  // 暴露量の蓄積
  if (smoke[here] > 0.2) next.exposure += smoke[here]
  if (heat[here] > 0.3) next.exposure += heat[here] * 2
  if (next.exposure >= EXPOSURE_LIMIT || heat[here] >= 0.75) {
    next.status = 'trapped'
    return next
  }

  if (step < p.startStep) return next
  next.status = 'moving'

  // 煙が濃いと視界が悪く、2ステップに1回しか進めない
  if (smoke[here] > SMOKE_SLOW && step % 2 === 1) return next

  let best = null
  let bestDist = dist[here]
  for (const [dr, dc] of NEIGHBORS) {
    const nr = p.r + dr
    const nc = p.c + dc
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
    const d = dist[idx(nr, nc)]
    if (d < bestDist) {
      bestDist = d
      best = [nr, nc]
    }
  }
  if (best) {
    next.r = best[0]
    next.c = best[1]
    if (bestDist === 0) next.status = 'evacuated'
  }
  return next
}

/** 経過時間の表示（ステップ → 「m分ss秒」） */
export function formatTime(step) {
  const sec = step * STEP_SECONDS
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}分${String(s).padStart(2, '0')}秒`
}

/**
 * 結果から学習ポイント（なぜこうなったか）を生成する
 */
export function explainResult(config, frame) {
  const tips = []
  const { stats } = frame
  const originSide = sideOf(config.origin.col)
  const otherSide = originSide === 'west' ? 'east' : 'west'
  const otherSideLabel = otherSide === 'east' ? '東側' : '西側'

  if (config.compartment) {
    if (config.fireDoor === 'auto') {
      if (frame.fireDoorClosedAt !== null) {
        tips.push({
          type: 'good',
          text: `煙感知器が作動して防火戸が ${formatTime(frame.fireDoorClosedAt)} に閉鎖。${otherSideLabel}の区画への火と煙の侵入を防いでいます。`,
        })
      } else {
        tips.push({ type: 'info', text: '防火戸は待機中です。廊下に煙が届くと自動的に閉まります。' })
      }
    } else if ((stats.sideBurned[otherSide] ?? 0) > 0) {
      tips.push({
        type: 'bad',
        text: `防火戸の前に物が置かれ閉まらなかったため、区画の壁があっても${otherSideLabel}へ延焼しました。防火戸の閉鎖障害は実際の火災でも大きな問題です。`,
      })
    } else {
      tips.push({ type: 'bad', text: '防火戸が閉まらない状態です。開いた防火戸から火や煙が隣の区画に流れ込みます。' })
    }
  } else {
    tips.push({ type: 'bad', text: '防火区画がないため、火と煙が廊下を通じてフロア全体に広がりやすくなっています。' })
  }

  const mat = MATERIALS[config.material]
  if (config.material === 'noncombustible' || config.material === 'quasi') {
    tips.push({ type: 'good', text: `内装が${mat.label}なので燃え広がりが遅く、煙の発生も抑えられています。` })
  } else {
    tips.push({ type: 'bad', text: `内装が${mat.label}のため、壁や天井を伝って火が速く広がり、煙も多く発生します。` })
  }

  if (config.roomDoors === 'open') {
    tips.push({ type: 'bad', text: '居室の扉が開いていたため、煙が廊下（避難経路）へ流れ出ています。' })
  } else {
    tips.push({ type: 'good', text: '居室の扉が閉まっているので、出火室から廊下への煙の流出が抑えられています。' })
  }

  if (config.exhaust) {
    tips.push({ type: 'good', text: '排煙設備が煙を屋外に排出し、避難経路の視界を確保しています。' })
  }

  if (!config.twoWay) {
    tips.push({
      type: stats.trapped > 0 ? 'bad' : 'info',
      text: stats.trapped > 0
        ? '避難口が1方向しかないため、火や煙で経路が塞がれると逃げ場がなくなりました。2方向避難の大切さがわかります。'
        : '避難口が1方向だけです。出火位置によっては逃げ道が塞がれるおそれがあります。',
    })
  } else {
    tips.push({ type: 'good', text: '2方向避難が確保されているので、一方が塞がれてももう一方へ逃げられます。' })
  }

  return tips
}

/** 安全度に応じたラベルと色 */
export function safetyLevel(score) {
  if (score >= 80) return { label: '安全', color: '#0d9488', bg: 'bg-teal-50', text: 'text-teal-700' }
  if (score >= 60) return { label: 'やや注意', color: '#65a30d', bg: 'bg-lime-50', text: 'text-lime-700' }
  if (score >= 40) return { label: '注意', color: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700' }
  return { label: '危険', color: '#b91c1c', bg: 'bg-red-50', text: 'text-red-700' }
}
