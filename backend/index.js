// backend/index.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { newsRouter } from './newsRouter.js'
import { sentimentRouter } from './sentimentRouter.js'
import { authRouter } from './authRouter.js'
import { initDatabase, getDbMode } from './database.js'
import { isFirebaseAdminReady } from './firebaseAdmin.js'
import { emailRouter } from './emailRouter.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '15mb' }))

app.get('/api/health', (_, res) => {
  const mode = getDbMode()
  res.json({
    ok: true,
    message: 'Server healthy ✅',
    db: { usingPostgres: mode.usingPostgres, localPath: mode.DB_PATH },
    firebaseAdminReady: isFirebaseAdminReady()
  })
})
app.use('/api/news', newsRouter)
app.use('/api/sentiment', sentimentRouter)
app.use('/api/auth', authRouter)
app.use('/api/email', emailRouter)

// Initialize database on server start
initDatabase().catch(err => {
  console.error('❌ Database initialization failed:', err)
  console.log('⚠️  Server will continue but database features may not work')
})

const PORT = Number(process.env.PORT || 5174)
const HOST = process.env.HOST || '0.0.0.0'
app.listen(PORT, HOST, () => {
  console.log(`📰 News backend listening at http://${HOST}:${PORT}`)
})
