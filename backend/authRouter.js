// backend/authRouter.js
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserQueries, LovedOnesQueries, ProfileQueries, initDatabase, pool } from './database.js'
import { verifyFirebaseIdToken, isFirebaseAdminReady } from './firebaseAdmin.js'

const router = express.Router()

// Initialize database on first request
let dbInitialized = false
async function ensureDbInitialized() {
  if (!dbInitialized) {
    try {
      await initDatabase()
      dbInitialized = true
    } catch (error) {
      console.error('Database initialization failed:', error)
    }
  }
}

const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'your-secret-key-change-in-production'

// Generate JWT token
function generateToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Exchange Firebase ID token (Google/GitHub login) for backend JWT
 * POST /api/auth/firebase
 * Body: { idToken }
 */
router.post('/firebase', async (req, res) => {
  try {
    await ensureDbInitialized()

    if (!isFirebaseAdminReady()) {
      return res.status(501).json({ error: 'Firebase verification not configured on server' })
    }

    const { idToken } = req.body || {}
    if (!idToken) return res.status(400).json({ error: 'idToken is required' })

    let decoded
    try {
      decoded = await verifyFirebaseIdToken(idToken)
    } catch (e) {
      return res.status(401).json({ error: 'Invalid Firebase token' })
    }

    const email = (decoded.email || '').toLowerCase()
    const name = decoded.name || decoded.email?.split('@')[0] || 'User'
    if (!email) return res.status(400).json({ error: 'Firebase token missing email' })

    // Ensure user exists
    let user = await UserQueries.findByEmail(email)
    if (!user) {
      // create with a random password hash (not used)
      const randomPass = await bcrypt.hash('firebase:' + decoded.uid, 10)
      user = await UserQueries.create(email, randomPass, name)
    } else if (name && user.name !== name) {
      // keep display name in sync with Firebase profile
      try { await UserQueries.updateName(user.id, name) } catch {}
      // refresh user object minimally
      user = { ...user, name }
    }

    const token = generateToken(user.id, user.email)
    const lovedOnes = await LovedOnesQueries.findByUserId(user.id)
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lovedOnes: (lovedOnes || []).map(lo => ({ name: lo.name, email: lo.email, whatsapp: lo.whatsapp }))
      },
      token
    })
  } catch (error) {
    console.error('Firebase exchange error:', error)
    res.status(500).json({ error: 'Failed to exchange Firebase token' })
  }
})

/**
 * Register new user
 * POST /api/auth/signup
 * Body: { email, password, name, lovedOnes?: [] }
 */
router.post('/signup', async (req, res) => {
  try {
    await ensureDbInitialized()

    let { email, password, name, lovedOnes = [] } = req.body
    email = (email || '').trim().toLowerCase()
    password = (password || '').trim()
    name = (name || '').trim()

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Check if user already exists
  const existingUser = await UserQueries.findByEmail(email)
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' })
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' })
    }

    // Hash password
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
  const user = await UserQueries.create(email, passwordHash, name)

    // Save loved ones if provided
    if (lovedOnes && lovedOnes.length > 0) {
      await LovedOnesQueries.create(user.id, lovedOnes)
    }

    // Generate token
    const token = generateToken(user.id, user.email)

    // Fetch loved ones for response
    const savedLovedOnes = await LovedOnesQueries.findByUserId(user.id)

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lovedOnes: savedLovedOnes.map(lo => ({
          name: lo.name,
          email: lo.email,
          whatsapp: lo.whatsapp
        }))
      },
      token
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Registration failed. Please try again.' })
  }
})

