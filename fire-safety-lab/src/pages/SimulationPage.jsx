import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

const MATERIALS = [
  { id: 'noncombustible', label: '不燃材料', spreadRate: 0.2, color: '#93c5fd' },
  { id: 'semi-noncombustible', label: '準不燃材料', spreadRate: 0.5, color: '#fcd34d' },
  { id: 'combustible', label: '可燃材料', spreadRate: 1.0, color: '#fca5a5' },
]

const GRID_ROWS = 8
const GRID_COLS = 12

function createInitialGrid() {
  return Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ heat: 0, wall: false }))
  )
}

export default function SimulationPage() {
  const [material, setMaterial] = useState(MATERIALS[0])
  const [hasCompartment, setHasCompartment] = useState(true)
  const [hasOpening, setHasOpening] = useState(false)
  const [fireOrigin, setFireOrigin] = useState({ row: 5, col: 2 })
  const [timeStep, setTimeStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [grid, setGrid] = useState(createInitialGrid)
  const [smokeLevel, setSmokeLevel] = useState(0)

  const compartmentCol = 6

  const resetSimulation = useCallback(() => {
    setTimeStep(0)
    setIsRunning(false)
    setSmokeLevel(0)
    const newGrid = createInitialGrid()
    if (hasCompartment) {
      for (let r = 0; r < GRID_ROWS; r++) {
        newGrid[r][compartmentCol] = { heat: 0, wall: true }
      }
      if (hasOpening) {
        newGrid[Math.floor(GRID_ROWS / 2)][compartmentCol] = { heat: 0, wall: false }
      }
    }
    newGrid[fireOrigin.row][fireOrigin.col] = { heat: 1, wall: false }
    setGrid(newGrid)
  }, [hasCompartment, hasOpening, fireOrigin])

  useEffect(() => {
    resetSimulation()
  }, [resetSimulation])

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setTimeStep(prev => {
        if (prev >= 60) {
          setIsRunning(false)
          return prev
        }
        return prev + 1
      })

      setGrid(prev => {
        const next = prev.map(row => row.map(cell => ({ ...cell })))
        const spread = material.spreadRate * 0.15

        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            if (next[r][c].wall) continue
            if (prev[r][c].heat > 0) {
              next[r][c].heat = Math.min(1, prev[r][c].heat + spread * 0.3)
              const neighbors = [
                [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
              ]
              for (const [nr, nc] of neighbors) {
                if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
                  if (!next[nr][nc].wall && prev[nr][nc].heat === 0) {
                    next[nr][nc].heat = Math.min(1, spread * 0.5 * prev[r][c].heat)
                  } else if (!next[nr][nc].wall && prev[nr][nc].heat > 0) {
                    next[nr][nc].heat = Math.min(1, prev[nr][nc].heat + spread * 0.1)
                  }
                }
              }
            }
          }
        }
        return next
      })

      setSmokeLevel(prev => Math.min(1, prev + material.spreadRate * 0.03))
    }, 200)

    return () => clearInterval(interval)
  }, [isRunning, material])

  const getCellColor = (cell) => {
    if (cell.wall) return '#4b5563'
    if (cell.heat <= 0) return '#f3f4f6'
    if (cell.heat < 0.3) return '#fef3c7'
    if (cell.heat < 0.6) return '#fdba74'
    if (cell.heat < 0.8) return '#f97316'
    return '#dc2626'
  }

  const dangerLevel = grid.flat().reduce((sum, cell) => sum + cell.heat, 0) / (GRID_ROWS * GRID_COLS)
  const dangerPercent = Math.round(dangerLevel * 100)

  const handleCellClick = (row, col) => {
    if (isRunning) return
    if (hasCompartment && col === compartmentCol) return
    setFireOrigin({ row, col })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">防耐火シミュレーション</h1>
        <p className="text-gray-500 text-sm mb-8">
          条件を変えて火災の広がり方を観察しましょう（学習用の簡易モデルです）
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">条件設定</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">内装材料</label>
                <div className="space-y-2">
                  {MATERIALS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setMaterial(m); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                        material.id === m.id
                          ? 'border-orange-400 bg-orange-50 text-orange-800'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: m.color }} />
                      {m.label}
                      <span className="text-xs text-gray-400 ml-2">延焼速度: {'●'.repeat(Math.ceil(m.spreadRate * 3))}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCompartment}
                    onChange={e => setHasCompartment(e.target.checked)}
                    className="rounded border-gray-300 accent-orange-600"
                  />
                  防火区画あり
                </label>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOpening}
                    onChange={e => setHasOpening(e.target.checked)}
                    className="rounded border-gray-300 accent-orange-600"
                  />
                  区画に開口部あり
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">操作</h2>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isRunning
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-orange-600 hover:bg-orange-500 text-white'
                  }`}
                >
                  {isRunning ? '一時停止' : timeStep > 0 ? '再開' : '開始'}
                </button>
                <button
                  onClick={resetSimulation}
                  className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  リセット
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  経過時間: <strong>{timeStep}</strong> / 60 ステップ
                </label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={timeStep}
                  onChange={e => {
                    setTimeStep(Number(e.target.value))
                    setIsRunning(false)
                  }}
                  className="w-full accent-orange-600"
                />
              </div>
            </div>
          </div>

          {/* Simulation grid */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">建物平面図</h2>
                <span className="text-xs text-gray-400">クリックで出火点を変更</span>
              </div>

              {/* Smoke overlay */}
              <div className="relative">
                {smokeLevel > 0 && (
                  <div
                    className="absolute inset-0 rounded-lg pointer-events-none z-10 transition-opacity"
                    style={{
                      background: `linear-gradient(to bottom, rgba(107,114,128,${smokeLevel * 0.4}), transparent)`,
                    }}
                  />
                )}

                <div
                  className="grid gap-1 p-3 bg-gray-50 rounded-lg"
                  style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
                >
                  {grid.map((row, r) =>
                    row.map((cell, c) => (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => handleCellClick(r, c)}
                        className="aspect-square rounded-sm transition-colors relative"
                        style={{ backgroundColor: getCellColor(cell) }}
                        aria-label={`セル ${r+1}行 ${c+1}列${cell.wall ? ' 防火壁' : ''}`}
                      >
                        {r === fireOrigin.row && c === fireOrigin.col && timeStep === 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs">🔥</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" /> 未燃焼
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-amber-100" /> 低温
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-orange-300" /> 中温
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-orange-500" /> 高温
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-red-600" /> 炎上
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-gray-600" /> 防火壁
                </span>
              </div>

              {/* Danger gauge */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">延焼危険度</span>
                  <span className={`font-bold ${dangerPercent > 60 ? 'text-red-600' : dangerPercent > 30 ? 'text-orange-600' : 'text-green-600'}`}>
                    {dangerPercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: dangerPercent > 60 ? '#dc2626' : dangerPercent > 30 ? '#f97316' : '#16a34a',
                    }}
                    animate={{ width: `${dangerPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Smoke gauge */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">煙濃度</span>
                  <span className="text-gray-500 font-bold">{Math.round(smokeLevel * 100)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gray-500"
                    animate={{ width: `${smokeLevel * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Fireproofing time */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>耐火性能目安:</strong>{' '}
                  {material.id === 'noncombustible' && '不燃材料は20分以上の耐火性能を持ちます。火災時の延焼を大幅に抑制します。'}
                  {material.id === 'semi-noncombustible' && '準不燃材料は10分以上の耐火性能。不燃材料に比べ延焼しやすくなります。'}
                  {material.id === 'combustible' && '可燃材料は耐火性能が低く、火災時に急速に延焼します。避難時間の確保が困難です。'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
