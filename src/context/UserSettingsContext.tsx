import React, { createContext, useContext, useState } from 'react'

type Prefs = {
  checkinFrequency: 'daily'|'twice-daily'|'weekly'
  contentTypes: { meditation: boolean; music: boolean; journaling: boolean }
}

type Ctx = {
  prefs: Prefs
  setPrefs: React.Dispatch<React.SetStateAction<Prefs>>
}

const defaultPrefs: Prefs = {
  checkinFrequency: 'daily',
  contentTypes: { meditation: true, music: true, journaling: true }
}

const CtxObj = createContext<Ctx | null>(null)

export function UserSettingsProvider({ children }:{ children: React.ReactNode }){
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs)
  return <CtxObj.Provider value={{ prefs, setPrefs }}>{children}</CtxObj.Provider>
}

export function useSettings(){
  const v = useContext(CtxObj)
  if (!v) throw new Error('UserSettingsContext missing')
  return v
}
