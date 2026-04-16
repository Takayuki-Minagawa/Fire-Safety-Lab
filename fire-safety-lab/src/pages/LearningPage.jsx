import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const categories = [
  {
    id: 'fire-prevention',
    title: '防火の基本',
    icon: '🔥',
    color: 'orange',
    cards: [
      {
        title: '火災の発生と拡大',
        content: '火災は「熱源」「可燃物」「酸素」の3要素が揃うと発生します。建物内では、内装材や家具が燃え、熱気流によって上方や隣接空間へ延焼します。',
        note: '熱源＝火の元、可燃物＝燃えるもの、酸素＝空気のこと',
      },
      {
        title: '開口部と延焼',
        content: '窓やドアなどの開口部は、火や煙の通り道になります。開口部が大きいほど酸素が供給されやすく、火災が拡大しやすくなります。防火設備（防火戸・防火ダンパーなど）で延焼を防ぎます。',
        note: '防火戸＝火災時に自動で閉まる扉',
      },
      {
        title: '防火区画の役割',
        content: '建物を壁や床で区切り、火災が広がる範囲を限定する仕組みです。面積区画・竪穴区画・異種用途区画など、目的に応じた区画があります。',
        note: '竪穴＝階段やエレベーターなど縦方向の空間',
      },
      {
        title: '建築計画と防火',
        content: '防火は建物の計画段階から考えます。用途・規模・構造に応じて、必要な防火性能が法規で定められています。適切な材料選定と空間計画が火災被害を最小化します。',
        note: null,
      },
    ],
  },
  {
    id: 'fire-resistance',
    title: '耐火の基本',
    icon: '🏗️',
    color: 'blue',
    cards: [
      {
        title: '耐火構造とは',
        content: '火災が終わるまで建物が倒壊せず、延焼を防止できる構造です。主要構造部（柱・梁・床・壁・屋根・階段）が一定時間以上の耐火性能を持つことが求められます。',
        note: '主要構造部＝建物を支える重要な部分',
      },
      {
        title: '準耐火構造',
        content: '耐火構造ほどの性能はないが、一定の耐火性能を持つ構造です。木造でも適切な被覆や設計により準耐火構造にできます。',
        note: '被覆＝石膏ボードなどで覆って火から守ること',
      },
      {
        title: '部材の耐火性能',
        content: '柱・梁は1〜3時間、壁・床は1〜2時間の耐火性能が求められることがあります。鉄骨は高温で強度が低下するため、耐火被覆が必要です。鉄筋コンクリートは比較的高い耐火性能を持ちます。',
        note: null,
      },
      {
        title: '熱の影響と構造安全',
        content: '鋼材は約500℃で強度が半減します。コンクリートは表面から徐々に劣化しますが、内部の鉄筋を保護する効果があります。木材は表面が炭化して内部を守る性質があります。',
        note: '炭化＝木の表面が炭になり、断熱層として働くこと',
      },
    ],
  },
  {
    id: 'materials',
    title: '材料の違い',
    icon: '🧱',
    color: 'amber',
    cards: [
      {
        title: '不燃・準不燃・難燃材料',
        content: '不燃材料は20分間、準不燃材料は10分間、難燃材料は5分間、燃焼しない性能を持つ材料です。コンクリート・鉄・ガラスなどが不燃材料に該当します。',
        note: '「燃焼しない」＝有害な煙やガスを発生しないことも含む',
      },
      {
        title: '内装材の選定',
        content: '内装制限とは、建物の用途や規模に応じて、壁・天井の仕上げ材料を不燃・準不燃にするルールです。火災時の急激な延焼やフラッシュオーバーを防ぎます。',
        note: 'フラッシュオーバー＝室内の温度が急上昇し一斉に燃え出す現象',
      },
      {
        title: '被覆と耐火性能',
        content: '鉄骨を石膏ボードや耐火塗料で被覆すると、熱の伝達を遅らせ耐火性能が向上します。被覆の厚さや種類によって耐火時間が変わります。',
        note: null,
      },
      {
        title: '材料選定と安全性',
        content: '適切な材料選定は火災安全の基本です。低コストでも可燃性の高い材料を使うと、避難時間が確保できず危険です。建築基準法は最低限の安全性を確保するための基準を定めています。',
        note: null,
      },
    ],
  },
  {
    id: 'smoke-evacuation',
    title: '煙と避難',
    icon: '🚪',
    color: 'teal',
    cards: [
      {
        title: '煙の危険性',
        content: '火災で最も危険なのは煙です。有毒ガスを含む煙は視界を奪い、呼吸を困難にします。煙は秒速3〜5mで上昇し、水平方向にも毎秒0.5〜1mで広がります。',
        note: null,
      },
      {
        title: '煙の滞留と排煙',
        content: '煙は天井付近にたまり、徐々に下降します。排煙設備（排煙窓・機械排煙）は煙を外部に排出し、避難時間を確保します。',
        note: '排煙＝煙を建物の外に出す仕組み',
      },
      {
        title: '避難経路の計画',
        content: '2方向避難が原則です。廊下・階段・避難口までの歩行距離には制限があります。避難階段は防火区画で区切られ、煙の侵入を防ぎます。',
        note: '2方向避難＝異なる2つの方向に逃げられること',
      },
      {
        title: '防煙の基本',
        content: '防煙区画（防煙壁・防煙垂れ壁）で煙の拡散を遅らせます。加圧排煙は階段室に空気を送り込み、煙の侵入を防ぐ方法です。',
        note: '防煙垂れ壁＝天井から50cm程度下がった壁',
      },
    ],
  },
  {
    id: 'planning',
    title: '建築計画との関係',
    icon: '📐',
    color: 'purple',
    cards: [
      {
        title: '用途と安全計画',
        content: '病院・学校・商業施設など、用途によって求められる安全性能が異なります。不特定多数が利用する建物ほど厳しい基準が適用されます。',
        note: null,
      },
      {
        title: '防火区画と動線',
        content: '防火区画は避難動線と連動して計画します。区画の位置が避難経路を分断しないよう、建築計画の初期段階から検討が必要です。',
        note: '動線＝人が移動する経路のこと',
      },
      {
        title: '開口部・内装・構造の総合性',
        content: '防火安全は単一の要素ではなく、開口部の防火設備・内装制限・構造の耐火性能を組み合わせて実現します。一つが欠けると全体の安全性が低下します。',
        note: null,
      },
      {
        title: 'ケーススタディ',
        content: '同じ規模の建物でも、材料・区画・避難計画の違いで安全性は大きく変わります。事例比較ページで具体的な違いを確認してみましょう。',
        note: null,
      },
    ],
  },
]

