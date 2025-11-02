import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Play, Shuffle, Filter, Heart, Bookmark, TrendingUp, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
export type Story = { id: string; name: string; text: string; img: string; category: CategoryKey }
export type CategoryKey = 'resilience' | 'focus' | 'gratitude' | 'sleep' | 'anxiety'

const CATEGORIES: Record<CategoryKey, { label: string; desc: string }> = {
  resilience: { label: 'Resilience', desc: 'Bouncing back, persistence, growth' },
  focus: { label: 'Focus', desc: 'Deep work, study energy, clarity' },
  gratitude: { label: 'Gratitude', desc: 'Appreciation, small joys, perspective' },
  sleep: { label: 'Sleep', desc: 'Calm, rest, reset' },
  anxiety: { label: 'Anxiety Relief', desc: 'Breathing, grounding, compassion' },
}

const STORIES: Story[] = [
  { id:'rowling', name: 'J.K. Rowling', category:'resilience', text: 'Before Harry Potter, she faced years of rejection and personal hardship. She kept writing through uncertainty, proving that persistence can transform a low point into a turning point.', img: 'https://images.unsplash.com/photo-1461720525938-0a521f614f40?w=800&q=60' },
  { id:'jobs', name: 'Steve Jobs', category:'resilience', text: 'He was fired from the company he founded, then used that setback to learn, rebuild, and return stronger — a reminder that a detour can shape your best work.', img: 'https://images.unsplash.com/photo-1485217988980-11786ced9454?w=800&q=60' },
  { id:'oprah', name: 'Oprah Winfrey', category:'gratitude', text: 'Early career setbacks and adversity didn’t define her. Compassion, consistency, and self-belief did. She turned vulnerability into connection.', img: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=60' },
  { id:'malala', name: 'Malala Yousafzai', category:'resilience', text: 'She transformed pain into purpose, advocating for education with courage. Even small steps toward what matters are powerful.', img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=60' },
]

const VIDEOS: Record<CategoryKey, string[]> = {
  resilience: ['H14bBuluwB8','hiiEeMN7vbQ','wHGqp8lz36c'],
  focus: ['jfKfPfyJRdk','DWcJFNfaw9c','5yx6BWlEVcY'],
  gratitude: ['itZMM5gCboo','Ukg_U3CnJWI','d4S4twjeWTs'],
  sleep: ['1ZYbU82GVz4','jfKfPfyJRdk','DWcJFNfaw9c'],
  anxiety: ['ZToicYcHIOU','W19PdslW7iw','O-6f5wQXSu8'],
}

function usePrefs() {
  const { user } = useAuth()
  const key = user?.email ? `prefs:${user.email}` : 'prefs:anon'
  const [prefs, setPrefs] = useState<Record<string, number>>(()=>{
    try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} }
  })

  function record(action: 'view'|'like'|'save'|'play', payload: { category?: CategoryKey; storyId?: string; videoId?: string }) {
    const k = payload.category ? `cat:${payload.category}` : payload.storyId ? `story:${payload.storyId}` : payload.videoId ? `vid:${payload.videoId}` : 'misc'
    const next = { ...prefs, [k]: (prefs[k] || 0) + 1 }
    setPrefs(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
    fetch('/api/prefs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.email, action, ...payload, ts: Date.now() })
    }).catch(()=>{})
  }

  return { prefs, record }
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i] as T
    a[i] = a[j] as T
    a[j] = tmp
  }
  return a
}
export default function Motivations(){
  const { prefs, record } = usePrefs()
  const [active, setActive] = useState<CategoryKey>('resilience')
  const [autoRotate, setAutoRotate] = useState(true)
  const rotateRef = useRef<number | null>(null)

  useEffect(() => {
    if (!autoRotate) { if (rotateRef.current) window.clearInterval(rotateRef.current); return }
    rotateRef.current = window.setInterval(() => {
      const keys = Object.keys(CATEGORIES) as CategoryKey[]
      const idx = keys.indexOf(active)
      const next = keys[(idx + 1) % keys.length] as CategoryKey
      setActive(next)
    }, 20000)
    return () => { if (rotateRef.current) window.clearInterval(rotateRef.current) }
  }, [active, autoRotate])

  const stories = useMemo(() => shuffle(STORIES.filter(s => s.category === active)), [active])
  const videos = useMemo(() => (VIDEOS[active] || []).slice(0,3), [active])

  const topCat = useMemo(() => {
    const entries = Object.entries(prefs).filter(([k]) => k.startsWith('cat:'))
    if (!entries.length) return null
    entries.sort((a,b)=> (b[1] - a[1]))
    const top = entries[0]
    if (!top) return null
    const key = top[0].split(':')[1] as CategoryKey
    return key
  }, [prefs])

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow"><Sparkles className="h-5 w-5"/></span>
              Motivations
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Pick a category, watch a short video, or read a quick story. Your choices tune your feed in real time.</p>
            {topCat && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5"/> You seem to enjoy <b className="capitalize">{CATEGORIES[topCat].label}</b> — we’ll show you a bit more of that.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={()=>setAutoRotate(v=>!v)}
              className={`text-xs rounded-full border px-3 py-1.5 inline-flex items-center gap-1 ${autoRotate ? 'bg-white/80 dark:bg-slate-950/40' : ''}`}
              aria-pressed={autoRotate}
              title="Auto-rotate categories every 20s"
            >
              <Shuffle className="h-3.5 w-3.5"/> Auto
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(CATEGORIES) as CategoryKey[]).map((key)=> (
            <button
              key={key}
              onClick={()=>{ setActive(key); record('view', { category: key }) }}
              className={`text-xs rounded-full border px-3 py-1.5 inline-flex items-center gap-2 ${active===key ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white/70 dark:bg-slate-950/40'}`}
            >
              <Filter className="h-3.5 w-3.5"/> {CATEGORIES[key].label}
            </button>
          ))}
        </div>
      </motion.section>

      <AnimatePresence mode="popLayout">
        <motion.section
          key={`${active}-stories`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {stories.map((s)=> (
            <motion.div key={s.id} layout className="group rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition">
              <img src={s.img} alt={s.name} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{s.text}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={()=>record('like', { storyId: s.id, category: s.category })}
                    className="text-xs inline-flex items-center gap-1 rounded-full border px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Heart className="h-3.5 w-3.5"/> Like
                  </button>
                  <button
                    onClick={()=>record('save', { storyId: s.id, category: s.category })}
                    className="text-xs inline-flex items-center gap-1 rounded-full border px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Bookmark className="h-3.5 w-3.5"/> Save
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.section>
      </AnimatePresence>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow"><Play className="h-5 w-5"/></span> Quick videos</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Category: <b className="capitalize">{CATEGORIES[active].label}</b></span>
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          {videos.map((id)=> (
            <div key={id} className="rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60">
              <iframe
                className="w-full aspect-video"
                src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
                title="Motivation video"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={()=>record('play', { category: active, videoId: id })}
              />
              <div className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                <span>Having trouble? Open on YouTube</span>
                <a className="underline" target="_blank" rel="noopener noreferrer" href={`https://www.youtube.com/watch?v=${id}`}>Open</a>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <ToastAnchor />
    </div>
  )
}

function ToastAnchor(){
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(()=>{
    ;(window as any).motivateToast = (m:string)=>{ setMsg(m); setTimeout(()=>setMsg(null), 1500) }
  }, [])
  return (
    <AnimatePresence>
      {msg && (
        <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:6}} transition={{duration:0.2}}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full border bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4"/> {msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
