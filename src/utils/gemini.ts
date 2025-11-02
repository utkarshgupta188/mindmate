// Minimal Gemini chat client using Google Generative Language REST API
// NOTE: Using this from the browser exposes your API key. For production, proxy this call via your server.

export type ChatMsg = { role: 'user' | 'model'; text: string }

const DEFAULT_MODEL = (import.meta as any).env?.VITE_GEMINI_MODEL || 'gemini-2.5-flash'
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY
// When true, prefer the server-side proxy at /api/gemini even if a client key exists.
const FORCE_PROXY = (import.meta as any).env?.VITE_GEMINI_FORCE_PROXY === 'true'

function toContents(history: ChatMsg[], userText: string){
  const contents: any[] = []
  history.forEach(m => {
    contents.push({ role: m.role, parts: [{ text: m.text }] })
  })
  contents.push({ role: 'user', parts: [{ text: userText }] })
  return contents
}

type SafetySetting = { category: string, threshold: string }
type GenCfg = { temperature?: number; topP?: number; maxOutputTokens?: number; topK?: number; candidateCount?: number }

export async function chatGemini(
  userText: string,
  history: ChatMsg[] = [],
  opts?: { model?: string, system?: string, generationConfig?: GenCfg, safetySettings?: SafetySetting[] }
): Promise<string>{
  const model = opts?.model || DEFAULT_MODEL
  const system = opts?.system || 'You are MindMate, a warm, concise mental wellness companion. Be empathetic and conversational. Avoid diagnoses or medical claims. If the user seems in immediate danger, suggest reaching out to local emergency services or helplines.'
  const safetySettings: SafetySetting[] = opts?.safetySettings || [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  ]
  const body = {
    systemInstruction: { role: 'system', parts: [{ text: system }] },
    contents: toContents(history, userText),
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 512,
      ...(opts?.generationConfig || {})
    },
    safetySettings,
    model
  }

  // If FORCE_PROXY is set, or no client API key is configured, call the server proxy instead.
  if (FORCE_PROXY || !API_KEY) {
    const proxyRes = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!proxyRes.ok) {
      const t = await proxyRes.text().catch(()=> '')
      throw new Error(`Gemini proxy HTTP ${proxyRes.status} ${t}`)
    }
    const pj = await proxyRes.json()
    const text = pj?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof text !== 'string' || !text.trim()) throw new Error('Empty Gemini proxy response')
    return text.trim()
  }

  // Otherwise (API_KEY present and FORCE_PROXY not set), call Google directly (dev only)
  if (API_KEY) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(API_KEY)}`
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      const t = await res.text().catch(()=> '')
      throw new Error(`Gemini HTTP ${res.status} ${t}`)
    }
    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof text !== 'string' || !text.trim()) throw new Error('Empty Gemini response')
    return text.trim()
  }
  // Shouldn't reach here, but throw an explicit error if we do.
  throw new Error('No Gemini configuration available (missing API key and proxy).')
}
