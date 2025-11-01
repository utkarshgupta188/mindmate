// Simple keyword-based filter for mental health related messages

const KEYWORDS = [
  'mental', 'wellbeing', 'well-being', 'well being',
  'feel', 'feeling', 'feelings', 'emotion', 'emotional', 'mood', 'overwhelmed', 'lonely',
  'anxiety', 'anxious', 'panic', 'attack', 'depress', 'sad', 'angry', 'frustrated', 'hopeless',
  'stress', 'stressed', 'burnout', 'tired', 'exhausted',
  'sleep', 'insomnia', 'restless',
  'motivation', 'motivated', 'procrastinate',
  'cope', 'coping', 'grounding', 'breathe', 'breathing', 'mindful', 'mindfulness', 'meditate', 'meditation',
  'self-care', 'self care', 'selfcare',
  'therapy', 'therapist', 'counsel', 'counselor', 'counsellor',
  'support', 'help me', 'need help',
  'suicid', 'self-harm', 'self harm', 'harm myself', 'kill myself'
]

export function isMentalHealthRelated(text: string): boolean {
  const t = (text || '').toLowerCase()
  if (!t.trim()) return false
  for (const k of KEYWORDS){
    if (t.includes(k)) return true
  }
  // common patterns
  if (/\b(i\s*feel|i'm\s*feeling|im\s*feeling|not\s*feeling\s*(well|ok|okay)|how\s*i\s*feel)\b/i.test(text)) return true
  return false
}
