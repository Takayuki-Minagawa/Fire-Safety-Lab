/**
 * 部材の耐火性能の学習用簡易モデル
 *
 * 標準加熱曲線（ISO 834）で部材を加熱したとき、
 *   - 鉄骨：鋼材温度が限界温度に達するまで
 *   - RC  ：鉄筋（かぶり位置）の温度が限界温度に達するまで
 *   - 木造：炭化（燃えしろ）が進み、残りの断面が不足するまで
 * の時間を「耐火時間の目安」として求める。
 *
 * ※ 一次遅れ系の単純なモデルで、係数は学習用に調整した値。
 *    実際の耐火性能は告示仕様・大臣認定・耐火性能検証法などで確認する。
 */

export const MAX_MINUTES = 180
export const CRITICAL_TEMP = 550 // 鋼材の限界温度の目安（℃）
export const CHAR_RATE = 0.75 // 集成材の炭化速度の目安（mm/分）

/** 標準加熱曲線（ISO 834）: t 分後の火災温度（℃） */
export function fireTemperature(t) {
  return 20 + 345 * Math.log10(8 * t + 1)
}

export const MEMBERS = {
  steel: {
    id: 'steel',
    label: '鉄骨柱（被覆なし）',
    short: '鉄骨・無被覆',
    description: '鋼材は熱をよく伝えるため、むき出しだと短時間で高温になり強度が落ちます。',
    param: null,
  },
  coated: {
    id: 'coated',
    label: '鉄骨柱＋耐火被覆',
    short: '鉄骨・被覆',
    description: 'ロックウールなどの耐火被覆で鋼材を包み、熱の伝わりを遅らせます。',
    param: { key: 'coating', label: '被覆の厚さ', unit: 'mm', min: 5, max: 60, step: 5, default: 25 },
  },
  rc: {
    id: 'rc',
    label: '鉄筋コンクリート柱',
    short: 'RC',
    description: 'コンクリートが鉄筋を覆う「かぶり」が断熱層となり、鉄筋の温度上昇を抑えます。',
    param: { key: 'cover', label: 'かぶり厚さ', unit: 'mm', min: 20, max: 60, step: 5, default: 40 },
  },
  wood: {
    id: 'wood',
    label: '木造柱（集成材）',
    short: '木造',
    description: '木材は表面が炭化して断熱層となり、内部はなかなか燃えません（燃えしろ設計）。',
    param: { key: 'size', label: '柱の断面寸法', unit: 'mm角', min: 120, max: 450, step: 15, default: 300 },
  },
}
export const MEMBER_ORDER = ['steel', 'coated', 'rc', 'wood']

/** 熱の伝わりやすさ（一次遅れ系の係数, 1/分） */
function lagCoefficient(memberId, value) {
  switch (memberId) {
    case 'steel': return 0.16
    case 'coated': return 0.16 / (1 + 0.15 * value) ** 1.5
    case 'rc': return 2.0 / value ** 1.55
    default: return 0
  }
}

/**
 * 部材の時刻歴を計算する
 * @returns {{ series: Array<{t:number, fire:number, member:number, residual:number}>, failTime:number|null }}
 *   member   … 鋼材・鉄筋の温度（℃）。木造では炭化層の深さ（mm）
 *   residual … 残存断面の割合（木造のみ。それ以外は 1）
 */
export function simulateMember(memberId, value) {
  const series = []
  let failTime = null
  const dt = 0.5

  if (memberId === 'wood') {
    // 木造：四周から炭化。残存断面積が半分を下回ったら荷重を支えられないとみなす
    const required = 0.5
    for (let t = 0; t <= MAX_MINUTES; t += dt) {
      const charDepth = CHAR_RATE * t
      const core = Math.max(0, value - 2 * charDepth)
      const residual = (core * core) / (value * value)
      if (failTime === null && residual < required) failTime = t
      series.push({ t, fire: fireTemperature(t), member: charDepth, residual })
    }
    return { series, failTime }
  }

  const k = lagCoefficient(memberId, value)
  let temp = 20
  for (let t = 0; t <= MAX_MINUTES; t += dt) {
    if (t > 0) temp += k * (fireTemperature(t) - temp) * dt
    if (failTime === null && temp >= CRITICAL_TEMP) failTime = t
    series.push({ t, fire: fireTemperature(t), member: temp, residual: 1 })
  }
  return { series, failTime }
}

/** t 分時点のデータ（0.5分刻みの series から取得） */
export function pointAt(series, t) {
  const i = Math.max(0, Math.min(series.length - 1, Math.round(t * 2)))
  return series[i]
}

/** 耐火時間の目安から到達ランクを返す（学習用の目安） */
export const RATINGS = [
  { minutes: 30, label: '30分' },
  { minutes: 45, label: '45分（準耐火の目安）' },
  { minutes: 60, label: '1時間（耐火の目安）' },
  { minutes: 120, label: '2時間' },
]

export function formatMinutes(min) {
  if (min === null) return `${MAX_MINUTES}分以上`
  return `約${Math.round(min)}分`
}
