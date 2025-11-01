import React, { useEffect, useRef, useState } from 'react'

export default function ReactionGame(){
  const [phase, setPhase] = useState<'idle'|'wait'|'now'|'result'>('idle')
  const [message, setMessage] = useState('Click start, then wait for the green screen.')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const timerRef = useRef<number | null>(null)

  function start(){
    setScore(null)
    setPhase('wait')
    setMessage('Wait for green…')
    const delay = 1500 + Math.random()*2500
    timerRef.current = window.setTimeout(()=>{
      setPhase('now')
      setMessage('Tap!')
      setStartTime(performance.now())
    }, delay) as any
  }

  function tap(){
    if (phase === 'wait'){
      setMessage('Too soon! Try again.')
      setPhase('result')
      if (timerRef.current) clearTimeout(timerRef.current)
    } else if (phase === 'now' && startTime){
      const ms = Math.round(performance.now() - startTime)
      setScore(ms)
      setMessage(`Your reaction: ${ms} ms`)
      setPhase('result')
    }
  }

  useEffect(()=>()=>{ if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Reaction Time</h3>
      <div
        onClick={tap}
        className={"rounded-xl h-36 flex items-center justify-center text-lg font-semibold cursor-pointer transition " + (phase==='now' ? 'bg-green-200 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-800')}
      >
        {message}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="btn btn-primary" onClick={start}>Start</button>
        {score !== null && <span className="text-sm text-slate-500 dark:text-slate-400 self-center">Tip: Relax shoulders & gaze softly.</span>}
      </div>
    </div>
  )
}
