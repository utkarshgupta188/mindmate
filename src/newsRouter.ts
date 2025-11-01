import { Router, Request, Response } from 'express'
import crypto from 'node:crypto'
import { XMLParser } from 'fast-xml-parser'
import { FEEDS } from './feeds.js'
import { insertItem, selectByCategory, insertPref } from './db.js'

export const newsRouter = Router()

// Cache recent results in memory too, refresh TTL
let lastFetch = 0
const TTL_MS = 60 * 1000

// Kicks a background refresh (called on interval and by routes)
async function refreshFeeds() {
  const now = Date.now()
  if (now - lastFetch < TTL_MS) return
  lastFetch = now

  const parser = new XMLParser({ ignoreAttributes: false })
  const tasks: Promise<void>[] = []

  for (const [cat, feeds] of Object.entries(FEEDS)) {
    for (const { url, category } of feeds) {
      const task = fetch(url, { headers: { 'User-Agent': 'WellnessApp/1.0 (+https://example.com)' } })
        .then(r => r.text())
        .then(xml => {
          const json = parser.parse(xml)
          const channel = json?.rss?.channel
          const items = Array.isArray(channel?.item) ? channel.item : (channel?.item ? [channel.item] : [])
          const host = tryHost(url)
          items.slice(0, 20).forEach((it: any) => {
            const title = String(it.title ?? 'Untitled').trim()
            const link = String(it.link ?? '#').trim()
            const ts = tryDate(it.pubDate) ?? Date.now()
            const id = hash(`${host}|${title}`)
            insertItem.run({ id, title, link, source: host, category, ts })
          })
        })
        .catch(() => void 0)
      tasks.push(task)
    }
  }
  await Promise.allSettled(tasks)
}

function tryHost(url: string) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return 'feed' }
}
function tryDate(d: any) { const t = Date.parse(d); return Number.isFinite(t) ? t : null }
function hash(s: string) { return crypto.createHash('md5').update(s).digest('hex') }

// Poll route (JSON)
newsRouter.get('/', async (req: Request, res: Response) => {
  const category = String(req.query.category || 'uplifting')
  const limit = Number(req.query.limit || 60)
  await refreshFeeds()
  const rows = selectByCategory.all({ category, limit })
  res.json(rows)
})

// SSE stream (snap + pushes)
newsRouter.get('/stream', async (req: Request, res: Response) => {
  const category = String(req.query.category || 'uplifting')
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // send an immediate snapshot
  await refreshFeeds()
  const first = selectByCategory.all({ category, limit: 60 })
  res.write(`data: ${JSON.stringify(first)}\n\n`)

  // heartbeat + periodic updates
  const ping = setInterval(() => res.write(`event: ping\ndata: {}\n\n`), 15000)
  const tick = setInterval(async () => {
    await refreshFeeds()
    const rows = selectByCategory.all({ category, limit: 60 })
    res.write(`data: ${JSON.stringify(rows)}\n\n`)
  }, 30000)

  req.on('close', () => { clearInterval(ping); clearInterval(tick) })
})

// Optional: capture user preferences for your model later
newsRouter.post('/prefs', (req: Request, res: Response) => {
  const { userId, action, ...payload } = req.body || {}
  insertPref.run(String(userId || ''), String(action || 'unknown'), JSON.stringify(payload || {}), Date.now())
  res.json({ ok: true })
})

// Kick periodic background refresh
setInterval(() => { refreshFeeds().catch(()=>{}) }, TTL_MS)
