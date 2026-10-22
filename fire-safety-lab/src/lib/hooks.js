import { useCallback, useEffect, useRef, useState } from 'react'

/** ページごとに <title> を設定する */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title}｜防耐火ラボ` : '防耐火ラボ｜火災から建築を守る仕組みを学ぶ'
  }, [title])
}

/**
 * タイムスライダーの再生制御
 *  - step を 0〜max の範囲で進める
 *  - 最後まで到達したら onEnd を呼ぶ（ミッション判定などに使う）
 */
export function usePlayback(max, { baseInterval = 220, onEnd } = {}) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const stepRef = useRef(0)
  const onEndRef = useRef(onEnd)

  useEffect(() => {
    stepRef.current = step
    onEndRef.current = onEnd
  })

  const seek = useCallback(
    value => {
      const next = Math.max(0, Math.min(max, value))
      stepRef.current = next
      setStep(next)
      if (next === max) onEndRef.current?.()
    },
    [max],
  )

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      if (stepRef.current >= max) {
        setPlaying(false)
        return
      }
      seek(stepRef.current + 1)
    }, baseInterval / speed)
    return () => clearInterval(id)
  }, [playing, speed, max, baseInterval, seek])

  const toggle = useCallback(() => {
    if (!playing && stepRef.current >= max) seek(0)
    setPlaying(p => !p)
  }, [playing, max, seek])

  const pause = useCallback(() => setPlaying(false), [])
  const restart = useCallback(() => {
    setPlaying(false)
    seek(0)
  }, [seek])

  return { step, seek, playing: playing && step < max, toggle, pause, restart, speed, setSpeed }
}
