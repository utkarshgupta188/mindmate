// Vercel serverless API entry: wraps our Express routers
import express from 'express'
import cors from 'cors'
import { newsRouter } from '../backend/newsRouter.js'
import { sentimentRouter } from '../backend/sentimentRouter.js'
import { authRouter } from '../backend/authRouter.js'
import { emailRouter } from '../backend/emailRouter.js'
import { initDatabase, getDbMode } from '../backend/database.js'

// Create a single Express app to handle all /api/* routes
const app = express()
app.use(cors())
app.use(express.json({ limit: '15mb' }))

app.get('/api/health', (_, res) => {
  const mode = getDbMode()
  res.json({ ok: true, message: 'Serverless API healthy ✅', db: { usingPostgres: mode.usingPostgres, localPath: mode.DB_PATH } })
})
app.use('/api/news', newsRouter)
app.use('/api/sentiment', sentimentRouter)
app.use('/api/auth', authRouter)
app.use('/api/email', emailRouter)

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
