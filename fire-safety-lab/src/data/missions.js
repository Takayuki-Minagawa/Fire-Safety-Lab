/**
 * シミュレーションのミッション（学習目標つきのチャレンジ）
 *  - start  … ミッション開始時に設定する条件（あれば）
 *  - check  … 最後まで再生したときに達成判定する関数
 */
import { COMPARTMENT_COL, sideOf } from '../lib/fireSim.js'

const last = frames => frames[frames.length - 1]

export const MISSIONS = [
  {
    id: 'observe',
    icon: '👀',
    title: 'まずは観察',
    goal: '条件はそのままで、最後（30分後）まで再生してみよう。',
    hint: '「再生」ボタンを押すか、タイムスライダーを右端まで動かします。',
    check: () => true,
  },
  {
    id: 'move-origin',
    icon: '📍',
    title: '出火点を動かそう',
    goal: '東側の部屋（室3・4・7・8）で出火させて、最後まで観察しよう。',
    hint: '平面図の部屋をクリックするか、「出火場所」のリストから選べます。',
    check: config => config.origin.col > COMPARTMENT_COL,
  },
  {
    id: 'contain',
    icon: '🧱',
    title: '火を区画に閉じ込めろ',
    goal: '内装は「可燃材料」のまま、30分後の延焼面積を55%以下に抑えよう。',
    hint: '建物を区切る「防火区画」と、自動で閉まる防火戸を使ってみましょう。',
    start: { material: 'combustible', compartment: false, fireDoor: 'auto', roomDoors: 'open', exhaust: false, twoWay: true },
    check: (config, frames) => config.material === 'combustible' && last(frames).stats.burnRatio <= 0.55,
  },
  {
    id: 'blocked-door',
    icon: '📦',
    title: '閉まらない防火戸',
    goal: '防火区画はあるのに防火戸の前に物が置かれていたら？ 区画の反対側まで延焼する様子を確かめよう。',
    hint: '「防火戸」を「物が置かれて閉まらない」に。内装は燃えやすい材料にすると分かりやすいです。',
    start: { compartment: true, fireDoor: 'blocked', material: 'retardant', roomDoors: 'open' },
    check: (config, frames) => {
      if (!config.compartment || config.fireDoor !== 'blocked') return false
      const other = sideOf(config.origin.col) === 'west' ? 'east' : 'west'
      return (last(frames).stats.sideBurned[other] ?? 0) > 0
    },
  },
  {
    id: 'one-way',
    icon: '🏃',
    title: '1方向避難でも全員避難',
    goal: '避難口が1方向（西側の階段のみ）の条件で、在館者12人全員を避難させよう。',
    hint: '燃え広がりにくい内装、閉じた扉など、避難の時間を稼ぐ工夫を組み合わせましょう。',
    start: { twoWay: false, material: 'combustible', roomDoors: 'open', compartment: false, exhaust: false },
    check: (config, frames) => !config.twoWay && last(frames).stats.evacuated === last(frames).stats.total,
  },
  {
    id: 'smoke-control',
    icon: '🌫️',
    title: '避難経路を煙から守れ',
    goal: '内装は「難燃材料」のまま、廊下の煙濃度の最大値を35%以下に抑えよう。',
    hint: '防火戸で煙が流れる範囲を限定し、排煙設備で煙を屋外へ出す――2つの対策を組み合わせてみましょう。',
    start: { material: 'retardant', compartment: false, roomDoors: 'open', exhaust: false },
    check: (config, frames) =>
      config.material === 'retardant' && frames.every(f => f.stats.corridorSmoke <= 0.35),
  },
  {
    id: 'safety-95',
    icon: '🛡️',
    title: '安全度95点を目指せ',
    goal: '30分後の総合安全度を95点以上にしよう。',
    hint: '材料・区画・扉・避難経路・排煙をすべて見直してみましょう。',
    check: (config, frames) => last(frames).stats.safety >= 95,
  },
  {
    id: 'worst',
    icon: '⚠️',
    title: '危険な条件を知る',
    goal: '総合安全度が30点以下になる条件を見つけよう。何が危険かを知ることも大切な学びです。',
    hint: '区画なし・可燃材料・扉を開放・1方向避難…。出火場所が避難口の近くだとどうなるでしょう？',
    check: (config, frames) => last(frames).stats.safety <= 30,
  },
]