const colorMap = {
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', accent: 'bg-orange-100', tab: 'bg-orange-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-100', tab: 'bg-blue-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-100', tab: 'bg-amber-600' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', accent: 'bg-teal-100', tab: 'bg-teal-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-100', tab: 'bg-purple-600' },
}

export default function LearningPage() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id)
  const category = categories.find(c => c.id === activeCategory)
  const colors = colorMap[category.color]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">学習解説</h1>
        <p className="text-gray-500 text-sm mb-8">
          防火・耐火の基本をカテゴリごとに学びましょう
        </p>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? `${colorMap[cat.color].tab} text-white shadow-sm`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.title}
            </button>
          ))}
        </div>

        {/* Difference callout */}
        {activeCategory === 'fire-prevention' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 bg-gradient-to-r from-orange-50 to-blue-50 rounded-xl border border-orange-200"
          >
            <h3 className="font-bold text-gray-800 mb-2">「防火」と「耐火」の違い</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-white/80 rounded-lg">
                <p className="font-medium text-orange-700 mb-1">防火（Fire Prevention）</p>
                <p className="text-gray-600">火災の<strong>発生・拡大を防ぐ</strong>こと。防火区画・防火戸・内装制限などにより、火が広がらないようにする考え方。</p>
              </div>
              <div className="p-3 bg-white/80 rounded-lg">
                <p className="font-medium text-blue-700 mb-1">耐火（Fire Resistance）</p>
                <p className="text-gray-600">火災に<strong>耐える</strong>こと。構造体が火災の熱に一定時間耐え、倒壊しない性能。避難と消火活動の時間を確保する考え方。</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {category.cards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`${colors.bg} ${colors.border} border rounded-xl p-5`}
              >
                <h3 className={`font-bold ${colors.text} mb-3`}>{card.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{card.content}</p>
                {card.note && (
                  <p className={`mt-3 text-xs ${colors.accent} rounded-lg px-3 py-2 text-gray-600`}>
                    💡 {card.note}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
