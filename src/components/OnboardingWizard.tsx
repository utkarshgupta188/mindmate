import React, { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { OnboardingAnswers } from '../utils/onboarding'

type Props = {
  onComplete: (a: OnboardingAnswers) => void
}

export default function OnboardingWizard({ onComplete }: Props){
  const [a, setA] = useState<OnboardingAnswers>({ consent: false })
  // Prevent background page scroll while modal is open
  useEffect(()=>{
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return ()=>{ document.body.style.overflow = prev }
  }, [])
  const canFinish = useMemo(()=>{
    return !!a.consent
      && !!a.goal
      && !!a.humor
      && !!a.style
  }, [a])

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div role="dialog" aria-modal className="card max-w-2xl w-full rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/70 p-5 overflow-y-auto nice-scrollbar max-h-[88vh]">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="font-semibold text-lg">Before we chat: a quick 1‑minute setup</h3>
            <p className="text-xs text-slate-500">These preferences live only in your browser and help me be more helpful.</p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs mb-1">Preferred name (optional)</label>
            <input className="w-full border rounded-lg px-3 py-2 bg-white/70 dark:bg-slate-900/50" placeholder="e.g., Sam" value={a.name||''} onChange={e=>setA({...a, name: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs mb-1">Pronouns (optional)</label>
            <select className="w-full border rounded-lg px-3 py-2 bg-white/70 dark:bg-slate-900/50" value={a.pronouns||''} onChange={e=>setA({...a, pronouns: (e.target.value||undefined) as any})}>
              <option value="">Select…</option>
              <option>she/her</option>
              <option>he/him</option>
              <option>they/them</option>
              <option>prefer-not-to-say</option>
              <option>other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1">What brings you here today?</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['reduce-stress','Reduce stress'],
                ['improve-sleep','Improve sleep'],
                ['stay-motivated','Stay motivated'],
                ['talk-it-out','Talk things out'],
              ] as const).map(([val,label]) => (
                <button key={val} type="button" className={'px-3 py-2 rounded-xl border ' + (a.goal===val?'bg-forest-100 dark:bg-forest-900/30':'')} onClick={()=>setA({...a, goal: val})}>{label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1">How stressed do you feel right now?</label>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={'px-3 py-1.5 rounded-xl border ' + ((a.stress||3)===n ? 'bg-slate-100 dark:bg-slate-800' : '')}
                    onClick={()=>setA({...a, stress: n as any})}
                    aria-pressed={(a.stress||3)===n}
                    aria-label={`Stress ${n} of 5`}
                  >{n}</button>
                ))}
              </div>
              <div className="text-xs mt-1">Selected: {a.stress||3} / 5</div>
            </div>
            <div>
              <label className="block text-xs mb-1">How was your sleep last night?</label>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={'px-3 py-1.5 rounded-xl border ' + ((a.sleep||3)===n ? 'bg-slate-100 dark:bg-slate-800' : '')}
                    onClick={()=>setA({...a, sleep: n as any})}
                    aria-pressed={(a.sleep||3)===n}
                    aria-label={`Sleep ${n} of 5`}
                  >{n}</button>
                ))}
              </div>
              <div className="text-xs mt-1">Selected: {a.sleep||3} / 5</div>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1">Do you feel you have someone you can reach out to if needed?</label>
            <div className="flex gap-2">
              {(['yes','no','unsure'] as const).map(v => (
                <button key={v} type="button" className={'px-3 py-1.5 rounded-xl border ' + (a.support===v?'bg-slate-100 dark:bg-slate-800':'')} onClick={()=>setA({...a, support: v})}>{v}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1">Humor preference</label>
            <div className="flex flex-wrap gap-2">
              {([
                ['avoid','Avoid humor'],
                ['sometimes','Sometimes okay'],
                ['open','Open to light humor'],
              ] as const).map(([val,label]) => (
                <button key={val} type="button" className={'px-3 py-1.5 rounded-xl border ' + (a.humor===val?'bg-slate-100 dark:bg-slate-800':'')} onClick={()=>setA({...a, humor: val as any})}>{label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1">What tone helps you most?</label>
            <div className="flex flex-wrap gap-2">
              {([
                ['gentle','Gentle reassurance'],
                ['practical','Practical tips'],
                ['energizing','Cheering energy'],
              ] as const).map(([val,label]) => (
                <button key={val} type="button" className={'px-3 py-1.5 rounded-xl border ' + (a.style===val?'bg-slate-100 dark:bg-slate-800':'')} onClick={()=>setA({...a, style: val as any})}>{label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1">Would you like grounding/breathing suggestions?</label>
            <div className="flex gap-2">
              {(['yes','no'] as const).map(v => (
                <button key={v} type="button" className={'px-3 py-1.5 rounded-xl border ' + (a.grounding===v?'bg-slate-100 dark:bg-slate-800':'')} onClick={()=>setA({...a, grounding: v})}>{v}</button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 text-xs">
            Not a medical device. If you might be in danger or crisis, please contact local emergency services or a trusted person immediately.
          </div>
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" checked={!!a.consent} onChange={e=>setA({...a, consent: e.target.checked})} /> I understand and agree to continue
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-primary disabled:opacity-60" disabled={!canFinish} onClick={()=>onComplete(a)}>Start chat</button>
        </div>
      </div>
    </div>
  )
}
