import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw } from 'lucide-react'

export default function BreathingGame() {
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'exhale'>('idle')
  const [running, setRunning] = useState(false)
  const [level, setLevel] = useState(1)         // 1→4s, 2→5s ... up to 5→8s
  const [timeLeft, setTimeLeft] = useState(0)
  const [rounds, setRounds] = useState(0)
  const timerRef = useRef<number | null>(null)

  const secondsFor = (lvl: number) => 4 + (lvl - 1) // 4..8

  function start() {
    setRunning(true)
    setPhase('inhale')
    setTimeLeft(secondsFor(level))
  }

  function pause() {
    setRunning(false)
    setPhase('idle')
    if (timerRef.current) cancelInterval()
  }

  function reset() {
    pause()
    setLevel(1)
    setRounds(0)
    setTimeLeft(0)
  }

  function cancelInterval() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    if (!running) return
    cancelInterval()
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) return prev - 1

        // phase ended
        if (phase === 'inhale') {
          setPhase('exhale')
          return secondsFor(level)
        } else {
          // completed an inhale+exhale cycle
          setRounds((r) => {
            const next = r + 1
            // every 3 rounds, step up a level (max 5)
            if (next % 3 === 0 && level < 5) setLevel((l) => l + 1)
            return next
          })
          setPhase('inhale')
          return secondsFor(level)
        }
      })
    }, 1000)

    return cancelInterval
  }, [running, phase, level])

  // Space toggles start/pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (!running) start()
        else pause()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running])

  const phaseLabel = phase === 'inhale' ? 'Inhale' : phase === 'exhale' ? 'Exhale' : 'Paused'
  const bgGrad =
    phase === 'inhale'
      ? 'from-sky-400 to-emerald-400'
      : phase === 'exhale'
      ? 'from-rose-400 to-amber-400'
      : 'from-slate-400 to-slate-600'

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6 text-center">
      <h3 className="font-semibold mb-2">Breathing Game</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Press <b>Start</b> (or hit <kbd>Space</kbd>). Cycle grows from 4s up to 8s as you stay steady.
      </p>

      <div className="relative flex items-center justify-center h-64">
        <AnimatePresence mode="wait">
          {phase !== 'idle' && (
            <motion.div
              key={phase}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`absolute inset-0 rounded-full bg-gradient-to-tr ${bgGrad} blur-3xl opacity-20`}
            />
          )}
        </AnimatePresence>

        <motion.div
          key={phase + level}
          animate={{ scale: phase === 'inhale' ? 1.1 : phase === 'exhale' ? 0.9 : 1 }}
          transition={{ duration: secondsFor(level), ease: 'easeInOut' }}
          className="relative w-48 h-48 rounded-full border-[12px] border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-inner"
        >
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{phaseLabel}</p>
            <p className="text-2xl font-semibold">{timeLeft}s</p>
          </div>
        </motion.div>
      </div>

      <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        <p>
          Level: <b>{level}</b> • Rounds: <b>{rounds}</b>
        </p>
      </div>

      <div className="mt-4 flex justify-center gap-3">
        {!running ? (
          <button onClick={start} className="btn btn-primary inline-flex items-center gap-2">
            <Play className="h-4 w-4" /> Start
          </button>
        ) : (
          <button onClick={pause} className="btn btn-outline inline-flex items-center gap-2">
            <Pause className="h-4 w-4" /> Pause
          </button>
        )}
        <button onClick={reset} className="btn inline-flex items-center gap-2">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>
    </div>
  )
}
