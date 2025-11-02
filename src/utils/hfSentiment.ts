// Hugging Face Space sentiment client (Gradio-compatible)
// Falls back to local heuristic if the API is unreachable.
import { sentimentScore } from './sentiment'

export type SentimentLabel = 'negative' | 'neutral' | 'positive'

export type SentimentScores = {
  negative: number
  neutral: number
  positive: number
}

type HFResponse = {
  data?: any[]
  [k: string]: any
}

const DEFAULT_SPACE = 'https://unknownhackerr-mental-health-beta16.hf.space'

function argmax(scores: SentimentScores): { label: SentimentLabel; confidence: number } {
  let label: SentimentLabel = 'neutral'
  let confidence = scores.neutral
  if (scores.negative >= scores.neutral && scores.negative >= scores.positive) {
    label = 'negative'; confidence = scores.negative
  } else if (scores.positive >= scores.neutral && scores.positive >= scores.negative) {
    label = 'positive'; confidence = scores.positive
  }
  return { label, confidence }
}

function normalizeItem(item: any): { label: string | null; scores: SentimentScores | null } {
  if (item && typeof item === 'object') {
    const label = item.label != null ? String(item.label) : null
    const s = item.scores
    if (s && typeof s === 'object') {
      return {
        label,
        scores: {
          negative: Number(s.negative ?? 0),
          neutral: Number(s.neutral ?? 0),
          positive: Number(s.positive ?? 0),
        },
      }
    }
    return { label, scores: null }
  }
  if (typeof item === 'string') return { label: item, scores: null }
  return { label: null, scores: null }
}

function extractModelsAndFinal(raw: any): { models: Array<{ label: string | null; scores: SentimentScores | null }>; final: { label: string | null } | null } {
  const models: Array<{ label: string | null; scores: SentimentScores | null }> = []
  let final: { label: string | null } | null = null
  if (Array.isArray(raw)) {
    raw.forEach((item, i) => {
      const norm = normalizeItem(item)
      if (norm.scores == null && i === raw.length - 1 && norm.label != null) {
        final = { label: norm.label }
      } else {
        models.push(norm)
      }
    })
  } else if (raw && typeof raw === 'object') {
    const norm = normalizeItem(raw)
    if (norm.scores == null) final = { label: norm.label }
    else models.push(norm)
  } else {
    final = { label: String(raw) }
  }
  return { models, final }
}

function ensembleAverage(models: Array<{ scores: SentimentScores | null }>): SentimentScores | null {
  const scored = models.filter(m => m.scores)
  if (scored.length === 0) return null
  const sums = { negative: 0, neutral: 0, positive: 0 }
  for (const m of scored) {
    const s = m.scores as SentimentScores
    sums.negative += s.negative
    sums.neutral += s.neutral
    sums.positive += s.positive
  }
  return {
    negative: sums.negative / scored.length,
    neutral: sums.neutral / scored.length,
    positive: sums.positive / scored.length,
  }
}

function localFallback(text: string): { label: SentimentLabel; confidence: number; scores: SentimentScores; via: 'local' } {
  const s = sentimentScore(text)
  const abs = Math.min(3, Math.max(0, Math.abs(s.score)))
  // Map heuristic score [-3..3] -> confidence (allow strong language to reach high tier)
  const conf = abs >= 3 ? 0.92 : abs >= 2 ? 0.78 : abs >= 1 ? 0.62 : 0.5
  const scores: SentimentScores = s.label === 'positive'
    ? { positive: conf, neutral: 1 - conf, negative: 0.1 }
    : s.label === 'negative'
    ? { negative: conf, neutral: 1 - conf, positive: 0.1 }
    : { neutral: conf, positive: 0.5 * (1 - conf), negative: 0.5 * (1 - conf) }
  return { label: s.label, confidence: conf, scores, via: 'local' }
}

export async function analyzeSentiment(text: string): Promise<{ label: SentimentLabel; confidence: number; scores?: SentimentScores; via: 'hf' | 'local' }> {
  const base = (import.meta as any).env?.VITE_HF_SPACE_URL || DEFAULT_SPACE
  const token = (import.meta as any).env?.VITE_HF_TOKEN
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const payload = { data: [text] }
  const endpoints = [`${base}/api/predict`, `${base}/run/predict`, `${base}/predict`]
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: HFResponse = await res.json()
      const raw = Array.isArray(json?.data) ? json.data[0] : json
      const { models, final } = extractModelsAndFinal(raw)
      const avg = ensembleAverage(models)
      if (avg) {
        const { label, confidence } = argmax(avg)
        return { label, confidence, scores: avg, via: 'hf' }
      }
      if (final?.label) {
        const label = final.label.toLowerCase() as SentimentLabel
        // No scores provided — assign a conservative confidence
        const confidence = 0.6
        return { label, confidence, via: 'hf' }
      }
    } catch {
      continue
    }
  }
  return localFallback(text)
}
