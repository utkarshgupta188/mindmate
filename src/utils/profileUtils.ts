// src/utils/profileUtils.ts
export type ParentalContact = { name?: string; email?: string; phone?: string }
export type SavedProfile = {
  name?: string
  username?: string
  bio?: string
  image?: string
  email?: string
  phone?: string
  parentalContact?: ParentalContact[] // up to 2 entries
  instagram?: string
  facebook?: string
}

export function storageKey(email?: string) {
  return email ? `profile:${email}` : 'profile:anon'
}

export function loadProfile(email?: string): SavedProfile | null {
  try {
    const raw = localStorage.getItem(storageKey(email))
    if (!raw) return null
    return JSON.parse(raw) as SavedProfile
  } catch (err) {
    console.warn('loadProfile failed', err)
    return null
  }
}

export function saveProfile(email: string | undefined, profile: SavedProfile): boolean {
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(profile))
    return true
  } catch (err) {
    console.warn('saveProfile failed', err)
    return false
  }
}