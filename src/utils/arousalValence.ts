// Heuristic arousal–valence classifier inspired by the Arousal–Valence model
// Source concept: https://neurodivergentinsights.com/arousal-valence-model/
// We already infer valence via analyzeSentiment; this helper focuses on arousal.

export type ArousalLevel = 'low' | 'medium' | 'high'

// Keyword sets (not exhaustive; safe, non-clinical cues)
const HIGH_AROUSAL = [
  'panic','panicking','anxious','anxiety','angry','furious','rage','overwhelmed','can\'t','cant','shaking','heart racing','so mad','freaking out','stressed','stress','urgent','now','right now','help me','hyper','yelled','screamed','crying','!!!'
]
const LOW_AROUSAL = [
  'tired','exhausted','drained','numb','empty','low energy','sleepy','bored','meh','flat','slow','don\'t care','dont care','can\'t get up','no energy','zzz','...'
]

export function estimateArousal(text: string): ArousalLevel {
  const t = text.toLowerCase()
  // punctuation and casing signals
  const exclaims = (t.match(/!+/g) || []).join('').length
  const repeats = /(.)\1{2,}/.test(t) ? 1 : 0
  const allCaps = t === t.toUpperCase() && /[A-Z]/.test(text) ? 1 : 0

  let score = 0
  for (const k of HIGH_AROUSAL) { if (t.includes(k)) score += 2 }
  for (const k of LOW_AROUSAL) { if (t.includes(k)) score -= 2 }
  score += Math.min(3, exclaims > 5 ? 3 : exclaims > 2 ? 2 : exclaims > 0 ? 1 : 0)
  score += repeats
  score += allCaps

  // Normalize to band
  if (score >= 3) return 'high'
  if (score <= -1) return 'low'
  return 'medium'
}

export function quadrant(valence: 'negative'|'neutral'|'positive', arousal: ArousalLevel): 'soothing'|'activated-positive'|'activated-negative'|'low-negative'|'neutral' {
  if (valence === 'neutral') return 'neutral'
  if (valence === 'positive') return arousal === 'high' ? 'activated-positive' : 'soothing'
  // negative
  return arousal === 'high' ? 'activated-negative' : 'low-negative'
}
