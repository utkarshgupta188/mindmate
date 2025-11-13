// src/pages/Signup.tsx
import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ShieldCheck, FileText, Info, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { saveProfile } from '../utils/profileUtils'

type Loved = { name: string; email: string; mobile: string }

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const e164Re = /^\+[1-9]\d{6,14}$/

function strength(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^\w\s]/.test(pw)) s++
  return Math.min(s, 4)
}

export default function Signup() {
  const { signup, loginWithGithub, loginWithGoogle } = useAuth()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loved, setLoved] = useState<Loved[]>([{ name:'', email:'', mobile:'' }, { name:'', email:'', mobile:'' }])
  const [agree, setAgree] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [error, setError] = useState<string| null>(null)
  const [loading, setLoading] = useState(false)

  const pwScore = useMemo(()=>strength(password), [password])
  const pwHints = ['Too short', 'Weak', 'Okay', 'Strong', 'Very strong']

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    setError(null)

    if (!name && !username) return setError('Please add your name or a username.')
    if (!emailRe.test(email)) return setError('Please enter a valid email address.')
    if (mobile && !e164Re.test(mobile)) return setError('Mobile should be E.164 format, e.g., +91XXXXXXXXXX.')
    for (const l of loved){
      if (!l.name && !l.email && !l.mobile) continue
      if (l.email && !emailRe.test(l.email)) return setError('Loved-one email looks invalid.')
      if (l.mobile && !e164Re.test(l.mobile)) return setError('Loved-one mobile must be E.164 format (e.g., +91•••).')
    }
    if (pwScore < 2) return setError('Please choose a stronger password (8+ chars incl. upper/lower/digit/symbol).')
    if (!agree) return setError('Please agree to the Terms & Consent to continue.')

    try {
      setLoading(true)
      const lovedOnesForAPI = loved
        .filter(l => l.name || l.email || l.mobile)
        .map(l => ({ name: l.name || '', email: l.email || '', whatsapp: l.mobile || '' }))

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: name || username || email,
          lovedOnes: lovedOnesForAPI
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(()=>({}))
        throw new Error(error.error || 'Signup failed')
      }

      const data = await response.json()

      // Store token & user object locally
      localStorage.setItem('mindmate_user_token', data.token)
      localStorage.setItem('mindmate_user', JSON.stringify(data.user))

      // Save an initial profile in localStorage for quick population of /profile
      const initialProfile = {
        name: name || username || data.user?.name || '',
        username: username || (data.user && (data.user.username || '')),
        email: data.user?.email || email,
        phone: mobile || '',
        bio: '',
        image: '',
        parentalContact: lovedOnesForAPI.map((l: any) => ({ name: l.name, email: l.email, phone: l.whatsapp || '' })),
        instagram: '',
        facebook: '',
      }
      saveProfile(data.user?.email || email, initialProfile)

      // navigate to dashboard
      window.location.href = '/dashboard'
    } catch (e: any) {
      setError(e?.message || 'Signup failed. Please try again.')
      // fallback attempt via AuthContext.signup (optional)
      try {
        await signup(email, password, name || username || email)
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_120%-10%,theme(colors.indigo.300/15),transparent),radial-gradient(60rem_40rem_at-10%_0%,theme(colors.cyan.300/12),transparent)]" />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="card rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow">
            <ShieldCheck className="h-5 w-5"/>
          </span>
          <div>
            <h2 className="text-xl font-semibold leading-tight">Create your account</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Private by default • You control sharing and alerts</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" htmlFor="full-name">Full name</label>
              <input id="full-name" className="mt-1 w-full border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50" placeholder="e.g., Aisha Khan" value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium" htmlFor="username">Preferred username</label>
              <input id="username" className="mt-1 w-full border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50" placeholder="e.g., aisha" value={username} onChange={e=>setUsername(e.target.value)} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" htmlFor="email">Email</label>
              <input id="email" className="mt-1 w-full border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium" htmlFor="mobile">Mobile (E.164)</label>
              <input id="mobile" className="mt-1 w-full border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50" placeholder="+91XXXXXXXXXX" value={mobile} onChange={e=>setMobile(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium" htmlFor="pw">Password</label>
            <div className="mt-1 relative">
              <input id="pw" type={showPw ? 'text':'password'} className="w-full border rounded-xl pl-3 pr-10 py-2 bg-white/70 dark:bg-slate-900/50" placeholder="8+ chars with mix of types" value={password} onChange={e=>setPassword(e.target.value)} />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-900/5 dark:hover:bg-white/5" onClick={()=>setShowPw(v=>!v)} aria-label={showPw? 'Hide password':'Show password'}>
                {showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
              </button>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className={`h-full transition-all ${pwScore>=1?'bg-rose-500':''}`}
                   style={{ width: `${Math.max(8, pwScore*25)}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{pwHints[pwScore]}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4">
            <h3 className="font-semibold mb-2">Loved-one contacts (Parental/Loved-one)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Add up to two trusted recipients for summaries and urgent alerts (with your consent).</p>
            <div className="grid md:grid-cols-2 gap-3">
              {loved.map((l, i)=> (
                <div key={i} className="space-y-2">
                  <input className="w-full border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50" placeholder="Name" value={l.name} onChange={e=> setLoved(prev => prev.map((it, idx)=> idx===i ? { ...it, name: e.target.value } : it))} />
                  <input className="w-full border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50" placeholder="Email" value={l.email} onChange={e=> setLoved(prev => prev.map((it, idx)=> idx===i ? { ...it, email: e.target.value } : it))} />
                  <input className="w-full border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50" placeholder="Mobile (+91•••)" value={l.mobile} onChange={e=> setLoved(prev => prev.map((it, idx)=> idx===i ? { ...it, mobile: e.target.value } : it))} />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">By default, summaries are prepared for you to review. Nothing is sent automatically without explicit opt-in and verification.</p>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} className="mt-1" />
            <span>
              I agree to the <button type="button" className="underline" onClick={()=>setShowTerms(true)}>Terms & Consent</button> and understand this is a wellness demo, not a medical device. For emergencies in India, call <b>112</b>.
            </span>
          </label>

          {error && (
            <p className="text-red-600 text-sm flex items-center gap-2"><Info className="h-4 w-4"/> {error}</p>
          )}

          <button className="w-full btn btn-primary inline-flex items-center justify-center gap-2" disabled={!agree || loading}>
            {loading ? (<><Loader2 className="h-4 w-4 animate-spin"/> Creating...</>) : (<><CheckCircle2 className="h-4 w-4"/> Create account</>)}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"/>
          <span className="text-xs text-slate-500 dark:text-slate-400">or</span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"/>
        </div>

        <button onClick={async()=>{ setError(null); try { await loginWithGithub() } catch (e:any){ setError(e.message || 'GitHub sign-in failed') } }} className="w-full px-3 py-2 rounded-xl border btn-outline mb-2">Continue with GitHub</button>

        <button onClick={async()=>{ setError(null); try { await loginWithGoogle() } catch (e:any){ setError(e.message || 'Google sign-in failed') } }} className="w-full px-3 py-2 rounded-xl border btn-outline">Continue with Google</button>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          You can create an account with email above or continue with GitHub/Google (via Firebase). This is a demo — not a medical device.
        </p>
      </motion.section>

      <AnimatePresence>
        {showTerms && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} exit={{opacity:0, y:8}} transition={{duration:0.2}} className="max-w-3xl w-full rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5"/>
                <h3 className="font-semibold">Terms & Consent</h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto">
                <p><b>Purpose.</b> MindMate is an educational wellness demo that offers self-help content and mood tracking. It does not provide clinical diagnosis or treatment.</p>
                <p><b>Privacy.</b> Your profile data stays private by default. You control if, when, and what to share with loved ones.</p>
                <p><b>Loved-one summaries.</b> If you enable summaries, drafts will be prepared. No automated sending occurs without explicit opt-in.</p>
                <p><b>Crisis.</b> If you indicate distress the app surfaces quick options (dial 112 in India) and saved contacts. The app will not contact anyone automatically.</p>
                <p><b>Acceptance.</b> By checking “I agree”, you consent to these terms.</p>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button className="btn btn-outline" onClick={()=>setShowTerms(false)}>Close</button>
                <button className="btn btn-primary" onClick={()=>{ setAgree(true); setShowTerms(false) }}>I agree</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}