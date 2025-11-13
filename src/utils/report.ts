// Conversation report generator using Gemini structured JSON responses
// Falls back to a lightweight heuristic if no API key is configured or API fails

export type StressPoint = {
  t: number      // timestamp in ms
  value: number  // stress 0–100
  source?: string
}

// Extend ConversationReport to include time-series
export interface ConversationReport {
  stressLevel: string
  natureSummary: string
  thinkingPatterns: string
  keyProblems: string[]
  generalReflection: string
  wellnessRecommendations: string
  startedAt?: number
  endedAt?: number
  points?: StressPoint[]    // ← new field for chart connection
}


const REPORT_MODEL = (import.meta as any).env?.VITE_GEMINI_REPORT_MODEL || (import.meta as any).env?.VITE_GEMINI_MODEL || 'gemini-2.5-flash'
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined

const reportSchema = {
  type: 'OBJECT',
  properties: {
    natureSummary: { type: 'STRING', description: 'A concise, objective summary of the user\'s underlying nature, disposition, or personality traits revealed in the conversation.' },
    stressLevel: { type: 'STRING', description: "An assessment of the user's current stress level, categorized as 'Low', 'Moderate', or 'High'." },
    keyProblems: { type: 'ARRAY', description: 'A bulleted list of the main problems, concerns, or recurring themes identified from the dialogue.', items: { type: 'STRING' } },
    thinkingPatterns: { type: 'STRING', description: "An analysis of the user's thinking style (e.g., rational, emotive, cyclical, detail-focused, or future-oriented)." },
    generalReflection: { type: 'STRING', description: 'A short, actionable, general self-reflection prompt based on the overall psychological findings.' },
    wellnessRecommendations: { type: 'STRING', description: 'Personalized wellness recommendations based on the detected stress level and problems. Recommend tailored activities such as mindfulness techniques, specific types of physical activities (e.g., walking, stretching), or motivational content/strategies in a single, encouraging paragraph.' }
  },
  required: ['natureSummary','stressLevel','keyProblems','thinkingPatterns','generalReflection','wellnessRecommendations']
}

function extractUserOnly(transcript: string){
  try{
    const lines = transcript.split(/\r?\n/)
    const userLines = lines.filter(l => /^\s*(user)\s*:/i.test(l)).map(l => l.replace(/^\s*user\s*:\s*/i, '').trim())
    return userLines.join('\n')
  }catch{ return transcript }
}

function heuristicReport(transcript: string): ConversationReport{
  const text = transcript.toLowerCase()
  const stressHits = (text.match(/stress|stressed|overwhelm|overwhelmed|anxious|anxiety|panic|can\'t sleep|insomnia|deadline|pressure|burnout|tired|exhausted/g) || []).length
  const sleepHits = (text.match(/sleep|insomnia|awake|can\'t sleep|night/g) || []).length
  const controlHits = (text.match(/control|can\'t control|helpless|boundar/g) || []).length
  const guiltHits = (text.match(/guilt|guilty/g) || []).length
  const stressLevel = stressHits >= 8 ? 'High' : stressHits >= 3 ? 'Moderate' : 'Low'
  const problems: string[] = []
  if (controlHits) problems.push('Perceived lack of control and boundary difficulties')
  if (sleepHits) problems.push('Sleep disruption and unhelpful nighttime rumination')
  if (guiltHits) problems.push('Self‑criticism or guilt after setting limits')
  if (!problems.length) problems.push('General stress and emotional load')
  return {
    natureSummary: 'Thoughtful and conscientious; tends to internalize pressure and take on responsibility.',
    stressLevel,
    keyProblems: problems,
    thinkingPatterns: 'Future‑focused worry with occasional all‑or‑nothing thinking; attentive to obligations.',
    generalReflection: 'What is one small boundary or 10‑minute pause you could try this week, and how might you support yourself when guilt appears?',
    wellnessRecommendations: 'Try a short evening wind‑down (screens off for 30–60 minutes), a 10‑minute daylight walk most days, and jot down the top 3 priorities for tomorrow to reduce bedtime rumination.'
  }
}

export async function generateConversationReport(transcript: string): Promise<{ report: ConversationReport | null; error?: string }>{
  const usersOnly = extractUserOnly(transcript)
  // If no API key, return heuristic immediately
  if (!API_KEY){
    return { report: heuristicReport(usersOnly) }
  }
  const systemInstruction = {
    parts: [{ text: "You are a specialized psychological analysis engine. Your task is to objectively analyze the provided conversation text and output a structured JSON report based on the defined schema. Use professional, neutral language. Base all assessments strictly on the text provided. Focus the analysis only on the 'User' parts of the transcript." }]
  }
  const prompt = `Analyze the following conversation transcript. Generate a structured JSON report based on the required schema. TRANSCRIPT:\n---\n${transcript}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: reportSchema
    },
    model: REPORT_MODEL
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(REPORT_MODEL)}:generateContent?key=${encodeURIComponent(API_KEY)}`
  try{
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok){
      const t = await res.text().catch(()=> '')
      throw new Error(`HTTP ${res.status} ${t}`)
    }
    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof text === 'string' && text.trim()){
      try{
        const parsed = JSON.parse(text) as ConversationReport
        return { report: parsed }
      }catch(e:any){
        // Try to coerce simple JSONish output
        return { report: heuristicReport(usersOnly), error: 'Model did not return valid JSON; used heuristic.' }
      }
    }
    return { report: heuristicReport(usersOnly), error: 'Empty model response; used heuristic.' }
  }catch(e:any){
    return { report: heuristicReport(usersOnly), error: String(e?.message || e) }
  }
}
