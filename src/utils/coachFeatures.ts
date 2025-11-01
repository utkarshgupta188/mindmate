import { isCrisis } from './crisis'
import type { SentimentLabel, SentimentScores } from './hfSentiment'

export type Intent =
  | 'greeting'
  | 'checkin'
  | 'vent'
  | 'anxiety'
  | 'low_mood'
  | 'sleep'
  | 'motivation'
  | 'gratitude'
  | 'anger'
  | 'unknown'

export type Risk = 'none' | 'low' | 'medium' | 'high'

export type Features = {
  label: SentimentLabel
  confidence: number
  scores?: SentimentScores
  lenBucket: 'short'|'medium'|'long'
  repetitiveness: number // 0..1 similarity to last message
  timeBucket: 'morning'|'afternoon'|'evening'|'night'
  crisis: boolean
  keywords: Record<Intent, number>
  intentGuess: Intent
  risk: Risk
}

const KEYWORDS: Record<Exclude<Intent,'unknown'|'greeting'|'checkin'>, RegExp[]> = {
  vent: /(overwhelmed|too much|can'?t handle|burn ?out|exhausted|drained)/i.source as any,
  anxiety: /(anxiety|anxious|panic|worried|worry|fear|scared|nervous)/i.source as any,
  low_mood: /(sad|down|depress|hopeless|worthless|tired of|empty|numb)/i.source as any,
  sleep: /(sleep|insomnia|awake|can'?t\s?sleep|restless|nightmare)/i.source as any,
  motivation: /(motivation|motivated|procrastinat|focus|productive|stuck)/i.source as any,
  gratitude: /(grateful|gratitude|thankful|appreciate|blessed)/i.source as any,
  anger: /(angry|mad|furious|irritated|pissed|rage|annoyed)/i.source as any,
} as unknown as Record<string, RegExp[]>

// Build regex objects at runtime (above trick keeps TS concise)
for (const k of Object.keys(KEYWORDS)){
  const pattern = (KEYWORDS as any)[k] as string
  ;(KEYWORDS as any)[k] = [new RegExp(pattern, 'i')]
}

function tokenize(s: string){
  return s.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(Boolean)
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a)
  const B = new Set(b)
  const inter = new Set([...A].filter(x => B.has(x))).size
  const uni = new Set([...A, ...B]).size
  return uni ? inter/uni : 0
}

export function buildFeatures(input: {
  text: string
  label: SentimentLabel
  confidence: number
  scores?: SentimentScores
  lastUserText?: string
  now?: Date
}): Features {
  const { text, label, confidence, scores, lastUserText } = input
  const tokens = tokenize(text)
  const lenBucket: Features['lenBucket'] = tokens.length < 6 ? 'short' : tokens.length < 20 ? 'medium' : 'long'
  const repetitiveness = lastUserText ? jaccard(tokens, tokenize(lastUserText)) : 0
  const hour = (input.now ?? new Date()).getHours()
  const timeBucket: Features['timeBucket'] = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 22 ? 'evening' : 'night'
  const crisis = isCrisis(text)

  const keywords: Features['keywords'] = {
    greeting: /^(hi|hello|hey)\b/i.test(text) ? 1 : 0,
    checkin: /(how.*(you|feeling)|check\s?in|mood)/i.test(text) ? 1 : 0,
    vent: KEYWORDS.vent.some(rx => rx.test(text)) ? 1 : 0,
    anxiety: KEYWORDS.anxiety.some(rx => rx.test(text)) ? 1 : 0,
    low_mood: KEYWORDS.low_mood.some(rx => rx.test(text)) ? 1 : 0,
    sleep: KEYWORDS.sleep.some(rx => rx.test(text)) ? 1 : 0,
    motivation: KEYWORDS.motivation.some(rx => rx.test(text)) ? 1 : 0,
    gratitude: KEYWORDS.gratitude.some(rx => rx.test(text)) ? 1 : 0,
    anger: KEYWORDS.anger.some(rx => rx.test(text)) ? 1 : 0,
    unknown: 0,
  } as any

  // Intent guess priority order
  const order: Intent[] = ['greeting','checkin','vent','anxiety','low_mood','sleep','motivation','gratitude','anger','unknown']
  let intentGuess: Intent = 'unknown'
  for (const k of order){
    if (k === 'unknown') continue
    if (keywords[k] > 0){ intentGuess = k; break }
  }
  if (intentGuess === 'unknown'){
    // fall back to sentiment
    if (label === 'negative') intentGuess = 'vent'
    else if (label === 'positive') intentGuess = 'gratitude'
    else intentGuess = 'checkin'
  }

  // Risk
  let risk: Risk = 'none'
  if (crisis) risk = 'high'
  else if (label === 'negative' && confidence >= 0.85) risk = 'medium'
  else if (label === 'negative' && confidence >= 0.6) risk = 'low'

  return { label, confidence, scores, lenBucket, repetitiveness, timeBucket, crisis, keywords, intentGuess, risk }
}
