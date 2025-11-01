import React, { useEffect, useRef, useState } from 'react'

export default function FocusTimer(){
  const [seconds, setSeconds] = useState(60)
  const [running, setRunning] = useState(false)
  const interval = useRef<number | null>(null)

  function start(){ if (interval.current) return; setRunning(true); interval.current = window.setInterval(()=> setSeconds(s=> Math.max(0, s-1)), 1000) as any }
  function pause(){ if (interval.current){ clearInterval(interval.current); interval.current = null; setRunning(false) } }
  function reset(){ pause(); setSeconds(60) }

  useEffect(()=>{ if (seconds === 0) pause(); return () => { if (interval.current) clearInterval(interval.current) } }, [seconds])

  const mm = String(Math.floor(seconds/60)).padStart(2,'0')
  const ss = String(seconds%60).padStart(2,'0')

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">1‑Minute Focus</h3>
      <div className="rounded-xl border p-4 flex items-center justify-between">
        <div className="text-3xl font-bold">{mm}:{ss}</div>
        <div className="flex gap-2">
          {!running ? <button className="btn btn-primary" onClick={start}>Start</button> : <button className="btn btn-outline" onClick={pause}>Pause</button>}
          <button className="btn btn-outline" onClick={reset}>Reset</button>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Try soft gaze, quiet breathing, and unclench your jaw.</p>
    </div>
  )
}
