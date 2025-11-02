export type HFEmotionScore = { label: string; score: number }
export type HFEmotionResult = { label?: string; scores: HFEmotionScore[] }

// Call the server proxy to HF Inference API (requires backend running with HF_API_TOKEN)
export async function analyzeTextEmotion(text: string, model = 'chrlukas/stories-emotion-c2'): Promise<HFEmotionResult> {
  try{
    const res = await fetch('/api/text-emotion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, model }) })
    if (!res.ok) {
      const t = await res.text().catch(()=> '')
      throw new Error(`emotion HTTP ${res.status} ${t}`)
    }
    const j = await res.json()
    const scores: HFEmotionScore[] = Array.isArray(j?.scores) ? j.scores : []
    const label = typeof j?.label === 'string' ? j.label : scores.sort((a,b)=>b.score-a.score)[0]?.label
    return { label, scores }
  } catch {
    return { label: undefined, scores: [] }
  }
}

// Basic mapping from common emotion labels to coarse valence/arousal buckets
export function mapEmotionToVA(label?: string): { valence: 'positive'|'neutral'|'negative', arousal: 'low'|'medium'|'high' }{
  const l = (label||'').toLowerCase()
  const positive = ['joy','happy','happiness','trust','love','contentment']
  const neutral = ['neutral','calm']
  const highArousalNeg = ['anger','angry','fear','anxiety','panic','disgust']
  if (positive.includes(l)) return { valence:'positive', arousal:'medium' }
  if (neutral.includes(l)) return { valence:'neutral', arousal:'low' }
  if (highArousalNeg.includes(l)) return { valence:'negative', arousal:'high' }
  // default to negative/medium
  return { valence:'negative', arousal:'medium' }
}
