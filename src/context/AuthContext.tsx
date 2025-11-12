import React, { createContext, useContext, useEffect, useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider, githubProvider } from '../config/firebase'

type LovedOne = { name: string; whatsapp: string }
type User = { email: string; name: string; lovedOnes: LovedOne[]; provider?: 'password' | 'google' | 'github' }

type Ctx = {
  user: User | null
  signup: (email:string, password:string, name:string)=>Promise<void>
  login: (email:string, password:string)=>Promise<void>
  loginWithGoogle: ()=>Promise<void>
  loginWithGithub: ()=>Promise<void>
  logout: ()=>void
  updateLovedOnes: (lovedOnes: LovedOne[])=>void
}

const AuthCtx = createContext<Ctx | null>(null)

const LS_KEY = 'mindmate_user'
const TOKEN_KEY = 'mindmate_user_token'

export function AuthProvider({ children }:{ children: React.ReactNode }){
  const [user, setUser] = useState<User | null>(null)

  // On mount: if token exists, verify with backend and load user
  useEffect(() => {
    async function bootstrap(){
      const token = localStorage.getItem(TOKEN_KEY)
      if (token){
        try {
          const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          if (res.ok){
            const data = await res.json()
            setUser(data.user)
            localStorage.setItem(LS_KEY, JSON.stringify(data.user))
            return
          } else {
            localStorage.removeItem(TOKEN_KEY)
          }
        } catch {
          // network error: fall back to local user if present
        }
      }
      const raw = localStorage.getItem(LS_KEY)
      if (raw) setUser(JSON.parse(raw))
    }
    bootstrap()
  }, [])

  useEffect(() => {
    if (user) localStorage.setItem(LS_KEY, JSON.stringify(user))
  }, [user])

  async function signup(email:string, password:string, name:string){
    // Prefer backend signup; fall back to local storage if it fails
    try {
      const lovedOnes: LovedOne[] = []
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, lovedOnes })
      })
      if (!res.ok){
        const err = await res.json().catch(()=>({ error: 'Signup failed' }))
        throw new Error(err.error || 'Signup failed')
      }
      const data = await res.json()
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(LS_KEY, JSON.stringify(data.user))
      setUser(data.user)
    } catch {
      const newUser: User = { email, name, lovedOnes: [] }
      setUser(newUser)
      localStorage.setItem(LS_KEY, JSON.stringify(newUser))
    }
  }

  async function login(email:string, password:string){
    // Real login via backend
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok){
      const err = await res.json().catch(()=>({ error: 'Login failed' }))
      throw new Error(err.error || 'Invalid email or password')
    }
    const data = await res.json()
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(LS_KEY, JSON.stringify(data.user))
    setUser(data.user)
  }

  const allowDemoAuth = import.meta.env.VITE_ALLOW_DEMO_AUTH === 'true'

  async function loginWithGoogle(){
    if (allowDemoAuth){
      const u: User = { email: 'demo-google@local', name: 'Google User', lovedOnes: [], provider: 'google' }
      setUser(u)
      localStorage.setItem(LS_KEY, JSON.stringify(u))
      return
    }
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      const firebaseUser = cred.user
      const u: User = {
        email: firebaseUser.email || 'unknown-google-user',
        name: firebaseUser.displayName || 'Google User',
        lovedOnes: [],
        provider: 'google'
      }
      // Note: backend doesn't yet accept Firebase ID tokens, so we only persist local profile.
      setUser(u)
      localStorage.setItem(LS_KEY, JSON.stringify(u))
    } catch (e){
      if (allowDemoAuth){
        // fallback to demo if sign-in fails
        const u: User = { email: 'demo-google@local', name: 'Google User', lovedOnes: [], provider: 'google' }
        setUser(u)
        localStorage.setItem(LS_KEY, JSON.stringify(u))
      } else {
        throw e
      }
    }
  }

  async function loginWithGithub(){
    if (allowDemoAuth){
      const u: User = { email: 'demo-github@local', name: 'GitHub User', lovedOnes: [], provider: 'github' }
      setUser(u)
      localStorage.setItem(LS_KEY, JSON.stringify(u))
      return
    }
    try {
      const cred = await signInWithPopup(auth, githubProvider)
      const firebaseUser = cred.user
      const u: User = {
        email: firebaseUser.email || 'unknown-github-user',
        name: firebaseUser.displayName || (firebaseUser.email?.split('@')[0] ?? 'GitHub User'),
        lovedOnes: [],
        provider: 'github'
      }
      setUser(u)
      localStorage.setItem(LS_KEY, JSON.stringify(u))
    } catch (e){
      if (allowDemoAuth){
        const u: User = { email: 'demo-github@local', name: 'GitHub User', lovedOnes: [], provider: 'github' }
        setUser(u)
        localStorage.setItem(LS_KEY, JSON.stringify(u))
      } else {
        throw e
      }
    }
  }

  function logout(){ setUser(null); localStorage.removeItem(LS_KEY); localStorage.removeItem(TOKEN_KEY) }

  async function updateLovedOnes(lovedOnes: LovedOne[]){
    if (!user) return
    const token = localStorage.getItem(TOKEN_KEY)
    if (token){
      try {
        const res = await fetch('/api/auth/loved-ones', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ lovedOnes })
        })
        if (res.ok){
          const data = await res.json()
          setUser({ ...user, lovedOnes: data.lovedOnes })
          localStorage.setItem(LS_KEY, JSON.stringify({ ...user, lovedOnes: data.lovedOnes }))
          return
        }
      } catch {
        // fall through to local update
      }
    }
    setUser({ ...user, lovedOnes })
    localStorage.setItem(LS_KEY, JSON.stringify({ ...user, lovedOnes }))
  }

  return <AuthCtx.Provider value={{ user, signup, login, loginWithGoogle, loginWithGithub, logout, updateLovedOnes }}>{children}</AuthCtx.Provider>
}

export function useAuth(){
  const v = useContext(AuthCtx)
  if (!v) throw new Error('AuthContext missing')
  return v
}