/**
 * Login user
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    await ensureDbInitialized()

    let { email, password } = req.body
    email = (email || '').trim().toLowerCase()
    password = (password || '').trim()

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user
  const user = await UserQueries.findByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate token
    const token = generateToken(user.id, user.email)

    // Fetch loved ones
    const lovedOnes = await LovedOnesQueries.findByUserId(user.id)

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lovedOnes: lovedOnes.map(lo => ({
          name: lo.name,
          email: lo.email,
          whatsapp: lo.whatsapp
        }))
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed. Please try again.' })
  }
})

/**
 * Verify token and get user
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 */
router.get('/me', async (req, res) => {
  try {
    await ensureDbInitialized()

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Get user from database
    const user = await UserQueries.findById(decoded.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Fetch loved ones
    const lovedOnes = await LovedOnesQueries.findByUserId(user.id)

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lovedOnes: lovedOnes.map(lo => ({
          name: lo.name,
          email: lo.email,
          whatsapp: lo.whatsapp
        }))
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

/**
 * Update user's loved ones
 * PUT /api/auth/loved-ones
 * Headers: Authorization: Bearer <token>
 * Body: { lovedOnes: [] }
 */
router.put('/loved-ones', async (req, res) => {
  try {
    await ensureDbInitialized()

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const { lovedOnes } = req.body

    // Update loved ones
    await LovedOnesQueries.create(decoded.userId, lovedOnes || [])

    // Fetch updated loved ones
    const updatedLovedOnes = await LovedOnesQueries.findByUserId(decoded.userId)

    res.json({
      lovedOnes: updatedLovedOnes.map(lo => ({
        name: lo.name,
        email: lo.email,
        whatsapp: lo.whatsapp
      }))
    })
  } catch (error) {
    console.error('Update loved ones error:', error)
    res.status(500).json({ error: 'Failed to update loved ones' })
  }
})

/**
 * Get current user's profile
 * GET /api/auth/profile
 * Headers: Authorization: Bearer <token>
 */
router.get('/profile', async (req, res) => {
  try {
    await ensureDbInitialized()

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const user = await UserQueries.findById(decoded.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const profile = await ProfileQueries.findByUserId(decoded.userId)
    const lovedOnes = await LovedOnesQueries.findByUserId(decoded.userId)

    res.json({
      profile: {
        name: user.name,
        email: user.email,
        username: profile?.username || '',
        bio: profile?.bio || '',
        image: profile?.image || '',
        phone: profile?.phone || '',
        instagram: profile?.instagram || '',
        facebook: profile?.facebook || '',
        parentalContact: (lovedOnes || []).map(lo => ({ name: lo.name, email: lo.email, phone: lo.whatsapp }))
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
})

/**
 * Update current user's profile
 * PUT /api/auth/profile
 * Headers: Authorization: Bearer <token>
 * Body: { name?, username?, bio?, image?, phone?, instagram?, facebook?, parentalContact?: [] }
 */
router.put('/profile', async (req, res) => {
  try {
    await ensureDbInitialized()

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const user = await UserQueries.findById(decoded.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const { name, username, bio, image, phone, instagram, facebook, parentalContact } = req.body || {}

    // Optionally update user's name if provided
    if (name && typeof name === 'string') {
      try {
        // Minimal update using existing query interface; add an updater if needed
        // For file store, mutate local object via create/updatePassword pattern is not present; skip for now.
        if (typeof decoded.userId === 'number' && process.env.NEON_DATABASE_URL) {
          await pool.query('UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [name, decoded.userId])
        } else {
          // no-op for local store name change handled via profile fields response
        }
      } catch (e) {
        // non-fatal
      }
    }

    // Upsert profile
    await ProfileQueries.upsert(decoded.userId, { username, bio, image, phone, instagram, facebook })

    // Update loved ones as parental contacts
    if (Array.isArray(parentalContact)) {
      const mapped = (parentalContact || []).slice(0, 2).map(c => ({ name: c.name || '', email: c.email || '', whatsapp: c.phone || '' }))
      await LovedOnesQueries.create(decoded.userId, mapped)
    }

    // Return updated profile
    const profile = await ProfileQueries.findByUserId(decoded.userId)
    const lovedOnes = await LovedOnesQueries.findByUserId(decoded.userId)
    res.json({
      profile: {
        name: name || user.name,
        email: user.email,
        username: profile?.username || '',
        bio: profile?.bio || '',
        image: profile?.image || '',
        phone: profile?.phone || '',
        instagram: profile?.instagram || '',
        facebook: profile?.facebook || '',
        parentalContact: (lovedOnes || []).map(lo => ({ name: lo.name, email: lo.email, phone: lo.whatsapp }))
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

export { router as authRouter }





