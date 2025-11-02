// Lightweight, safe motivational snippets
const gentle = [
  "One small step is still progress.",
  "You don't have to do everything today—just the next kind thing for yourself.",
  "It's okay to feel what you feel; it won't last forever.",
]

const steady = [
  "You've handled hard days before. You can handle this one too.",
  "Tiny actions compound—breathe, sip water, and take the next small step.",
  "You matter more than you know.",
]

const energizing = [
  "You're stronger than you think—and you don't have to do it alone.",
  "Momentum beats motivation. Let's find a 30‑second win.",
  "This is a chapter, not your whole story.",
]

export function getMotivation(tone: 'gentle'|'steady'|'energizing' = 'gentle'): string {
  const pool = tone === 'gentle' ? gentle : tone === 'steady' ? steady : energizing
  const idx = Math.floor(Math.random() * pool.length)
  return (pool[idx] ?? pool[0])!
}
