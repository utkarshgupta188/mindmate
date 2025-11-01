// Vercel serverless API entry: wraps our Express routers
import express from 'express'
import cors from 'cors'
import { newsRouter } from '../backend/newsRouter.js'
import { sentimentRouter } from '../backend/sentimentRouter.js'
import { authRouter } from '../backend/authRouter.js'
import { initDatabase } from '../backend/database.js'

// Create a single Express app to handle all /api/* routes
const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_, res) => res.json({ ok: true, message: 'Serverless API healthy ✅' }))
app.use('/api/news', newsRouter)
app.use('/api/sentiment', sentimentRouter)
app.use('/api/auth', authRouter)

let initialized = false
async function ensureInit() {
  if (!initialized) {
    try {
      await initDatabase()
    } catch (e) {
      console.error('Database init failed (serverless):', e)
    } finally {
      initialized = true
    }
  }
}

export default async function handler(req, res) {
  await ensureInit()
  return app(req, res)
}
