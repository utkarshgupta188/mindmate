const TRIGGERS = [
  'suicide', 'kill myself', 'end my life', 'self harm', 'cut myself', 
  'jump off', 'no reason to live', 'want to die', 'wanna die',
  "don't want to live", "dont want to live", "do not want to live",
  'dying', 'im dying', "i'm dying", 'i am dying',
  'end it all', 'end it', 'give up', "can't go on", 'cant go on',
  'kill myself', 'hurt myself', 'harm myself', 'take my life',
  'no point', 'nothing matters', 'worthless', 'better off dead',
  'hate living', 'hate life', 'wish i was dead', 'wish i were dead'
]

export function isCrisis(text: string){
  const t = text.toLowerCase()
  // Check for exact phrase matches first (more specific)
  for (const trigger of TRIGGERS) {
    if (t.includes(trigger)) {
      return true
    }
  }
  // Check for combinations that indicate crisis
  const crisisPatterns = [
    /(want|wanna|going|wanting)\s+(to|too)?\s*(die|end|kill)/,
    /(dont|don't|do not)\s+want\s+(to\s+)?live/,
    /(im|i'm|i am)\s+dying/,
    /(no|not)\s+(reason|point|meaning)/,
    /(end|kill|harm)\s+(my\s+)?(life|self|myself)/
  ]
  return crisisPatterns.some(pattern => pattern.test(t))
}

export function waLink(phoneE164: string, message: string){
  const clean = phoneE164.replace(/[^\d]/g,'')
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
  return url
}
