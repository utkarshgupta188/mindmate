// backend/authRouter.js
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserQueries, LovedOnesQueries, initDatabase } from './database.js'

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

export { router as authRouter }





