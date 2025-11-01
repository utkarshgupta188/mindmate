# Database Authentication Setup

## Overview

The app now supports **database-backed email/password authentication** using PostgreSQL (Neon) with:

- ✅ Password hashing (bcrypt)
- ✅ JWT token-based authentication
- ✅ Secure user storage in database
- ✅ Loved ones data persistence
- ✅ Fallback to local storage if database unavailable (when `VITE_ALLOW_DEMO_AUTH=true`)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Loved Ones Table
```sql
CREATE TABLE loved_ones (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  whatsapp VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

Make sure these are set in your `.env.local` and Vercel:

```env
NEON_DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
AUTH_JWT_SECRET=your-secret-jwt-key-here
VITE_ALLOW_DEMO_AUTH=false  # Set to true to allow local storage fallback
```

## API Endpoints

### POST `/api/auth/signup`
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "lovedOnes": [
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "whatsapp": "+1234567890"
    }
  ]
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "lovedOnes": [...]
  },
  "token": "jwt-token-here"
}
```

### POST `/api/auth/login`
Login with email/password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "lovedOnes": [...]
  },
  "token": "jwt-token-here"
}
```

### GET `/api/auth/me`
Get current user (requires JWT token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "lovedOnes": [...]
  }
}
```

### PUT `/api/auth/loved-ones`
Update user's loved ones (requires JWT token).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "lovedOnes": [
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "whatsapp": "+1234567890"
    }
  ]
}
```

## Authentication Flow

1. **Signup/Login** → Backend validates → Returns JWT token
2. **Token stored** → Frontend stores token in localStorage
3. **Subsequent requests** → Include token in `Authorization: Bearer <token>` header
4. **Token verification** → Backend verifies JWT and returns user data

## Fallback Mode

If `VITE_ALLOW_DEMO_AUTH=true`, the app will fall back to local storage if the database is unavailable. This is useful for:
- Development/testing
- Offline mode
- When database credentials are not set

## Security Features

- ✅ Passwords are hashed with bcrypt (10 salt rounds)
- ✅ JWT tokens expire after 7 days
- ✅ Email uniqueness enforced at database level
- ✅ CORS enabled for API endpoints
- ✅ SQL injection protection (parameterized queries)





