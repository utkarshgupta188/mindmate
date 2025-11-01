// backend/database.js
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
const { Pool } = pg

const NEON_URL = process.env.NEON_DATABASE_URL || ''

// If NEON_DATABASE_URL is provided, use Postgres (Neon). Otherwise fall back to a local JSON file store.
let usingPostgres = Boolean(NEON_URL)

// File-backed store path (safe for Windows)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'localdb.json')

// Simple in-memory cache for file-backed DB
let localStore = {
  users: [], // { id, email, password_hash, name, created_at }
  loved_ones: [] // { id, user_id, name, email, whatsapp, created_at }
}

let pool = null

export async function initDatabase() {
  if (usingPostgres) {
    pool = new Pool({
      connectionString: NEON_URL,
      ssl: { rejectUnauthorized: false }
    })

    pool.on('connect', () => console.log('✅ Connected to Neon database'))
    pool.on('error', (err) => console.error('❌ Database connection error:', err))

    // create tables if necessary
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS loved_ones (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        whatsapp VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_loved_ones_user_id ON loved_ones(user_id)`)

    console.log('✅ Database tables initialized (Postgres)')
    return
  }

  // ensure local file exists and load it
  try {
    const data = await fs.readFile(DB_PATH, 'utf8')
    localStore = JSON.parse(data)
    console.log('✅ Loaded local DB from', DB_PATH)
  } catch (err) {
    // file may not exist yet; create it
    localStore = { users: [], loved_ones: [] }
    await fs.writeFile(DB_PATH, JSON.stringify(localStore, null, 2), 'utf8')
    console.log('✅ Created new local DB at', DB_PATH)
  }
}

async function persistLocal() {
  await fs.writeFile(DB_PATH, JSON.stringify(localStore, null, 2), 'utf8')
}

// User queries (works for both Postgres and local file fallback)
export const UserQueries = {
  async findByEmail(email) {
    if (usingPostgres) {
      const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email])
      return result.rows[0] || null
    }
    const target = (email || '').toLowerCase()
    return localStore.users.find(u => (u.email || '').toLowerCase() === target) || null
  },

  async findById(id) {
    if (usingPostgres) {
      const result = await pool.query('SELECT id, email, name, created_at FROM users WHERE id = $1', [id])
      return result.rows[0] || null
    }
    const u = localStore.users.find(x => Number(x.id) === Number(id))
    if (!u) return null
    return { id: u.id, email: u.email, name: u.name, created_at: u.created_at }
  },

  async create(email, passwordHash, name) {
    if (usingPostgres) {
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
        [email, passwordHash, name]
      )
      return result.rows[0]
    }

    const id = (localStore.users.reduce((max, u) => Math.max(max, Number(u.id || 0)), 0) || 0) + 1
    const created_at = new Date().toISOString()
    const user = { id, email, password_hash: passwordHash, name, created_at }
    localStore.users.push(user)
    await persistLocal()
    return { id, email, name, created_at }
  },

  async updatePassword(userId, passwordHash) {
    if (usingPostgres) {
      await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, userId])
      return
    }
    const u = localStore.users.find(x => Number(x.id) === Number(userId))
    if (u) {
      u.password_hash = passwordHash
      await persistLocal()
    }
  }
}

// Loved ones queries
export const LovedOnesQueries = {
  async findByUserId(userId) {
    if (usingPostgres) {
      const result = await pool.query('SELECT id, name, email, whatsapp FROM loved_ones WHERE user_id = $1 ORDER BY created_at', [userId])
      return result.rows
    }
    return localStore.loved_ones.filter(x => Number(x.user_id) === Number(userId))
  },

  async create(userId, lovedOnes) {
    if (usingPostgres) {
      await pool.query('DELETE FROM loved_ones WHERE user_id = $1', [userId])
      for (const loved of lovedOnes) {
        if (loved.name || loved.email || loved.whatsapp) {
          await pool.query('INSERT INTO loved_ones (user_id, name, email, whatsapp) VALUES ($1, $2, $3, $4)', [userId, loved.name || '', loved.email || '', loved.whatsapp || ''])
        }
      }
      return
    }

    // remove existing loved ones for user
    localStore.loved_ones = localStore.loved_ones.filter(x => Number(x.user_id) !== Number(userId))
    const now = new Date().toISOString()
    let nextId = (localStore.loved_ones.reduce((max, r) => Math.max(max, Number(r.id || 0)), 0) || 0) + 1
    for (const loved of lovedOnes || []) {
      if (loved.name || loved.email || loved.whatsapp) {
        localStore.loved_ones.push({ id: nextId++, user_id: userId, name: loved.name || '', email: loved.email || '', whatsapp: loved.whatsapp || '', created_at: now })
      }
    }
    await persistLocal()
  },

  async deleteByUserId(userId) {
    if (usingPostgres) {
      await pool.query('DELETE FROM loved_ones WHERE user_id = $1', [userId])
      return
    }
    localStore.loved_ones = localStore.loved_ones.filter(x => Number(x.user_id) !== Number(userId))
    await persistLocal()
  }
}

export { pool }
export default pool





