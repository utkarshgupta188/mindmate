import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Filter, Globe, AlertTriangle, Clock, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ---------------- Types ----------------
type Item = { title: string; link: string; source: string; ts: number }

type FeedConf = { key: string; label: string; url: string }

// Add/remove feeds here
const FEEDS: FeedConf[] = [
  { key: 'gnn', label: 'Good News Network', url: 'https://www.goodnewsnetwork.org/feed/' },
  { key: 'positivenews', label: 'Positive News', url: 'https://www.positive.news/feed/' },
  // Example India‑centric positive feed (uncomment if you confirm CORS works in your environment)
  // { key: 'thebetterindia', label: 'The Better India', url: 'https://www.thebetterindia.com/feed/' },
]

// -------------- Helpers ---------------
async function fetchRSS(url: string): Promise<Item[]> {
  const ctrl = new AbortController()
  const to = setTimeout(()=>ctrl.abort(), 12000)
  try {
    const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    const res = await fetch(prox, { signal: ctrl.signal })
    const text = await res.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/xml')
    const items = Array.from(doc.querySelectorAll('item')).slice(0, 12)
    const host = new URL(url).hostname.replace('www.', '')
    const now = Date.now()
    return items.map(it => ({
      title: it.querySelector('title')?.textContent || 'Untitled',
      link: it.querySelector('link')?.textContent || '#',
      source: host,
      ts: now,
    }))
  } finally {
    clearTimeout(to)
  }
}

function dedupe(items: Item[]) {
  const seen = new Set<string>()
  return items.filter(it => {
    const k = `${it.source}|${it.title}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function usePrefsKey(userId?: string) { return userId ? `news:prefs:${userId}` : 'news:prefs:anon' }

// ---------------- Component -------------
export default function News(){
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFeeds, setActiveFeeds] = useState<string[]>(()=>{
    try {
      const raw = localStorage.getItem(usePrefsKey(user?.email)+':feeds')
      if (raw) return JSON.parse(raw)
    } catch {}
    return FEEDS.map(f=>f.key)
  })
  const [autoRefresh, setAutoRefresh] = useState(true)
  const refreshRef = useRef<number | null>(null)

  const selected = useMemo(()=> FEEDS.filter(f => activeFeeds.includes(f.key)), [activeFeeds])

  async function loadNews() {
    setLoading(true)
    setError(null)
    try {
      const lists = await Promise.all(selected.map(f => fetchRSS(f.url).catch(()=>[])))
      const merged = dedupe(lists.flat())
      setItems(merged.slice(0, 18))
      // persist last successful payload for faster paint next visit
  try { localStorage.setItem(usePrefsKey(user?.email)+':cache', JSON.stringify(merged.slice(0, 30))) } catch {}

      // optional: fire a signal for preference learning
      fetch('/api/prefs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
        userId: user?.email, action: 'news_refresh', feeds: selected.map(s=>s.key), ts: Date.now()
      }) }).catch(()=>{})
    } catch (e:any) {
      setError(e?.message || 'Failed to fetch news')
    } finally {
      setLoading(false)
    }
  }

  // Instant paint from cache then refresh
  useEffect(()=>{
    try {
  const raw = localStorage.getItem(usePrefsKey(user?.email)+':cache')
      if (raw) setItems(JSON.parse(raw))
    } catch {}
    loadNews()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selected.map(s=>s.key))])

  // Auto-refresh every 10 minutes
  useEffect(()=>{
    if (!autoRefresh) { if (refreshRef.current) window.clearInterval(refreshRef.current); return }
    refreshRef.current = window.setInterval(loadNews, 10 * 60 * 1000)
    return ()=>{ if (refreshRef.current) window.clearInterval(refreshRef.current) }
  }, [autoRefresh, selected])

  function toggleFeed(key: string) {
    setActiveFeeds(prev => {
      const next = prev.includes(key) ? prev.filter(k=>k!==key) : [...prev, key]
  try { localStorage.setItem(usePrefsKey(user?.email)+':feeds', JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Header / Controls */}
      <motion.section initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.35}}
        className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow">
              <Sparkles className="h-5 w-5"/>
            </span>
            <div>
              <h2 className="font-semibold text-xl">Positive News</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Curated, uplifting stories. Auto-refresh every 10 minutes.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadNews} className="text-xs rounded-full border px-3 py-1.5 inline-flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            <button onClick={()=>setAutoRefresh(v=>!v)} className={`text-xs rounded-full border px-3 py-1.5 inline-flex items-center gap-2 ${autoRefresh ? 'bg-white/80 dark:bg-slate-950/40' : ''}`} aria-pressed={autoRefresh}>
              <Clock className="h-3.5 w-3.5"/> Auto
            </button>
          </div>
        </div>

        {/* Feed filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          {FEEDS.map(f => (
            <button key={f.key} onClick={()=>toggleFeed(f.key)} className={`text-xs rounded-full border px-3 py-1.5 inline-flex items-center gap-2 ${activeFeeds.includes(f.key) ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white/70 dark:bg-slate-950/40'}`}>
              <Filter className="h-3.5 w-3.5"/> {f.label}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:6}} className="rounded-2xl border border-amber-300/40 bg-amber-50/70 text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-200 p-4">
            <p className="text-sm flex items-start gap-2"><AlertTriangle className="h-4 w-4"/> {error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !items.length ? (
          Array.from({ length: 6 }).map((_,i)=>(
            <div key={i} className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 h-32 animate-pulse" />
          ))
        ) : (
          items.map((n, i)=>(
            <a key={i} href={n.link} target="_blank" rel="noreferrer noopener" className="group rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-4 hover:shadow-lg hover:-translate-y-0.5 transition relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-forest-200/20 to-mint/20 dark:from-forest-900/10 dark:to-forest-800/10 pointer-events-none" />
              <div className="flex items-start gap-3">
                <div className="relative w-28 h-20 rounded-xl overflow-hidden flex-none">
                  <img src={`https://source.unsplash.com/480x300/?nature,calm,positive,${encodeURIComponent(n.title.split(' ')[0]||'hope')}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold group-hover:underline line-clamp-2">{n.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5"/> {n.source}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Curated positive updates that hint at a brighter future.</p>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
