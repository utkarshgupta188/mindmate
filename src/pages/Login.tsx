import React, { useState } from 'react'

import { useAuth } from '../context/AuthContext'

export default function Login(){
  const { login, loginWithGithub, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string| null>(null)
  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    setError(null)
    try { await login(email, password) } catch (e:any){ setError(e?.message || String(e)) }
  }
  return (
    <div className="max-w-md mx-auto card">
      <h2 className="text-xl font-semibold mb-4">Log in</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full btn btn-primary">Continue</button>
      </form>
      <div className="my-4 flex items-center gap-3">
        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"/>
        <span className="text-xs text-slate-500 dark:text-slate-400">or</span>
        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"/>
      </div>
      <button onClick={async()=>{
        setError(null)
        try { await loginWithGithub() } catch (e:any){ setError(e.message || 'GitHub sign-in failed') }
      }} className="w-full px-3 py-2 rounded-xl border btn-outline">Continue with GitHub</button>
      <div className="h-2"/>
      <button onClick={async()=>{
        setError(null)
        try { await loginWithGoogle() } catch (e:any){ setError(e.message || 'Google sign-in failed') }
      }} className="w-full px-3 py-2 rounded-xl border btn-outline">Continue with Google</button>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
        You can use email demo login above or continue with GitHub (via Firebase).
      </p>
    </div>
  )
}
