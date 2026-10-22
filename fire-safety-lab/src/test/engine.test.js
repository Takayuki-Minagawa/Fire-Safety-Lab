import { describe, it, expect } from 'vitest'
import { DEFAULT_CONFIG, MAX_STEP, ROOMS, simulate, safetyScore } from '../lib/fireSim'
import { MAX_MINUTES, MEMBERS, fireTemperature, simulateMember } from '../lib/memberSim'
import { MISSIONS } from '../data/missions'
import { QUESTIONS, buildRound, rankFor } from '../data/quiz'
import { CASES } from '../data/cases'
import { EMPTY_PROGRESS, summarize } from '../lib/progress'

const end = config => simulate(config).frames[MAX_STEP].stats
const base = { ...DEFAULT_CONFIG }

describe('fire simulation engine', () => {
  it('is deterministic and produces every frame', () => {
    const a = simulate(base)
    const b = simulate(base)
    expect(a.frames).toHaveLength(MAX_STEP + 1)
    expect(a.frames[MAX_STEP].stats).toEqual(b.frames[MAX_STEP].stats)
  })

  it('spreads less with non-combustible finishes than with combustible ones', () => {
    const non = end({ ...base, material: 'noncombustible', compartment: false, roomDoors: 'open' })
    const comb = end({ ...base, material: 'combustible', compartment: false, roomDoors: 'open' })
    expect(non.burnRatio).toBeLessThan(comb.burnRatio)
    expect(non.safety).toBeGreaterThan(comb.safety)
  })

  it('keeps the other side safe when the fire door closes', () => {
    const sim = simulate({ ...base, material: 'combustible', compartment: true, fireDoor: 'auto' })
    const last = sim.frames[MAX_STEP]
    expect(last.fireDoorClosedAt).not.toBeNull()
    expect(last.stats.sideBurned.east).toBe(0)
  })

  it('loses the compartment effect when the fire door is blocked', () => {
    const stats = end({ ...base, material: 'retardant', compartment: true, fireDoor: 'blocked', roomDoors: 'open' })
    expect(stats.sideBurned.east).toBeGreaterThan(0)
  })

  it('evacuates more people with two-way evacuation', () => {
    const cfg = { ...base, material: 'combustible', compartment: false, roomDoors: 'open' }
    expect(end({ ...cfg, twoWay: true }).evacuated).toBeGreaterThan(end({ ...cfg, twoWay: false }).evacuated)
  })

  it('reduces corridor smoke with smoke exhaust', () => {
    const cfg = { ...base, material: 'combustible', compartment: false, roomDoors: 'open' }
    expect(end({ ...cfg, exhaust: true }).corridorSmoke).toBeLessThan(end({ ...cfg, exhaust: false }).corridorSmoke)
  })

  it('offers eight rooms as fire origins', () => {
    expect(ROOMS.map(r => r.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('scores safety between 0 and 100', () => {
    expect(safetyScore(0, 0, 0)).toBe(100)
    expect(safetyScore(1, 1, 1)).toBe(0)
  })
})

describe('missions', () => {
  // 各ミッションに少なくとも1つの解があることを確認する
  const solutions = {
    observe: base,
    'move-origin': { ...base, origin: { row: 2, col: 10 } },
    contain: { ...base, material: 'combustible', compartment: true, fireDoor: 'auto' },
    'blocked-door': { ...base, material: 'retardant', compartment: true, fireDoor: 'blocked', roomDoors: 'open' },
    'one-way': { ...base, twoWay: false, material: 'quasi', roomDoors: 'closed' },
    'smoke-control': { ...base, material: 'retardant', compartment: true, fireDoor: 'auto', roomDoors: 'open', exhaust: true },
    'safety-80': { ...base, material: 'combustible', compartment: true, fireDoor: 'auto', twoWay: true, exhaust: true },
    worst: { ...base, material: 'combustible', compartment: false, roomDoors: 'open', twoWay: false },
  }

  it('clears only the observation mission with the default settings', () => {
    const frames = simulate(base).frames
    expect(MISSIONS.filter(m => m.check(base, frames)).map(m => m.id)).toEqual(['observe'])
  })

  it.each(MISSIONS.map(m => [m.id, m]))('%s is achievable', (id, mission) => {
    const config = solutions[id]
    expect(config).toBeDefined()
    expect(mission.check(config, simulate(config).frames)).toBe(true)
  })

  it('contain mission fails without a compartment', () => {
    const config = { ...base, material: 'combustible', compartment: false }
    const mission = MISSIONS.find(m => m.id === 'contain')
    expect(mission.check(config, simulate(config).frames)).toBe(false)
  })
})

describe('case studies', () => {
  it.each(CASES.map(c => [c.id, c]))('case A (%s) is safer than case B', (id, c) => {
    expect(end(c.a.config).safety).toBeGreaterThan(end(c.b.config).safety)
  })
})

describe('member fire resistance model', () => {
  it('follows the ISO 834 standard fire curve', () => {
    expect(Math.round(fireTemperature(0))).toBe(20)
    expect(Math.round(fireTemperature(30))).toBeCloseTo(842, -1)
    expect(Math.round(fireTemperature(60))).toBeCloseTo(945, -1)
  })

  it('fails quickly for bare steel', () => {
    expect(simulateMember('steel').failTime).toBeLessThan(20)
  })

  it('lasts longer with thicker coating, cover and section', () => {
    const t = (id, v) => simulateMember(id, v).failTime ?? MAX_MINUTES
    expect(t('coated', 40)).toBeGreaterThan(t('coated', 20))
    expect(t('rc', 50)).toBeGreaterThan(t('rc', 30))
    expect(t('wood', 300)).toBeGreaterThan(t('wood', 150))
  })

  it('starts the member challenges below their targets', () => {
    expect(simulateMember('coated', MEMBERS.coated.param.default).failTime).toBeLessThan(60)
    expect(simulateMember('wood', MEMBERS.wood.param.default).failTime).toBeLessThan(45)
    expect(simulateMember('rc', MEMBERS.rc.param.default).failTime).toBeLessThan(120)
  })

  it('makes the member challenges reachable', () => {
    expect(simulateMember('coated', 25).failTime).toBeGreaterThanOrEqual(60)
    expect(simulateMember('wood', 240).failTime).toBeGreaterThanOrEqual(45)
    expect(simulateMember('rc', 40).failTime).toBeGreaterThanOrEqual(120)
  })
})

describe('quiz', () => {
  it('builds a round with shuffled but valid options', () => {
    const round = buildRound(5)
    expect(round).toHaveLength(5)
    for (const q of round) {
      expect([...q.order].sort()).toEqual(q.options.map((_, i) => i))
      expect(q.answer).toBeLessThan(q.options.length)
    }
    expect(new Set(round.map(q => q.id)).size).toBe(5)
  })

  it('has unique question ids', () => {
    expect(new Set(QUESTIONS.map(q => q.id)).size).toBe(QUESTIONS.length)
  })

  it('gives a rank for every score', () => {
    expect(rankFor(100).title).toBe('防耐火マイスター')
    expect(rankFor(0).title).toBeTruthy()
  })
})

describe('progress summary', () => {
  it('starts at 0% and reaches 100% when everything is done', () => {
    expect(summarize(EMPTY_PROGRESS).percent).toBe(0)
    const { steps } = summarize(EMPTY_PROGRESS)
    const full = {
      ...EMPTY_PROGRESS,
      readCards: Object.fromEntries(Array.from({ length: steps[0].total }, (_, i) => [`c${i}`, true])),
      missions: Object.fromEntries(MISSIONS.map(m => [m.id, true])),
      viewedCases: Object.fromEntries(CASES.map(c => [c.id, true])),
      quizBest: 100,
    }
    expect(summarize(full).percent).toBe(100)
  })
})
