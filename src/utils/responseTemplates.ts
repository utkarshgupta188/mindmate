export const greetings = [
  "Hey there — I'm so glad you popped in. How are you feeling today?",
  "Hello! It's good to see you. I'm here to listen whenever you want to talk.",
  "Hi — I'm here for you. Want to tell me about your day?",
]

export const friendshipLines = [
  "I'm glad we're chatting — I'd love to be someone you can lean on.",
  "Think of me as a friendly companion who's here to listen anytime.",
  "You're not alone — I'm here with you, and we'll take this one step at a time.",
]

export const positiveReplies = [
  "That's wonderful — I'm really happy for you! Would you like to savor that moment together?",
  "Amazing — sounds like something great happened. Want to tell me more about it?",
  "I love hearing that. Celebrations, even small ones, matter — what's one tiny thing that made your day?",
]

export const neutralReplies = [
  "Thanks for sharing — what's on your mind right now?",
  "Okay — do you want to explore that feeling, or try a short grounding step?",
  "I hear you. If you'd like, we can check in on your mood together or do a quick breathing exercise.",
]

export const negativeReplies = [
  "I'm sorry you're going through that — that sounds really hard. Do you want to talk more about what's been happening?",
  "I hear you. Would a short grounding exercise help, or would you prefer to share more?",
  "That sounds heavy. I'm here with you — we can try a 2‑minute breath or take it slow as you tell me more.",
]

export const crisisReplies = [
  "I'm really sorry — it sounds like you're in a lot of pain. If you're in immediate danger, please call local emergency services now.",
  "I care about your safety. If you can, please reach out to a trusted person right now or call a crisis line. You're not alone.",
  "This sounds urgent. If you have a plan or means, please stop and call your local emergency number or a suicidal crisis line immediately.",
]

export const boundaryReplies = [
  "I’m here to support mental wellbeing—feelings, stress, sleep, motivation, and coping. If you'd like, tell me how you're feeling right now.",
  "I can't help with that topic here. If you want to talk about how you're doing or what's been hard, I'm right here to listen.",
  "I'm focused on mental wellbeing: feelings, coping, and support. If you're open to it, tell me a bit about how you're feeling.",
  "I’m not the best fit for that topic. If you want, you can share how you’re feeling or ask for a grounding exercise instead."
]

export function pickRandom<T>(arr: readonly T[]): T {
  const len = arr.length
  if (len === 0) throw new Error('pickRandom called with empty array')
  const idx = Math.floor(Math.random() * len)
  const val = (arr as T[])[idx]
  return (val !== undefined ? val : (arr as T[])[0]!)
}
