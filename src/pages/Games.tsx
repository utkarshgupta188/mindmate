import React, { useEffect, useState } from 'react'
import BreathingWidget from '../components/BreathingWidget'
import ReactionGame from '../components/games/ReactionGame'
import MemoryGame from '../components/games/MemoryGame'
import FocusTimer from '../components/games/FocusTimer'
import JournalQuick from '../components/games/JournalQuick'

const TABS = [
  { key: 'breath', label: 'Breathing' },
  { key: 'reaction', label: 'Reaction' },
  { key: 'memory', label: 'Memory' },
  { key: 'focus', label: 'Focus' },
  { key: 'journal', label: 'Journal' },
] as const

type TabKey = typeof TABS[number]['key']

export default function Games(){
  const [tab, setTab] = useState<TabKey>('breath')
  const [overlay, setOverlay] = useState(true)

  useEffect(()=>{
    const t = setTimeout(()=> setOverlay(false), 4000) // 4-second inhale flash
    return ()=>clearTimeout(t)
  }, [])

  return (
    <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
      <div className="space-y-4">
        <div className="card">
          <div className="flex flex-wrap gap-2 mb-3">
            {TABS.map(t => (
              <button key={t.key}
                className={"px-3 py-2 rounded-xl border " + (tab===t.key ? 'bg-forest-600 text-white border-forest-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800')}
                onClick={()=>setTab(t.key)}>{t.label}</button>
            ))}
          </div>
          {tab==='breath' && <BreathingWidget />}
          {tab==='reaction' && <ReactionGame />}
          {tab==='memory' && <MemoryGame />}
          {tab==='focus' && <FocusTimer />}
          {tab==='journal' && <JournalQuick />}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=60',
            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=60',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=60',
          ].map((src,i)=>(
            <img key={i} src={src} alt="calm" className="rounded-xl h-32 w-full object-cover" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Tips</h3>
          <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <li>Exhale slightly longer than you inhale.</li>
            <li>Loosen your shoulders and tongue; release jaw tension.</li>
            <li>Short walks and gentle stretches reset the body.</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Feel‑good photos</h3>
          <img src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=60" alt="nature" className="rounded-xl mb-2"/>
          <p className="text-xs text-slate-500 dark:text-slate-400">Soft, natural scenes can lower arousal and help your nervous system settle.</p>
        </div>
      </div>

      {overlay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="w-36 h-36 rounded-full border-8 border-white/60 mx-auto mb-4 animate-pulse"></div>
            <h3 className="text-2xl font-semibold">Inhale…</h3>
            <p className="text-sm text-white/80">Breathe in gently for 4 seconds</p>
          </div>
        </div>
      )}
    </div>
  )
}
