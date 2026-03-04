import { useCallback, useEffect, useRef, useState } from 'react'

type Phase = 'Idle' | 'Countdown' | 'Inhale' | 'Hold' | 'Exhale'

const INHALE_TIME = 4
const HOLD_TIME = 7
const EXHALE_TIME = 8

export default function BreathingApp() {
  const [durationMinutes, setDurationMinutes] = useState<number | 'custom'>(5)
  const [customMinutes, setCustomMinutes] = useState<number>(5)
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0) // in seconds

  const [phase, setPhase] = useState<Phase>('Idle')
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(INHALE_TIME)
  const [countdown, setCountdown] = useState(3)

  // Audio context ref
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Timer refs
  const intervalRef = useRef<number | null>(null)
  const isTimeUpRef = useRef(false)

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
  }

  const playDing = useCallback(() => {
    if (!audioCtxRef.current) return

    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = 'sine'
    // Frequency for a relaxing "ding" (e.g., somewhere around 523Hz - C5, or 880Hz - A5)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime) // E5

    // Envelope: quick attack, slow decay
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 3)
  }, [])

  const playTripleDing = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current

    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + i * 0.8)

      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.8)
      gainNode.gain.linearRampToValueAtTime(
        0.5,
        ctx.currentTime + i * 0.8 + 0.05,
      )
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.8 + 2.5,
      )

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start(ctx.currentTime + i * 0.8)
      osc.stop(ctx.currentTime + i * 0.8 + 2.5)
    }
  }, [])

  const startExercise = () => {
    initAudio()
    setIsRunning(true)
    const mins = durationMinutes === 'custom' ? customMinutes : durationMinutes
    setTimeLeft(mins * 60)
    isTimeUpRef.current = false
    setPhase('Countdown')
    setCountdown(3)
  }

  // Countdown tick: handles 3-2-1 before starting real exercise
  useEffect(() => {
    if (phase !== 'Countdown') return
    if (countdown <= 0) {
      setPhase('Inhale')
      setPhaseTimeLeft(INHALE_TIME)
      return
    }
    const t = window.setTimeout(() => {
      setCountdown((c) => c - 1)
    }, 1000)
    return () => window.clearTimeout(t)
  }, [phase, countdown])

  const stopExercise = useCallback(() => {
    setIsRunning(false)
    setPhase('Idle')
    setPhaseTimeLeft(0)
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const isCountingDown = phase === 'Countdown'

  useEffect(() => {
    if (isRunning && !isCountingDown) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            isTimeUpRef.current = true
            return 0
          }
          return prev - 1
        })

        setPhaseTimeLeft((prev) => {
          if (prev <= 1) {
            setPhase((currentPhase) => {
              if (currentPhase === 'Inhale') {
                playDing()
                return 'Hold'
              }
              if (currentPhase === 'Hold') {
                playDing()
                return 'Exhale'
              }
              if (currentPhase === 'Exhale') {
                if (isTimeUpRef.current) {
                  // Time is up, and we finished Exhale!
                  stopExercise()
                  playTripleDing()
                  return 'Idle'
                }
                playDing()
                return 'Inhale'
              }
              return 'Idle'
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [isRunning, isCountingDown, stopExercise, playDing, playTripleDing])

  // Fix phaseTimeLeft on transition
  useEffect(() => {
    if (!isRunning) return
    if (phaseTimeLeft === 0) {
      if (phase === 'Inhale') setPhaseTimeLeft(INHALE_TIME)
      else if (phase === 'Hold') setPhaseTimeLeft(HOLD_TIME)
      else if (phase === 'Exhale') setPhaseTimeLeft(EXHALE_TIME)
    }
  }, [phase, isRunning, phaseTimeLeft])

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Determine circle style based on phase
  const getCircleStyle = () => {
    // Idle or Countdown: show small circle
    if (phase === 'Idle' || phase === 'Countdown') {
      return { transform: 'scale(0.2)', opacity: 0.8 }
    }

    if (phase === 'Inhale') {
      return {
        transform: 'scale(1)',
        transition: `transform ${INHALE_TIME}s linear`,
        opacity: 0.8,
      }
    }

    if (phase === 'Hold') {
      return { transform: 'scale(1)', transition: 'none', opacity: 0.8 }
    }

    if (phase === 'Exhale') {
      return {
        transform: 'scale(0.2)',
        transition: `transform ${EXHALE_TIME}s linear`,
        opacity: 0.8,
      }
    }

    return {}
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-amber-900/10 text-amber-900 p-6 rounded-3xl selection:bg-amber-200">
      {!isRunning ? (
        <div className="flex flex-col items-center gap-8 max-w-md w-full animate-fade-in">
          <div className="flex flex-wrap justify-center gap-4 w-full">
            {[5, 12, 16].map((mins) => (
              <button
                type="button"
                key={mins}
                onClick={() => setDurationMinutes(mins)}
                className={`px-6 py-3 rounded-2xl text-2xl font-medium transition-all duration-300 ${
                  durationMinutes === mins
                    ? 'bg-amber-600 text-amber-50 shadow-lg scale-105'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200 hover:shadow'
                }`}>
                {mins} 分鐘
              </button>
            ))}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setDurationMinutes('custom')}
                className={`px-6 py-3 rounded-2xl text-2xl font-medium transition-all duration-300 ${
                  durationMinutes === 'custom'
                    ? 'bg-amber-600 text-amber-50 shadow-lg scale-105'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200 hover:shadow'
                }`}>
                自訂
              </button>
              {durationMinutes === 'custom' && (
                <div className="flex items-center gap-4 animate-fade-in">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={customMinutes}
                    onChange={(e) =>
                      setCustomMinutes(
                        Math.max(1, parseInt(e.target.value, 10) || 1),
                      )
                    }
                    className="w-24 text-3xl p-3 text-center bg-amber-50 border-2 border-amber-300 rounded-2xl focus:outline-none focus:border-amber-500 text-amber-900"
                  />
                  <span className="text-2xl font-medium text-amber-800">
                    分鐘
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={startExercise}
            className="mt-8 px-12 py-5 bg-amber-700 hover:bg-amber-800 text-3xl font-bold text-amber-50 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95">
            開始
          </button>
        </div>
      ) : (
        <div
          className={`flex flex-col items-center w-full h-[70vh] animate-fade-in ${
            phase === 'Countdown' ? 'justify-center' : 'justify-between'
          }`}>
          {phase !== 'Countdown' && (
            <div className="flex justify-between w-full max-w-2xl px-6 text-2xl font-semibold text-amber-800/60">
              <div>剩餘時間: {formatTime(timeLeft)}</div>
              <button
                type="button"
                onClick={stopExercise}
                className="hover:text-amber-900 hover:underline transition-colors">
                結束
              </button>
            </div>
          )}

          {/* Breathing Visualizer */}
          <div className="relative flex items-center justify-center w-[300px] h-[300px] sm:w-[500px] sm:h-[500px]">
            {/* The animated concentric circles container */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transformOrigin: 'center center',
                ...getCircleStyle(),
              }}>
              {/* Outer light circle */}
              <div className="absolute w-full h-full rounded-full bg-[#fde68a] opacity-30"></div>
              {/* Middle circle */}
              <div className="absolute w-[75%] h-[75%] rounded-full bg-[#fcd34d] opacity-50"></div>
              {/* Inner animated circle */}
              <div className="absolute w-[50%] h-[50%] rounded-full bg-[#fbbf24] shadow-[0_0_40px_rgba(251,191,36,0.5)]"></div>
            </div>

            {/* Static center white circle with number for current phase */}
            <div className="absolute z-20 w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] rounded-full bg-white flex items-center justify-center shadow-lg">
              <span
                key={phase === 'Countdown' ? countdown : phaseTimeLeft}
                className={`font-black transition-all duration-300 ${
                  phase === 'Countdown'
                    ? 'text-7xl sm:text-8xl text-amber-500 scale-up'
                    : 'text-5xl sm:text-6xl text-amber-700'
                }`}>
                {phase === 'Countdown'
                  ? countdown === 0
                    ? '!'
                    : countdown
                  : phase === 'Idle'
                    ? INHALE_TIME
                    : phaseTimeLeft}
              </span>
            </div>
          </div>

          {phase === 'Countdown' ? (
            <p className="mt-8 text-2xl text-amber-700/60">準備好了嗎…</p>
          ) : (
            <div className="h-8"></div> /* Spacer to keep visualizer centered when justify-between is active */
          )}
        </div>
      )}
    </div>
  )
}
