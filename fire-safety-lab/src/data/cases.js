/**
 * 事例比較ページのケース
 * A・B それぞれの条件をシミュレーションエンジンで計算し、同じ時刻で並べて比較する。
 */
import { DEFAULT_CONFIG } from '../lib/fireSim.js'

const base = { ...DEFAULT_CONFIG, exhaust: false, twoWay: true }

export const CASES = [
  {
    id: 'compartment',
    title: '防火区画の有無',
    icon: '🧱',
    description: '同じ建物・同じ内装で、防火区画（防火戸つき）がある場合とない場合を比べます。',
    question: '区画があっても、防火戸が閉まらなかったらどうなるでしょう？',
    answer:
      '防火戸が開いたままだと、その開口部から火と煙が隣の区画に流れ込み、区画の効果はほとんど失われます。シミュレーションの「閉まらない防火戸」ミッションで確かめてみましょう。',
    a: {
      label: '区画あり',
      config: { ...base, material: 'combustible', compartment: true, roomDoors: 'open' },
      conditions: ['フロア中央を防火区画の壁で区切る', '廊下の防火戸は煙感知器と連動して自動閉鎖', '内装：可燃材料'],
    },
    b: {
      label: '区画なし',
      config: { ...base, material: 'combustible', compartment: false, roomDoors: 'open' },
      conditions: ['フロア全体がひと続き', '間仕切りは一般の壁のみ', '内装：可燃材料'],
    },
    takeaway: '区画ありでは延焼が出火した側にとどまり、反対側の区画は守られます。区画なしではフロア全体に火と煙が広がります。',
  },
  {
    id: 'material',
    title: '内装材料の違い',
    icon: '🪵',
    description: '同じ間取りで、内装を不燃材料にした場合と可燃材料にした場合を比べます。',
    question: '可燃材料の内装でも安全性を高めるには、ほかにどんな対策が考えられるでしょう？',
    answer:
      '防火区画で火災の範囲を限定する、居室の扉を閉めて煙の流出を抑える、排煙設備で煙を排出する、などの対策を組み合わせることで安全性を高められます。ただし内装を燃えにくくすることが、火災初期の燃え広がりを抑える基本です。',
    a: {
      label: '不燃材料中心',
      config: { ...base, material: 'noncombustible', compartment: false, roomDoors: 'open' },
      conditions: ['壁・天井：石膏ボード（不燃）', '床：コンクリート直仕上げ', '居室の扉は開放'],
    },
    b: {
      label: '可燃性の高い内装',
      config: { ...base, material: 'combustible', compartment: false, roomDoors: 'open' },
      conditions: ['壁・天井：木質パネル（可燃）', '可燃性の装飾が多い', '居室の扉は開放'],
    },
    takeaway: '不燃材料では火が出火室の家具などにとどまり、煙も少量です。可燃材料では壁や天井を伝って一気に燃え広がり、廊下が煙で満たされます。',
  },
  {
    id: 'evacuation',
    title: '避難経路の計画',
    icon: '🏃',
    description: '避難口（階段）が廊下の両端にある場合と、片側だけの場合を比べます。出火場所は西側の階段の近くです。',
    question: '1方向避難の建物で、出火場所が避難口から遠かったら結果は変わるでしょうか？',
    answer:
      '出火場所が避難口から遠ければ、全員が避難できることもあります。しかし火災はどこで起きるか分かりません。「どこで出火しても逃げられる」ようにするのが2方向避難の考え方です。',
    a: {
      label: '2方向避難',
      config: { ...base, material: 'retardant', compartment: false, roomDoors: 'open', twoWay: true },
      conditions: ['廊下の両端に避難階段（2方向避難）', '内装：難燃材料', '防火区画なし'],
    },
    b: {
      label: '1方向避難',
      config: { ...base, material: 'retardant', compartment: false, roomDoors: 'open', twoWay: false },
      conditions: ['西側の端にだけ避難階段（1方向避難）', '内装：難燃材料', '防火区画なし'],
    },
    takeaway: '2方向避難では、出火場所に近い階段が使えなくても反対側の階段から全員が逃げられます。1方向避難では逃げ道が塞がれ、逃げ遅れが発生します。',
  },
]
