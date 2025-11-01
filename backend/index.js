// backend/index.js
import express from 'express'
import cors from 'cors'
import { newsRouter } from './newsRouter.js'
import { sentimentRouter } from './sentimentRouter.js'
import { authRouter } from './authRouter.js'
import { initDatabase } from './database.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_, res) => res.json({ ok: true, message: 'Server healthy ✅' }))
app.use('/api/news', newsRouter)
app.use('/api/sentiment', sentimentRouter)
app.use('/api/auth', authRouter)

// Initialize database on server start
initDatabase().catch(err => {
  console.error('❌ Database initialization failed:', err)
  console.log('⚠️  Server will continue but database features may not work')
})

const PORT = Number(process.env.PORT || 5174)
app.listen(PORT, () => {
  console.log(`📰 News backend listening at http://localhost:${PORT}`)
})
