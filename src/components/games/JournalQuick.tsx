import React, { useEffect, useState } from 'react'

const EMOJI = ['😊','😌','😐','😟','😢']

export default function JournalQuick(){
  const [mood, setMood] = useState<string>('')
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  function save(){
    const entry = { ts: Date.now(), mood, text }
    const raw = localStorage.getItem('mm_journal') || '[]'
    const arr = JSON.parse(raw); arr.unshift(entry)
    localStorage.setItem('mm_journal', JSON.stringify(arr.slice(0,50)))
    setSaved(true); setTimeout(()=>setSaved(false), 1200)
    setText('')
  }

  useEffect(()=>{ setMood('😌') }, [])

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Quick Journal</h3>
      <div className="flex gap-2 mb-2">
        {EMOJI.map(e=>(
          <button key={e} className={"text-xl rounded-xl px-2 py-1 border " + (mood===e ? 'bg-forest-100 dark:bg-forest-900/30' : '')} onClick={()=>setMood(e)}>{e}</button>
        ))}
      </div>
      <textarea className="w-full border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50" rows={3} placeholder="One line about how you feel…" value={text} onChange={e=>setText(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <button className="btn btn-primary" onClick={save} disabled={!text.trim()}>Save</button>
        {saved && <span className="text-sm text-slate-500 dark:text-slate-400 self-center">Saved ✓</span>}
      </div>
    </div>
  )
}
