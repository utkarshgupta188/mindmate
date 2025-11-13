// progress-server.js
// npm i express cors body-parser
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

// simple persistence file (optional)
const DB_PATH = path.join(process.cwd(), 'progress_store.json')

// load persisted store if present
let store = {}
try {
  if (fs.existsSync(DB_PATH)) {
    store = JSON.parse(fs.readFileSync(DB_PATH, 'utf8') || '{}')
  }
} catch (e) {
  console.warn('Failed to load progress store', e)
}

// helper save
function persist() {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2)) } catch (e) { console.warn('persist failed', e) }
}

// SSE clients: map userId -> Set of res objects
const sseClients = new Map()

function sendSse(userId, data) {
  const clients = sseClients.get(userId)
  if (!clients) return
  const payload = `data: ${JSON.stringify(data)}\n\n`
  for (const res of Array.from(clients)) {
    try { res.write(payload) } catch (e) { /* ignore */ }
  }
}

// ensure user bucket exists
function ensureUser(userId) {
  if (!userId) return null
  if (!store[userId]) store[userId] = { points: [] }
  return store[userId]
}

// POST /api/progress/add
// body: { userId, point: { t:number, value:number, source?:string } }
app.post('/api/progress/add', (req, res) => {
  const { userId, point } = req.body || {}
  if (!userId || !point || typeof point.t !== 'number' || typeof point.value !== 'number') {
    return res.status(400).json({ error: 'missing userId or invalid point' })
  }
  const bucket = ensureUser(userId)
  bucket.points.push(point)
  // keep limited history per user
  if (bucket.points.length > 5000) bucket.points = bucket.points.slice(-5000)
  persist()
  // broadcast via SSE
  sendSse(userId, point)
  return res.json({ ok: true })
})

// GET /api/progress
// query: ?userId=&since= (ms)
app.get('/api/progress', (req, res) => {
  const userId = req.query.userId
  const since = Number(req.query.since || 0)
  if (!userId) return res.status(400).json([])
  const bucket = store[userId] || { points: [] }
  const recent = bucket.points.filter(p => (p.t || 0) > (since || 0))
  // send sorted ascending
  recent.sort((a, b) => a.t - b.t)
  res.json(recent)
})

// SSE: GET /api/progress/stream?userId=
app.get('/api/progress/stream', (req, res) => {
  const userId = req.query.userId
  if (!userId) return res.status(400).send('userId required')
  // headers for SSE
  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive'
  })
  res.flushHeaders && res.flushHeaders()
  // send a comment to keep connection alive on proxies
  res.write(':ok\n\n')

  // register client
  let set = sseClients.get(userId)
  if (!set) { set = new Set(); sseClients.set(userId, set) }
  set.add(res)

  // on close remove
  req.on('close', () => {
    set.delete(res)
    if (set.size === 0) sseClients.delete(userId)
  })
})

// optional: health
app.get('/', (req, res) => res.send('progress-server ok'))

const PORT = process.env.PROGRESS_PORT ? Number(process.env.PROGRESS_PORT) : 5001
app.listen(PORT, () => console.log(`Progress server listening on http://localhost:${PORT}`))
