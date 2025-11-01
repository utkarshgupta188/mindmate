export type OnboardingAnswers = {
  name?: string
  pronouns?: 'she/her'|'he/him'|'they/them'|'prefer-not-to-say'|'other'
  goal?: 'reduce-stress'|'improve-sleep'|'stay-motivated'|'talk-it-out'
  stress?: 1|2|3|4|5
  sleep?: 1|2|3|4|5
  support?: 'yes'|'no'|'unsure'
  humor?: 'avoid'|'sometimes'|'open'
  style?: 'gentle'|'practical'|'energizing'
  grounding?: 'yes'|'no'
  consent?: boolean
}

const KEY = 'onboarding.v1'

export function loadOnboarding(): OnboardingAnswers | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveOnboarding(ans: OnboardingAnswers){
  try { localStorage.setItem(KEY, JSON.stringify(ans)) } catch {}
}
