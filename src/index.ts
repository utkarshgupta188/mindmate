import express from 'express'
import cors from 'cors'
import { newsRouter } from './newsRouter.js'

const app = express()
app.use(cors())              // if your frontend runs on a different origin
app.use(express.json())

app.get('/api/health', (_, res) => res.json({ ok: true }))
app.use('/api/news', newsRouter)

const PORT = Number(process.env.PORT || 5174)
app.listen(PORT, () => {
  console.log(`News backend listening on http://localhost:${PORT}`)
})
