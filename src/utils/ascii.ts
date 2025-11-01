// Optional ASCII art banner via Asciified API. Gracefully degrades to plain text.
export async function getAsciiBanner(text: string): Promise<string | null> {
  try {
    const url = `https://asciified.thelicato.io/api/v2/ascii?text=${encodeURIComponent(text)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.text()
    return data && data.trim() ? data : null
  } catch {
    return null
  }
}
