// src/pages/Profile.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loadProfile, SavedProfile } from '../utils/profileUtils'

export default function Profile(): JSX.Element {
  const { user } = useAuth() as { user?: { email?: string; name?: string; username?: string } | null }
  const email = user?.email
  const [profile, setProfile] = useState<SavedProfile | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    async function fetchProfile() {
      try {
        const token = localStorage.getItem('mindmate_user_token')
        if (token) {
          const res = await fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
          if (res.ok) {
            const data = await res.json()
            if (mounted) setProfile(data?.profile || null)
            return
          }
        }
      } catch {}
      const p = loadProfile(email)
      if (mounted && p) setProfile(p)
      else if (mounted) {
        setProfile({
          name: user?.name || '',
          username: (user as any)?.username || '',
          email: user?.email || '',
        })
      }
    }
    fetchProfile()
    return () => { mounted = false }
  }, [email, user])

  return (
    <div className="space-y-6">
      <div className="card flex flex-col md:flex-row items-start gap-6">
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {profile?.image ? (
              <img src={profile.image} alt={profile.name || 'Profile'} className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-400">No photo</div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-start gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{profile?.name || 'Your name'}</h2>
              <div className="text-sm text-slate-500">@{profile?.username || 'username'}</div>
            </div>

            <div className="ml-auto">
              <button
                className="px-3 py-2 rounded-xl border flex items-center gap-2"
                onClick={() => navigate('/profile/edit')}
                aria-label="Edit profile"
                title="Edit profile (settings)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-90">
                  <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 0 1 2.28 17.4l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L3.21 2.28A2 2 0 0 1 6.04.45l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V0a2 2 0 0 1 4 0v.09c.06.6.44 1.1 1 1.51h.06a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.06c.41.56 1 1 1.51 1H24a2 2 0 0 1 0 4h-.09c-.5 0-1.1.44-1.51 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm">Edit</span>
              </button>
            </div>
          </div>

          <p className="mt-3 text-slate-600 dark:text-slate-400">{profile?.bio || 'A short bio will appear here.'}</p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-slate-500">Contact</div>
              <div className="mt-1 text-sm">
                {profile?.email ? <a href={`mailto:${profile.email}`}>📧 {profile.email}</a> : <div className="text-xs text-slate-400">Email not set</div>}
                {profile?.phone ? <div className="mt-1">📞 {profile.phone}</div> : <div className="text-xs text-slate-400">Phone not set</div>}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Parental / Loved ones</div>
              <div className="mt-1 text-sm">
                {profile?.parentalContact && profile.parentalContact.length ? (
                  profile.parentalContact.map((c: { name?: string; email?: string; phone?: string }, i: number) => (
                    <div key={i} className="mb-1">
                      <div className="font-medium">{c.name || 'Contact'}</div>
                      <div className="text-xs text-slate-500">{c.email || c.phone || '-'}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">Not configured</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Instagram</div>
              <div className="mt-1 text-sm">{profile?.instagram ? <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer">@{profile.instagram}</a> : <span className="text-xs text-slate-400">Not set</span>}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Facebook</div>
              <div className="mt-1 text-sm">{profile?.facebook ? <a href={`https://facebook.com/${profile.facebook}`} target="_blank" rel="noreferrer">{profile.facebook}</a> : <span className="text-xs text-slate-400">Not set</span>}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}