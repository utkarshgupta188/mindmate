import React, { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale'
type Mode = 'box' | '478' | 'custom'

/**
 * BreathingWidget
 * - No auto start
 * - Modes:
 *   - box: 4-4-4 (inhale-hold-exhale)
 *   - 4-7-8: inhale 4, hold 7, exhale 8
 *   - custom: set durations below
 */
export default function BreathingWidget() {
  const [mode, setMode] = useState<Mode>('box')
  const [phase, setPhase] = useState<Phase>('idle')
  const [running, setRunning] = useState(false)
  const [rounds, setRounds] = useState(0)
  const timerRef = useRef<number | null>(null)

  // Customizable durations (seconds)
  const [inhaleSec, setInhaleSec] = useState(4)
  const [holdSec, setHoldSec] = useState(4)
  const [exhaleSec, setExhaleSec] = useState(4)

  // Pick actual durations based on mode
  const timing = (() => {
    if (mode === 'box') return { inhale: 4, hold: 4, exhale: 4 }
    if (mode === '478') return { inhale: 4, hold: 7, exhale: 8 }
    return { inhale: inhaleSec, hold: holdSec, exhale: exhaleSec }
  })()

  // Progress circle anim via CSS var
  const [progress, setProgress] = useState(0) // 0..1 within current phase

  function clearTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function stopAll() {
    clearTimer()
    setRunning(false)
    setPhase('idle')
    setProgress(0)
    setRounds(0)
  }

  function start() {
    if (running) return
    setRunning(true)
    setPhase('inhale')
    runPhase('inhale', timing.inhale)
  }

  function nextPhase(p: Phase): Phase {
    if (p === 'inhale') return timing.hold > 0 ? 'hold' : 'exhale'
    if (p === 'hold') return 'exhale'
    if (p === 'exhale') return 'inhale'
    return 'inhale'
  }

  function runPhase(p: Phase, seconds: number) {
    clearTimer()
    if (seconds <= 0) {
      // Skip zero-length phase
      const n = nextPhase(p)
      if (p === 'exhale' && n === 'inhale') setRounds(r => r + 1)
      setPhase(n)
      runPhase(n, n === 'inhale' ? timing.inhale : n === 'hold' ? timing.hold : timing.exhale)
      return
    }

    const startAt = Date.now()
    setProgress(0)

    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startAt) / 1000
      const pct = Math.min(1, elapsed / seconds)
      setProgress(pct)

      if (pct >= 1) {
        clearTimer()
        const n = nextPhase(p)
        if (p === 'exhale' && n === 'inhale') setRounds(r => r + 1)
        setPhase(n)
        const nextSec = n === 'inhale' ? timing.inhale : n === 'hold' ? timing.hold : timing.exhale
        runPhase(n, nextSec)
      }
    }, 50)
  }

  useEffect(() => {
    return () => clearTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // UI helpers
  const labelForPhase: Record<Phase, string> = {
    idle: 'Ready',
    inhale: 'Inhale',
    hold: 'Hold',
    exhale: 'Exhale'
  }

  const phaseColor =
    phase === 'inhale' ? 'from-emerald-400 to-teal-500'
    : phase === 'hold' ? 'from-cyan-400 to-blue-500'
    : phase === 'exhale' ? 'from-indigo-400 to-violet-500'
    : 'from-slate-300 to-slate-400'

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Breathing</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Choose a pattern and press <b>Start</b>. No auto-start.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={running ? stopAll : start}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border ${
              running
                ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {running ? 'Stop' : 'Start'}
          </button>

          <button
            onClick={stopAll}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      {/* mode selector */}
      <div className="mt-4 grid md:grid-cols-3 gap-2">
        {(['box','478','custom'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { stopAll(); setMode(m) }}
            className={`rounded-xl border px-3 py-2 text-sm ${
              mode === m ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {m === 'box' ? 'Box (4-4-4)' : m === '478' ? '4-7-8' : 'Custom'}
          </button>
        ))}
      </div>

      {/* custom timings */}
      {mode === 'custom' && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <NumberInput label="Inhale" value={inhaleSec} setValue={setInhaleSec} />
          <NumberInput label="Hold" value={holdSec} setValue={setHoldSec} />
          <NumberInput label="Exhale" value={exhaleSec} setValue={setExhaleSec} />
        </div>
      )}

      {/* visualizer */}
      <div className="mt-6 flex items-center gap-4">
        <div className="relative mx-auto">
          <div
            className={`h-40 w-40 rounded-full bg-gradient-to-tr ${phaseColor} opacity-90 shadow-md transition-all duration-300`}
            style={{
              transform: `scale(${phase === 'inhale' ? 1 + 0.1 * progress : phase === 'exhale' ? 1.1 - 0.1 * progress : 1.05})`
            }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{labelForPhase[phase]}</div>
              <div className="text-2xl font-semibold">
                {phase === 'idle' ? '—' : Math.max(0, Math.ceil((phase === 'inhale' ? timing.inhale : phase === 'hold' ? timing.hold : timing.exhale) * (1 - progress)))}
                <span className="text-sm ml-1">s</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-600 dark:text-slate-400">
          <div><b>Rounds:</b> {rounds}</div>
          <div><b>Pattern:</b> {mode === 'box' ? '4-4-4' : mode === '478' ? '4-7-8' : `${inhaleSec}-${holdSec}-${exhaleSec}`}</div>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Tip: Exhale slightly longer than you inhale to activate the parasympathetic response.
      </p>
    </div>
  )
}

function NumberInput({
  label, value, setValue
}: { label: string; value: number; setValue: (v: number) => void }) {
  return (
    <label className="text-sm">
      <span className="block text-slate-600 dark:text-slate-300 mb-1">{label} (s)</span>
      <input
        type="number"
        min={0}
        className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-slate-900/50"
        value={value}
        onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
      />
    </label>
  )
}
