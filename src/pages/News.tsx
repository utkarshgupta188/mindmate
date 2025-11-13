import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Filter, Globe, AlertTriangle, Clock, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ---------------- Types ----------------
type Item = {
  title: string
  link: string
  source: string
  ts: number           // epoch ms derived from pubDate (or Date.now())
  pubDate?: string     // original pubDate string (if present)
  img?: string
  snippet?: string
}

type Category = { key: string; label: string }

// Server categories (match backend/feeds.js). Use these for reliable, CORS-free loading.
const CATEGORIES: Category[] = [
  { key: 'uplifting', label: 'Uplifting' },
  { key: 'health', label: 'Health' },
  { key: 'science', label: 'Science' },
  { key: 'environment', label: 'Environment' },
  { key: 'education', label: 'Education' },
  { key: 'community', label: 'Community' },
  { key: 'business', label: 'Business' },
  { key: 'all', label: 'All' },
]

// -------------- Helpers ---------------

// Try to extract an image from a feed item node
function extractImageFromItem(itemNode: Element): string | undefined {
  // common places images live in RSS items
  const enclosure = itemNode.querySelector('enclosure[url]')?.getAttribute('url')
  const mediaContent = itemNode.getElementsByTagNameNS?.('http://search.yahoo.com/mrss/', 'content')[0]?.getAttribute('url')
    || itemNode.querySelector('media\\:content, media\\:thumbnail')?.getAttribute('url')
  // sometimes images in description as <img src="...">
  const desc = itemNode.querySelector('description')?.textContent || ''
  const imgFromDesc = desc && (() => {
    const m = desc.match(/<img[^>]+src=["']([^"']+)["']/i)
    return m ? m[1] : undefined
  })()

  return enclosure || mediaContent || imgFromDesc
}

