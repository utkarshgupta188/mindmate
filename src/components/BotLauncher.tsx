import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function BotLauncher(){
  const [open, setOpen] = useState(false)
  const nav = useNavigate()

  return (
    <>
      <button onClick={()=>setOpen(true)} className="px-3 py-2 rounded-xl bg-forest-600 text-white hover:bg-forest-700">Talk</button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h3 className="font-semibold mb-2">Choose your companion</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Pick a style you vibe with — you can switch anytime.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={()=>nav('/chat/adem')} className="px-3 py-3 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800">🧠 Adem</button>
              <button onClick={()=>nav('/chat/eve')} className="px-3 py-3 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800">🌿 Eve</button>
            </div>
            <button onClick={()=>setOpen(false)} className="mt-4 w-full px-3 py-2 rounded-xl border">Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}
