// Simple localStorage-based store for chat transcripts and generated reports
import type { ConversationReport } from './report'

export type ChatMessage = { from: 'user' | 'bot'; text: string; ts: number }

export type ChatSession = {
  id: string
  bot: 'adem' | 'eve'
  title: string
  startedAt: number
  endedAt: number
  messages: ChatMessage[]
  report?: ConversationReport
}

const LS_KEY = 'mindmate_sessions_v1'

export function loadSessions(): ChatSession[]{
  try{
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) return arr
    return []
  }catch{ return [] }
}

export function saveSessions(all: ChatSession[]): void{
  localStorage.setItem(LS_KEY, JSON.stringify(all))
}

export function addOrUpdateSession(session: ChatSession): void{
  const all = loadSessions()
  const idx = all.findIndex(s => s.id === session.id)
  if (idx >= 0) all[idx] = session
  else all.unshift(session)
  saveSessions(all)
}

export function deleteSession(id: string): void{
  const all = loadSessions()
  const next = all.filter(s => s.id !== id)
  saveSessions(next)
}

export function makeSessionId(): string{
  return 's_' + Math.random().toString(36).slice(2, 8) + '_' + Date.now().toString(36)
}

export function summarizeTitle(messages: ChatMessage[]): string{
  const firstUser = messages.find(m => m.from === 'user')
  if (!firstUser) return 'New chat'
  const s = firstUser.text.trim().slice(0, 60)
  return s || 'New chat'
}
