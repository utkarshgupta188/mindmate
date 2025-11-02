import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ProfileImageUploader from '../components/ProfileImageUploader'

type SavedProfile = { name?: string; bio?: string; image?: string }

function storageKey(email?: string){
  return email ? `profile:${email}` : 'profile:anon'
}

export default function Profile(){
  const { user } = useAuth()
  const key = storageKey(user?.email || undefined)
  const [profile, setProfile] = useState<SavedProfile>({})

  useEffect(()=>{
    try {
      const raw = localStorage.getItem(key)
      if (raw) setProfile(JSON.parse(raw))
    } catch {}
  }, [key])

  function save(){
    try {
      localStorage.setItem(key, JSON.stringify(profile))
      ;(window as any).motivateToast?.('Profile saved')
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold">Your profile</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Update your display name, a short bio, and profile image (optional).</p>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Display name</label>
            <input
              aria-label="display name"
              title="display name"
              placeholder="Your name"
              className="w-full mt-1 rounded-xl border px-3 py-2 bg-white text-slate-900 placeholder-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-500/40"
              value={profile.name||user?.name||''}
              onChange={(e)=>setProfile(p=>({...p, name: e.target.value}))}
            />

            <label className="block text-sm font-medium mt-3">Bio</label>
            <textarea
              aria-label="bio"
              title="bio"
              placeholder="A short bio (optional)"
              className="w-full mt-1 rounded-xl border px-3 py-2 bg-white text-slate-900 placeholder-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-500/40"
              rows={4}
              value={profile.bio||''}
              onChange={(e)=>setProfile(p=>({...p, bio: e.target.value}))}
            />

            <div className="mt-4 flex items-center gap-2">
              <button onClick={save} className="px-4 py-2 rounded-xl bg-forest-600 text-white">Save profile</button>
              <button onClick={()=>{ setProfile({}); localStorage.removeItem(key) }} className="px-4 py-2 rounded-xl border">Reset</button>
            </div>
          </div>

          <div>
            <ProfileImageUploader initial={profile.image||null} onChange={(url: string | null)=>setProfile(p=>({...p, image: url||undefined}))} />
            {profile.image && <p className="text-xs text-slate-500 mt-2">Uploaded image is stored in your browser only.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
