// src/pages/EditProfile.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileImageUploader from '../components/ProfileImageUploader'
import { loadProfile, saveProfile, SavedProfile, ParentalContact } from '../utils/profileUtils'

export default function EditProfile(): JSX.Element {
  const { user } = useAuth() as { user?: { email?: string; name?: string; username?: string } | null }
  const email = user?.email
  const navigate = useNavigate()
  const [profile, setProfile] = useState<SavedProfile>({
    name: '',
    username: '',
    bio: '',
    image: '',
    email: email || '',
    phone: '',
    parentalContact: [{ name: '', email: '', phone: '' }, { name: '', email: '', phone: '' }],
    instagram: '',
    facebook: '',
  })
  const [saving, setSaving] = useState(false)
  const serverMode = !!localStorage.getItem('mindmate_user_token')

  useEffect(() => {
    let mounted = true
    async function bootstrap() {
      try {
        const token = localStorage.getItem('mindmate_user_token')
        if (token) {
          const res = await fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
          if (res.ok) {
            const data = await res.json()
            const p = data?.profile as SavedProfile | null
            if (mounted && p) {
              const pc = p.parentalContact || [{ name: '', email: '', phone: '' }, { name: '', email: '', phone: '' }]
              setProfile((prev: SavedProfile) => ({ ...prev, ...p, parentalContact: pc }))
              return
            }
          }
        }
      } catch {}

      const local = loadProfile(email)
      if (mounted && local) {
        const pc = local.parentalContact || [{ name: '', email: '', phone: '' }, { name: '', email: '', phone: '' }]
  setProfile((prev: SavedProfile) => ({ ...prev, ...local, parentalContact: pc }))
      } else if (mounted && user) {
        setProfile((prev: SavedProfile) => ({ ...prev, name: user.name || prev.name, username: (user as any).username || prev.username, email: user.email || prev.email }))
      }
    }
    bootstrap()
    return () => { mounted = false }
  }, [email, user])

  function update<K extends keyof SavedProfile>(k: K, v: SavedProfile[K]) {
    setProfile((p: SavedProfile) => ({ ...p, [k]: v }))
  }

  function updateParental(index: number, field: keyof ParentalContact, value: string) {
    const pc = (profile.parentalContact || []).slice(0, 2)
    pc[index] = { ...(pc[index] || { name: '', email: '', phone: '' }), [field]: value }
    setProfile((p: SavedProfile) => ({ ...p, parentalContact: pc }))
  }

  async function onSave() {
    setSaving(true)
    try {
      const token = localStorage.getItem('mindmate_user_token')
      if (token) {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: profile.name,
            username: profile.username,
            bio: profile.bio,
            image: profile.image,
            phone: profile.phone,
            instagram: profile.instagram,
            facebook: profile.facebook,
            parentalContact: (profile.parentalContact || []).slice(0, 2)
          })
        })
        if (!res.ok) throw new Error('Server save failed')
      } else {
        const ok = saveProfile(email, profile)
        if (!ok) throw new Error('Local save failed')
      }
      ;(window as any).motivateToast?.('Profile saved')
      navigate('/profile')
    } catch (e) {
      const ok = saveProfile(email, profile)
      if (ok) {
        ;(window as any).motivateToast?.('Saved locally (offline)')
        navigate('/profile')
      } else {
        ;(window as any).motivateToast?.('Failed to save profile')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Edit profile</h2>
            <p className="text-sm text-slate-500 mt-1">Update your details. {serverMode ? 'Data is stored on the server and syncs across devices.' : 'Data is stored in your browser.'}</p>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Display name</label>
            <input className="w-full mt-1 rounded-xl border px-3 py-2" value={profile.name || ''} onChange={(e) => update('name', e.target.value)} />

            <label className="block text-sm font-medium mt-3">Username</label>
            <input className="w-full mt-1 rounded-xl border px-3 py-2" value={profile.username || ''} onChange={(e) => update('username', e.target.value)} />

            <label className="block text-sm font-medium mt-3">Bio</label>
            <textarea rows={4} className="w-full mt-1 rounded-xl border px-3 py-2" value={profile.bio || ''} onChange={(e) => update('bio', e.target.value)} />

            <label className="block text-sm font-medium mt-3">Email</label>
            <input className="w-full mt-1 rounded-xl border px-3 py-2" value={profile.email || ''} onChange={(e) => update('email', e.target.value)} />

            <label className="block text-sm font-medium mt-3">Phone</label>
            <input className="w-full mt-1 rounded-xl border px-3 py-2" value={profile.phone || ''} onChange={(e) => update('phone', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium">Profile image</label>
            <ProfileImageUploader initial={profile.image ?? null} onChange={(url) => update('image', url || undefined)} />

            <label className="block text-sm font-medium mt-4">Parental / Loved-one contact 1</label>
            <input placeholder="Name" className="w-full mt-1 rounded-xl border px-3 py-2" value={(profile.parentalContact?.[0]?.name) || ''} onChange={(e) => updateParental(0, 'name', e.target.value)} />
            <input placeholder="Email" className="w-full mt-2 rounded-xl border px-3 py-2" value={(profile.parentalContact?.[0]?.email) || ''} onChange={(e) => updateParental(0, 'email', e.target.value)} />
            <input placeholder="Phone" className="w-full mt-2 rounded-xl border px-3 py-2" value={(profile.parentalContact?.[0]?.phone) || ''} onChange={(e) => updateParental(0, 'phone', e.target.value)} />

            <label className="block text-sm font-medium mt-4">Parental / Loved-one contact 2 (optional)</label>
            <input placeholder="Name" className="w-full mt-1 rounded-xl border px-3 py-2" value={(profile.parentalContact?.[1]?.name) || ''} onChange={(e) => updateParental(1, 'name', e.target.value)} />
            <input placeholder="Email" className="w-full mt-2 rounded-xl border px-3 py-2" value={(profile.parentalContact?.[1]?.email) || ''} onChange={(e) => updateParental(1, 'email', e.target.value)} />
            <input placeholder="Phone" className="w-full mt-2 rounded-xl border px-3 py-2" value={(profile.parentalContact?.[1]?.phone) || ''} onChange={(e) => updateParental(1, 'phone', e.target.value)} />

            <label className="block text-sm font-medium mt-4">Instagram (id only)</label>
            <input className="w-full mt-1 rounded-xl border px-3 py-2" placeholder="e.g., your_handle" value={profile.instagram || ''} onChange={(e) => update('instagram', e.target.value)} />

            <label className="block text-sm font-medium mt-3">Facebook (id only)</label>
            <input className="w-full mt-1 rounded-xl border px-3 py-2" placeholder="e.g., your.profile" value={profile.facebook || ''} onChange={(e) => update('facebook', e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2 rounded-xl bg-forest-600 text-white" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="px-4 py-2 rounded-xl border" onClick={() => navigate('/profile')}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}