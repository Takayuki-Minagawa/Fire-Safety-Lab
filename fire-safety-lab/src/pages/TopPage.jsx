import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function BuildingSVG({ scrollProgress }) {
  const fireOpacity = Math.min(1, scrollProgress * 2)
  const smokeOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.2) * 2))
  const shutterY = Math.max(0, 1 - Math.min(1, Math.max(0, (scrollProgress - 0.4) * 3)))
  const evacuationOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.6) * 3))

  return (
    <svg viewBox="0 0 600 400" className="w-full max-w-2xl mx-auto" aria-label="建物断面図アニメーション">
      {/* Building outline */}
      <rect x="100" y="50" width="400" height="300" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="2" rx="2"/>
      {/* Floors */}
      <line x1="100" y1="150" x2="500" y2="150" stroke="#9ca3af" strokeWidth="1.5"/>
      <line x1="100" y1="250" x2="500" y2="250" stroke="#9ca3af" strokeWidth="1.5"/>
      {/* Room dividers */}
      <line x1="300" y1="50" x2="300" y2="350" stroke="#9ca3af" strokeWidth="1"/>
      {/* Floor labels */}
      <text x="60" y="105" fontSize="12" fill="#6b7280" textAnchor="middle">3F</text>
      <text x="60" y="205" fontSize="12" fill="#6b7280" textAnchor="middle">2F</text>
      <text x="60" y="305" fontSize="12" fill="#6b7280" textAnchor="middle">1F</text>

      {/* Fire source (1F left room) */}
      <g opacity={fireOpacity}>
        <circle cx="200" cy="310" r="15" fill="#e85d26" opacity="0.8">
          <animate attributeName="r" values="12;18;12" dur="1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="200" cy="300" r="10" fill="#f6a84b" opacity="0.7">
          <animate attributeName="r" values="8;13;8" dur="0.8s" repeatCount="indefinite"/>
        </circle>
        <circle cx="215" cy="320" r="8" fill="#e85d26" opacity="0.6">
          <animate attributeName="r" values="6;10;6" dur="1.2s" repeatCount="indefinite"/>
        </circle>
      </g>

      {/* Smoke */}
      <g opacity={smokeOpacity}>
        <ellipse cx="200" cy="270" rx="60" ry="15" fill="#6b7280" opacity="0.3">
          <animate attributeName="rx" values="50;70;50" dur="3s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="200" cy="180" rx="40" ry="10" fill="#6b7280" opacity="0.2">
          <animate attributeName="rx" values="30;50;30" dur="4s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="250" cy="90" rx="30" ry="8" fill="#9ca3af" opacity="0.15">
          <animate attributeName="rx" values="25;40;25" dur="5s" repeatCount="indefinite"/>
        </ellipse>
      </g>

      {/* Fire compartment shutter */}
      <rect x="295" y={250 + shutterY * 100} width="10" height={100 - shutterY * 100} fill="#ef4444" opacity="0.8" rx="1"/>
      {shutterY < 0.5 && (
        <text x="320" y="310" fontSize="10" fill="#ef4444" fontWeight="bold">防火区画</text>
      )}

      {/* Evacuation route */}
      <g opacity={evacuationOpacity}>
        <path d="M400 310 L480 310 L480 350 L520 350" stroke="#0d9488" strokeWidth="3" fill="none" strokeDasharray="8,4">
          <animate attributeName="stroke-dashoffset" values="0;-24" dur="1s" repeatCount="indefinite"/>
        </path>
        <text x="530" y="355" fontSize="11" fill="#0d9488" fontWeight="bold">避難</text>
        <circle cx="520" cy="350" r="8" fill="#0d9488" opacity="0.3">
          <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      </g>

      {/* Windows */}
      <rect x="150" y="60" width="30" height="40" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" rx="1"/>
      <rect x="350" y="60" width="30" height="40" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" rx="1"/>
      <rect x="150" y="160" width="30" height="40" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" rx="1"/>
      <rect x="350" y="160" width="30" height="40" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" rx="1"/>
    </svg>
  )
}

const featureCards = [
  {
    icon: '🔬',
    title: 'シミュレーション',
    desc: '出火位置や材料を変えて、火の広がり方をリアルタイムで観察',
    link: '/simulation',
  },
  {
    icon: '📖',
    title: '学習解説',
    desc: '防火・耐火・区画・材料・避難の基本をわかりやすく解説',
    link: '/learning',
  },
  {
    icon: '⚖️',
    title: '事例比較',
    desc: '条件の違いによる安全性の変化を並べて比較',
    link: '/cases',
  },
  {
    icon: '✅',
    title: 'クイズ',
    desc: '学んだ知識を確認するミニクイズに挑戦',
    link: '/quiz',
  },
]

export default function TopPage() {
  const scrollRef = useRef(null)
  const svgContainerRef = useRef(null)
  const progressRef = useRef(0)
  const animFrameRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!svgContainerRef.current) return
      const rect = svgContainerRef.current.getBoundingClientRect()
      const viewH = window.innerHeight
      const progress = Math.max(0, Math.min(1, (viewH - rect.top) / (viewH + rect.height)))
      progressRef.current = progress
      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(() => {
          svgContainerRef.current?.querySelectorAll('[data-scroll]').forEach(el => {
            el.style.setProperty('--scroll', progressRef.current)
          })
          animFrameRef.current = null
        })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return (
    <div ref={scrollRef}>
      {/* Hero section */}
      <section className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-500 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-5xl font-bold mb-6 leading-tight"
          >
            火災から建築を守る仕組みを<br />
            <span className="text-orange-400">体験的に学ぶ</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
          >
            防火・耐火・防火区画・材料・避難安全を<br className="md:hidden" />
            見て、動かして、比較して、理解する
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link
              to="/simulation"
              className="inline-block bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg shadow-orange-900/30 no-underline"
            >
              学習を始める
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Scroll animation section */}
      <section className="py-16 md:py-24 bg-white" ref={svgContainerRef}>
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-center mb-4 text-gray-800"
          >
            火災時の建築の振る舞いを視覚化
          </motion.h2>
          <p className="text-center text-gray-500 mb-10 text-sm">
            スクロールして火災の進行を確認してみましょう
          </p>
          <ScrollDrivenBuilding />
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800">学習コンテンツ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={card.link}
                  className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 no-underline h-full"
                >
                  <div className="text-3xl mb-3">{card.icon}</div>
                  <h3 className="font-bold text-gray-800 mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-500">{card.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-amber-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-amber-800">
            本アプリは建築学科の学生を対象とした<strong>教育用の学習ツール</strong>です。
            表示される情報は学習用の簡易モデルであり、実務設計や法適合判定には使用できません。
          </p>
        </div>
      </section>
    </div>
  )
}

function ScrollDrivenBuilding() {
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const progressRef = useRef(0)
  const setProgressRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const update = () => {
      const rect = container.getBoundingClientRect()
      const viewH = window.innerHeight
      const raw = (viewH - rect.top) / (viewH + rect.height)
      progressRef.current = Math.max(0, Math.min(1, raw))
      if (setProgressRef.current) {
        setProgressRef.current(progressRef.current)
      }
    }

    const onScroll = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          update()
          rafRef.current = null
        })
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div ref={containerRef}>
      <ScrollBuildingInner setProgressRef={setProgressRef} />
    </div>
  )
}

function ScrollBuildingInner({ setProgressRef }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgressRef.current = setProgress
  }, [setProgressRef])

  return <BuildingSVG scrollProgress={progress} />
}

