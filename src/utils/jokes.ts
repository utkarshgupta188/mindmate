// Safe joke fetchers with layered fallbacks for browser use
// Priority: JokeAPI (no key) -> icanhazdadjoke (no key) -> API-Ninjas (if key)

export type JokeOptions = {
  category?: 'Any' | 'Programming' | 'Pun' | 'Misc'
}

async function fetchJokeAPI(opts: JokeOptions = {}): Promise<string | null> {
  const category = opts.category ?? 'Any'
  // Safe mode filters sensitive categories; type=single gets one-liners (easier to render)
  const url = `https://v2.jokeapi.dev/joke/${encodeURIComponent(category)}?safe-mode&type=single&blacklistFlags=nsfw,sexist,explicit,political,racist,religious`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data && data.type === 'single' && typeof data.joke === 'string') return data.joke
    return null
  } catch {
    return null
  }
}

async function fetchIcanHazDadJoke(): Promise<string | null> {
  try {
    const res = await fetch('https://icanhazdadjoke.com/', {
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'Mindmate Demo (https://example.com)'
      },
    })
    if (!res.ok) return null
    const text = await res.text()
    return (text && text.trim().length > 0) ? text.trim() : null
  } catch {
    return null
  }
}

async function fetchApiNinjas(): Promise<string | null> {
  const key = (import.meta as any).env?.VITE_API_NINJAS_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.api-ninjas.com/v1/jokes?limit=1', {
      headers: { 'X-Api-Key': key },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data) && data[0]?.joke) return String(data[0].joke)
    return null
  } catch {
    return null
  }
}

export async function getSafeJoke(opts: JokeOptions = {}): Promise<string | null> {
  // Try JokeAPI first
  const j1 = await fetchJokeAPI(opts)
  if (j1) return j1
  // Then Dad Joke
  const j2 = await fetchIcanHazDadJoke()
  if (j2) return j2
  // Finally API Ninjas if key available
  const j3 = await fetchApiNinjas()
  if (j3) return j3
  return null
}
