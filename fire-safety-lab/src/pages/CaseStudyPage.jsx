import { useState } from 'react'
import { motion } from 'framer-motion'

const cases = [
  {
    id: 'compartment',
    title: '防火区画の有無',
    description: '同じ建物で防火区画がある場合とない場合の火災拡大を比較します。',
    caseA: {
      label: '区画あり',
      conditions: ['床面積500㎡を防火壁で区画', '防火戸を各区画に設置', '壁：耐火1時間'],
      fireSpread: 15,
      evacuationTime: 90,
      safetyScore: 85,
      smoke: 20,
      description: '火災は出火区画内に留まり、隣接区画への延焼が防がれます。避難者は安全な区画を通って避難できます。',
    },
    caseB: {
      label: '区画なし',
      conditions: ['床面積500㎡をワンフロアで使用', '間仕切りは一般建材のみ', '防火戸なし'],
      fireSpread: 80,
      evacuationTime: 30,
      safetyScore: 25,
      smoke: 75,
      description: '火災はフロア全体に急速に拡大し、煙も短時間で充満します。避難時間が大幅に短縮されます。',
    },
  },
  {
    id: 'material',
    title: '内装材料の違い',
    description: '不燃材料と可燃性の高い内装を使った場合の違いを比較します。',
    caseA: {
      label: '不燃材料中心',
      conditions: ['壁・天井：石膏ボード（不燃）', '床：コンクリート直仕上げ', 'カーテン：防炎品'],
      fireSpread: 20,
      evacuationTime: 75,
      safetyScore: 80,
      smoke: 15,
      description: '内装材が燃えにくいため、フラッシュオーバーまでの時間が長く、避難に十分な時間があります。煙の発生も少なくなります。',
    },
    caseB: {
      label: '可燃性の高い内装',
      conditions: ['壁：木質パネル（可燃）', '天井：吸音材（難燃未満）', 'カーテン：一般繊維'],
      fireSpread: 85,
      evacuationTime: 20,
      safetyScore: 15,
      smoke: 85,
      description: '内装材が燃え広がりやすく、フラッシュオーバーが早期に発生します。大量の煙と有毒ガスが発生し、避難が極めて困難になります。',
    },
  },
  {
    id: 'evacuation',
    title: '避難経路の計画',
    description: '明快な避難経路と複雑な避難経路の違いを比較します。',
    caseA: {
      label: '明快な避難経路',
      conditions: ['2方向避難を確保', '廊下幅1.8m以上', '避難階段2箇所（両端）', '誘導灯・非常照明完備'],
      fireSpread: 50,
      evacuationTime: 85,
      safetyScore: 90,
      smoke: 40,
      description: 'どの位置からでも2方向に避難可能。広い廊下と明確な誘導により、パニック時でもスムーズに避難できます。',
    },
    caseB: {
      label: '複雑な避難経路',
      conditions: ['1方向のみの避難路', '廊下幅1.2m（最低限）', '避難階段1箇所（片端）', '誘導灯不十分'],
      fireSpread: 50,
      evacuationTime: 35,
      safetyScore: 30,
      smoke: 60,
      description: '避難路が限られるため、火災位置によっては逃げ道が塞がれます。廊下が狭く混雑し、避難に時間がかかります。',
    },
  },
]

function SafetyBar({ value, label, color }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function CaseCard({ data, variant }) {
  const isSafe = variant === 'safe'
  const borderColor = isSafe ? 'border-teal-200' : 'border-red-200'
  const bgColor = isSafe ? 'bg-teal-50/50' : 'bg-red-50/50'
  const badgeColor = isSafe ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'

  return (
    <div className={`${bgColor} ${borderColor} border rounded-xl p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {data.label}
        </span>
      </div>

      <ul className="text-xs text-gray-600 space-y-1 mb-4">
        {data.conditions.map((c, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="text-gray-400 mt-0.5">•</span>
            {c}
          </li>
        ))}
      </ul>

      <SafetyBar value={data.safetyScore} label="安全度" color={data.safetyScore > 50 ? '#0d9488' : '#dc2626'} />
      <SafetyBar value={100 - data.fireSpread} label="延焼抑制" color={data.fireSpread < 50 ? '#0d9488' : '#dc2626'} />
      <SafetyBar value={data.evacuationTime} label="避難余裕" color={data.evacuationTime > 50 ? '#0d9488' : '#dc2626'} />
      <SafetyBar value={100 - data.smoke} label="視界確保" color={data.smoke < 50 ? '#0d9488' : '#dc2626'} />

      <p className="text-xs text-gray-600 mt-4 leading-relaxed bg-white/80 p-3 rounded-lg">
        {data.description}
      </p>
    </div>
  )
}

export default function CaseStudyPage() {
  const [activeCase, setActiveCase] = useState(cases[0].id)
  const currentCase = cases.find(c => c.id === activeCase)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">事例比較</h1>
        <p className="text-gray-500 text-sm mb-8">
          条件の違いによる安全性の変化を比較してみましょう
        </p>

        {/* Case selector */}
        <div className="flex flex-wrap gap-3 mb-8">
          {cases.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCase(c.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeCase === c.id
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        <motion.div
          key={activeCase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-gray-600 mb-6">{currentCase.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CaseCard data={currentCase.caseA} variant="safe" />
            <CaseCard data={currentCase.caseB} variant="danger" />
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              ※ 表示される数値は学習用の目安です。実際の火災は建物の条件・火源・気象条件などにより大きく異なります。
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