async function fetchRSS(url: string): Promise<Item[]> {
  // Use a CORS-friendly proxy. For production run this server-side (see api/news.ts example).
  const ctrl = new AbortController()
  const to = setTimeout(()=>ctrl.abort(), 12000)
  try {
    const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    const res = await fetch(prox, { signal: ctrl.signal })
    const text = await res.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/xml')
    const items = Array.from(doc.querySelectorAll('item')).slice(0, 30) // grab more, trim later
    const host = new URL(url).hostname.replace('www.', '')
    return items.map(it => {
      const title = it.querySelector('title')?.textContent?.trim() || 'Untitled'
      const link = it.querySelector('link')?.textContent?.trim() || it.querySelector('guid')?.textContent?.trim() || '#'
      const pub = it.querySelector('pubDate')?.textContent?.trim() || it.querySelector('dc\\:date')?.textContent?.trim()
      let ts = Date.now()
      if (pub) {
        const d = Date.parse(pub)
        if (!Number.isNaN(d)) ts = d
      }
      const snippet = it.querySelector('description')?.textContent?.replace(/<\/?[^>]+(>|$)/g, '').slice(0, 240) // strip tags
      const img = extractImageFromItem(it) || undefined
      return { title, link, source: host, ts, pubDate: pub, img, snippet }
    })
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
  const [dense, setDense] = useState(false)
  const [category, setCategory] = useState<string>(()=>{
    try {
      return localStorage.getItem(usePrefsKey(user?.email)+':category') || 'uplifting'
    } catch { return 'uplifting' }
  })
  const [autoRefresh, setAutoRefresh] = useState(true)
  const refreshRef = useRef<number | null>(null)

  const selectedLabel = useMemo(()=> CATEGORIES.find(c=>c.key===category)?.label || 'Uplifting', [category])
  const gridCls = useMemo(()=> dense ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid md:grid-cols-1 lg:grid-cols-2 gap-8', [dense])

  // If you want NewsAPI (JSON) results via your server-side endpoint, set useServerNews = true
  const useServerNews = true // always prefer server to avoid CORS issues
  // NOTE: server-based news is recommended to avoid CORS and API-key exposure

  async function loadNews() {
    setLoading(true)
    setError(null)
    try {
      let merged: Item[] = []
      if (useServerNews) {
        // Fetch from backend aggregator by category (CORS-free)
        const res = await fetch(`/api/news?category=${encodeURIComponent(category)}&limit=60`)
        if (!res.ok) throw new Error('Server news fetch failed')
        const data = await res.json()
        // backend returns [{ title, link, source, category, ts }]
        merged = (Array.isArray(data) ? data : data.items || []) as Item[]
      } else {
        // client-side RSS fetch with CORS proxy (fallback)
        // Keeping a small, built-in set as fallback if server route not available
        const fallbackFeeds = [
          'http://feeds.bbci.co.uk/news/world/rss.xml',
          'http://feeds.reuters.com/Reuters/worldNews',
          'https://www.theguardian.com/world/rss'
        ]
        const lists = await Promise.all(fallbackFeeds.map(u => fetchRSS(u).catch(()=>[])))
        merged = dedupe(lists.flat())
      }

      // sort by timestamp desc and limit
      merged.sort((a,b)=>b.ts - a.ts)
      const sliced = merged.slice(0, 30)
      setItems(sliced)

      // persist last successful payload for faster paint next visit
  try { localStorage.setItem(usePrefsKey(user?.email)+':cache', JSON.stringify(sliced)) } catch {}

      // optional: telemetry
      fetch('/api/news/prefs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
        userId: user?.email, action: 'news_refresh', category, ts: Date.now()
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
  }, [category])

  // Auto-refresh every 10 minutes
  useEffect(()=>{
    if (!autoRefresh) { if (refreshRef.current) window.clearInterval(refreshRef.current); return }
    refreshRef.current = window.setInterval(loadNews, 10 * 60 * 1000)
    return ()=>{ if (refreshRef.current) window.clearInterval(refreshRef.current) }
  }, [autoRefresh, category])

  function chooseCategory(key: string) {
    setCategory(() => {
      try { localStorage.setItem(usePrefsKey(user?.email)+':category', key) } catch {}
      return key
    })
  }

  // small helper to format date
  const fmt = (ms?: number) => {
    if (!ms) return ''
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms))
    } catch { return new Date(ms).toLocaleString() }
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
              <h2 className="font-semibold text-xl">Latest News</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Category: {selectedLabel}. Served by the built-in server aggregator.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadNews} className="text-xs rounded-full border px-3 py-1.5 inline-flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            <button onClick={()=>setAutoRefresh(v=>!v)} className={`text-xs rounded-full border px-3 py-1.5 inline-flex items-center gap-2 ${autoRefresh ? 'bg-white/80 dark:bg-slate-950/40' : ''}`} aria-pressed={autoRefresh}>
              <Clock className="h-3.5 w-3.5"/> Auto
            </button>
            <button onClick={()=>setDense(v=>!v)} className={`text-xs rounded-full border px-3 py-1.5 inline-flex items-center gap-2 ${dense ? 'bg-white/80 dark:bg-slate-950/40' : ''}`} aria-pressed={dense} title={dense ? 'Compact view' : 'Comfortable view'}>
              <Globe className="h-3.5 w-3.5"/> {dense ? 'Compact' : 'Comfortable'}
            </button>
          </div>
        </div>

        {/* Feed filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={()=>chooseCategory(c.key)} className={`text-xs rounded-full border px-3 py-1.5 inline-flex items-center gap-2 ${category===c.key ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white/70 dark:bg-slate-950/40'}`}>
              <Filter className="h-3.5 w-3.5"/> {c.label}
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
      <div className={gridCls}>
        {loading && !items.length ? (
          Array.from({ length: 6 }).map((_,i)=>(
            <div key={i} className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 h-64 animate-pulse" />
          ))
        ) : (
          items.map((n, i)=>(
            <a key={i} href={n.link} target="_blank" rel="noreferrer noopener" className="group rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur hover:shadow-lg hover:-translate-y-0.5 transition relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-forest-200/10 to-mint/10 dark:from-forest-900/10 dark:to-forest-800/10 pointer-events-none" />
              {/* Image */}
              <div className="relative w-full h-48 md:h-56 lg:h-64 bg-slate-100 dark:bg-slate-800">
                <img
                  src={n.img || `https://source.unsplash.com/960x540/?news,${encodeURIComponent(n.title.split(' ')[0]||'world')}`}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = `https://source.unsplash.com/960x540/?news,${encodeURIComponent(n.source)}` }}
                />
              </div>
              {/* Content */}
              <div className="p-4 md:p-5">
                <h3 className="font-semibold group-hover:underline line-clamp-2 text-base md:text-lg">{n.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5"/> {n.source} • <span>{fmt(n.ts)}</span></p>
                {n.snippet && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-3">{n.snippet}</p>}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
