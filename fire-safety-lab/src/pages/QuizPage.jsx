import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const quizzes = [
  {
    question: '次のうち、延焼を最も抑えやすい条件はどれですか？',
    options: [
      '可燃性の木質パネルで内装を仕上げた部屋',
      '不燃材料（石膏ボード）で内装を仕上げた部屋',
      '防炎処理をしていないカーテンのある部屋',
    ],
    correctIndex: 1,
    explanation: '不燃材料は20分間燃焼しない性能を持ち、火災時の延焼を大幅に抑制します。内装制限により、特定の建物では壁・天井に不燃材料の使用が求められます。',
  },
  {
    question: '防火区画の主な目的として正しいものはどれですか？',
    options: [
      '建物の見た目を良くすること',
      '火災の拡大範囲を限定し、避難時間を確保すること',
      '建物の建設コストを削減すること',
    ],
    correctIndex: 1,
    explanation: '防火区画は建物を耐火性能のある壁・床で区切り、火災が建物全体に広がるのを防ぎます。これにより避難時間を確保し、消火活動を支援します。',
  },
  {
    question: '火災時に最も危険なのは次のうちどれですか？',
    options: [
      '炎による直接の熱傷',
      '煙による視界喪失と有毒ガスの吸入',
      '建物の振動',
    ],
    correctIndex: 1,
    explanation: '火災による死亡原因の多くは煙の吸入によるものです。煙は有毒ガス（一酸化炭素など）を含み、短時間で意識を失わせます。また視界を奪い避難を困難にします。',
  },
  {
    question: '避難計画において「2方向避難」が重要な理由は何ですか？',
    options: [
      '建物の見栄えが良くなるから',
      '一方の避難路が火災で使えなくても、別の方向に逃げられるから',
      '廊下を広く取る必要がなくなるから',
    ],
    correctIndex: 1,
    explanation: '2方向避難は、火災が一方の避難路を塞いでも、もう一方の経路で安全に避難できるようにする原則です。特に多くの人が利用する建物では重要な計画要件です。',
  },
  {
    question: '鉄骨構造に耐火被覆が必要な理由として正しいものはどれですか？',
    options: [
      '鉄骨は錆びやすいため、防錆が目的',
      '鉄骨は高温になると強度が大幅に低下し、倒壊の危険があるため',
      '鉄骨は火災時に膨張して美観を損なうため',
    ],
    correctIndex: 1,
    explanation: '鋼材は約500℃で強度が半減します。火災時の温度は800〜1000℃に達するため、耐火被覆なしでは構造体が強度を失い、建物が倒壊する危険があります。',
  },
]

export default function QuizPage() {
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const quiz = quizzes[currentQ]

  const handleAnswer = (index) => {
    if (showResult) return
    setSelectedAnswer(index)
    setShowResult(true)
    if (index === quiz.correctIndex) {
      setScore(prev => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentQ < quizzes.length - 1) {
      setCurrentQ(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setFinished(true)
    }
  }

  const handleRetry = () => {
    setCurrentQ(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const percent = Math.round((score / quizzes.length) * 100)
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
        >
          <div className="text-5xl mb-4">
            {percent >= 80 ? '🎉' : percent >= 60 ? '👍' : '📚'}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">クイズ結果</h1>
          <p className="text-4xl font-bold mb-2">
            <span className="text-orange-600">{score}</span>
            <span className="text-gray-400 text-2xl"> / {quizzes.length}</span>
          </p>
          <p className="text-gray-500 mb-6">正解率 {percent}%</p>

          <p className="text-sm text-gray-600 mb-8">
            {percent >= 80
              ? '素晴らしい！防耐火の基本をよく理解しています。'
              : percent >= 60
              ? 'よくできました。学習解説ページで復習するとさらに理解が深まります。'
              : '学習解説ページでもう一度基本を確認してみましょう。'}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-500 transition-colors"
            >
              もう一度挑戦
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">確認クイズ</h1>
        <p className="text-gray-500 text-sm mb-8">学んだ知識を確認してみましょう</p>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-gray-500">
            問題 {currentQ + 1} / {quizzes.length}
          </span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentQ + 1) / quizzes.length) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-bold text-gray-800 mb-6 leading-relaxed">
              {quiz.question}
            </h2>

            <div className="space-y-3">
              {quiz.options.map((option, i) => {
                let styles = 'border-gray-200 hover:border-gray-300 text-gray-700'
                if (showResult) {
                  if (i === quiz.correctIndex) {
                    styles = 'border-teal-400 bg-teal-50 text-teal-800'
                  } else if (i === selectedAnswer && i !== quiz.correctIndex) {
                    styles = 'border-red-400 bg-red-50 text-red-800'
                  } else {
                    styles = 'border-gray-100 text-gray-400'
                  }
                } else if (selectedAnswer === i) {
                  styles = 'border-orange-400 bg-orange-50 text-orange-800'
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={showResult}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors text-sm ${styles}`}
                  >
                    <span className="font-medium mr-2">{['A', 'B', 'C'][i]}.</span>
                    {option}
                    {showResult && i === quiz.correctIndex && (
                      <span className="ml-2 text-teal-600">✓ 正解</span>
                    )}
                    {showResult && i === selectedAnswer && i !== quiz.correctIndex && (
                      <span className="ml-2 text-red-600">✗</span>
                    )}
                  </button>
                )
              })}
            </div>

            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className={`p-4 rounded-lg ${
                  selectedAnswer === quiz.correctIndex
                    ? 'bg-teal-50 border border-teal-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm font-medium mb-1 ${
                    selectedAnswer === quiz.correctIndex ? 'text-teal-700' : 'text-red-700'
                  }`}>
                    {selectedAnswer === quiz.correctIndex ? '正解！' : '不正解'}
                  </p>
                  <p className="text-sm text-gray-700">{quiz.explanation}</p>
                </div>

                <button
                  onClick={handleNext}
                  className="mt-4 w-full py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-500 transition-colors"
                >
                  {currentQ < quizzes.length - 1 ? '次の問題へ' : '結果を見る'}
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
