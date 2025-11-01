// Lightweight response post-processor to humanize and clean model text
// Inspired by SakhiAI's processing; keeps changes minimal and safe.

export function humanizeResponse(text: string, opts?: { prependGreeting?: string | false; signOff?: string | false }){
  if (typeof text !== 'string') return ''
  let t = text

  // Remove common AI disclaimers/self-references
  t = t.replace(/\bAs an AI(?:[^\n\.]*)?/gi, '')
       .replace(/\bAs a language model(?:[^\n\.]*)?/gi, '')
       .replace(/\bI'm an AI(?:[^\n\.]*)?/gi, '')

  // Gentle phrasing tweaks
  t = t.replace(/\bI think\b/gi, 'I feel')
       .replace(/\bIt seems\b/gi, 'It sounds like')
       .replace(/\bBased on my training\b/gi, 'From experience')

  // Ensure ending punctuation
  if (!/[.!?]\s*$/.test(t.trim())) t = t.trim() + '.'

  // Optional prepend greeting
  if (opts?.prependGreeting && typeof opts.prependGreeting === 'string') {
    t = `${opts.prependGreeting} ${t}`
  }

  // Optional sign-off (avoid in continuous chat by default)
  if (opts?.signOff && typeof opts.signOff === 'string') {
    if (!/\n\n/.test(t)) t += '\n\n'
    t += opts.signOff
  }

  return t.trim()
}
