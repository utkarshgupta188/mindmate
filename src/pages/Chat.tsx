// (the entire file you provided, with added/modified sections)
import { Send, Bot, AlertTriangle, HeartHandshake, PhoneCall, X, Sparkles, Volume2, Link as LinkIcon, Scan } from 'lucide-react'
import { VOICE_ASSISTANT_URL } from '../config/appConfig'
import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { analyzeSentiment } from '../utils/hfSentiment'
import { isCrisis, waLink } from '../utils/crisis'
import { chatGemini } from '../utils/gemini'
import { chatLocal } from '../utils/localLLM'
import { generateReply } from '../utils/dialogOrchestrator'
import { decideRoute } from '../utils/coachRouter'
import { buildSystemPrompt } from '../utils/systemPrompt'
import { getSafeJoke } from '../utils/jokes'
import { getMotivation } from '../utils/motivation'
import { getAsciiBanner } from '../utils/ascii'
import { analyzeTextEmotion, mapEmotionToVA } from '../utils/hfEmotion'
import OnboardingWizard from '../components/OnboardingWizard'
import { loadOnboarding, saveOnboarding, type OnboardingAnswers } from '../utils/onboarding'
import { isMentalHealthRelated } from '../utils/topicGate'
import CameraEmotion from '../components/CameraEmotion'
import YoloDetect from '../components/YoloDetect'
import VoiceControls from '../components/VoiceControls'
import { mapEmotionToValenceArousal, emotionToEmoji, DeepfaceEmotion } from '../utils/emotionMap'
import { humanizeResponse } from '../utils/textPost'
import { addOrUpdateSession, makeSessionId, summarizeTitle, type ChatSession } from '../utils/chatStore'
import { generateConversationReport } from '../utils/report'
import { useRealtimeStress } from '../hooks/useRealtimeStress'
import { useAuth } from '../context/AuthContext'
export type Msg = { from: 'user'|'bot'; text: string; ts: number }

type Pending = { kind: 'typing'; ts: number } | null


function renderTextWithLinks(text: string): React.ReactNode {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        const parts = line.split(/(https?:\/\/[^\s]+)/i)
        return (
          <React.Fragment key={`line-${i}`}>
            {parts.map((p, j) =>
              /^https?:\/\//i.test(p) ? (
                <a key={`l-${i}-${j}`} href={p} target="_blank" rel="noopener noreferrer" className="underline">{p}</a>
              ) : (
                <React.Fragment key={`t-${i}-${j}`}>{p}</React.Fragment>
              )
            )}
            {i < lines.length - 1 ? <br /> : null}
          </React.Fragment>
        )
      })}
    </>
  )
}

const smartSuggestions = [
  'I feel overwhelmed by studies',
  'Can we do a 3-minute breathing?',
  'I slept well and felt calmer today',
  'Teach me grounding 5-4-3-2-1',
]

export default function Chat(){
  const YOLO_ENABLED = ((import.meta as any).env?.VITE_ENABLE_YOLO === 'true')
  const TALK_ENABLED = ((import.meta as any).env?.VITE_ENABLE_TALK === 'true')
  const navigate = useNavigate()
  const initialOnb = loadOnboarding()
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [closing, setClosing] = useState(false)
  const baseLabel = '💬 MindMate'
  const [msgs, setMsgs] = useState<Msg[]>([{
    from: 'bot',
    text: `🐱 Whiskers the cat: Meow! Hi there.`,
    ts: Date.now() - 1000
  }, {
    from: 'bot',
    text: `${baseLabel}: Hi — we're glad you're here. When you're ready, say hello or tell me how you're feeling.`,
    ts: Date.now()
  }])
  const [crisis, setCrisis] = useState<string | null>(null)
  const [onboarding, setOnboarding] = useState<OnboardingAnswers | null>(initialOnb)
  const { user } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [webEmotion, setWebEmotion] = useState<{ label?: DeepfaceEmotion; confidence?: number } | null>(null)
  const [moodTrail, setMoodTrail] = useState<DeepfaceEmotion[]>([])
  const [lastAutoRespond, setLastAutoRespond] = useState<number | null>(null)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [sttAutoSend, setSttAutoSend] = useState(true)
  const [voiceActive, setVoiceActive] = useState(false)
  const [cameraApiHealthy, setCameraApiHealthy] = useState<boolean | null>(null)
  const [showYolo, setShowYolo] = useState(false)

  // NEW: realtime stress emitter hook
  const { emitStress } = useRealtimeStress(user?.email)

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:'smooth', block:'end' }) }, [msgs, typing])
  useEffect(()=>{ inputRef.current?.focus() }, [])

  useEffect(()=>{
    try {
      if (!moodTrail.length || !webEmotion?.label) return
      if (cameraApiHealthy === false) return
      const negSet = new Set(['sad','angry','fear','disgust'])
      const lastWindow = moodTrail.slice(-4)
      const negCount = lastWindow.filter(l => negSet.has(l)).length
      const now = Date.now()
      if (negCount >= 2 && webEmotion.confidence && webEmotion.confidence >= 0.55) {
        if (!lastAutoRespond || (now - lastAutoRespond) > 1000 * 60 * 3) { // 3 minutes cooldown
          const base = baseLabel
          const concern = `I noticed you might be looking a bit distressed from the camera — I care about how you're doing. Would you like a short grounding exercise or to tell me what's been hardest?`
          const encourage = `You're not alone. If you'd like, we can try a 1-minute breathing together or open /games for a guided grounding.`
          setMsgs(m => [...m, { from: 'bot', text: `${base}: ${concern}\n\n${encourage}`, ts: Date.now() }])
          setLastAutoRespond(now)
        }
      }
    } catch (e) {
    }
  }, [moodTrail, webEmotion, lastAutoRespond, baseLabel, cameraApiHealthy])

  // Helper: compute stress value (0-100) from multiple signals
  function computeStressValue(sentLabel: string | undefined, sentConf: number | undefined, arousal: string | undefined, webVA: { valence?: string; arousal?: string } | null, webConf?: number) {
    // base neutral
    let score = 50

    // sentiment
    if (sentLabel === 'negative') score += 20
    if (sentLabel === 'positive') score -= 10

    // confidence amplifies
    const conf = typeof sentConf === 'number' ? sentConf : 0.6
    score = score * (1 + (conf - 0.5) * 0.4) // small amplification

    // arousal (text)
    if (arousal === 'high') score += 15
    if (arousal === 'low') score -= 8

    // webcam valence/arousal adds signal
    if (webVA) {
      if (webVA.valence === 'negative') score += 12
      if (webVA.arousal === 'high') score += 10
      if (webVA.valence === 'positive') score -= 8
    }

    // webcam confidence dampens/strengthens
    if (webConf) score = score * (1 + Math.min(0.25, (webConf - 0.5) * 0.5))

    // clamp
    score = Math.max(0, Math.min(100, Math.round(score)))
    return score
  }

  async function send(textFromSuggestion?: string){
    if (!onboarding) return
    const raw = typeof textFromSuggestion === 'string' ? textFromSuggestion : input
    if (!raw.trim()) return
    const text = raw.trim()
    const now = Date.now()
    const currentUserMsg = { from:'user' as const, text, ts: now }
    setMsgs(m => [...m, currentUserMsg])
    setInput('')

    if (isCrisis(text)) setCrisis(text)

    setTyping(true)
    setPending({ kind:'typing', ts: Date.now() })
    try {
      const base = baseLabel
      const crisisRegex = /(suicid|kill myself|end my life|want to die|i want to die|i will kill myself|i am going to kill myself|self[- ]?harm|cut myself|jump off|can'?t go on|ending it|end it all|life isn'?t worth)/i
      const urgentCrisis = isCrisis(text) || crisisRegex.test(text)
      if (urgentCrisis){
        const reply = [
          `${base}: I'm taking what you said very seriously. It sounds like you're in a lot of pain, and I'm genuinely worried about you.`,
          `Your safety is the most important thing. You are not alone, and there are people who can help you right now.`,
          `Please reach out to one of these 24/7, free resources in India (call or text):`,
          `• Emergency — Call 112`,
          `• KIRAN Mental Health Helpline — 1800-599-0019 (24×7, toll-free)`,
          `• AASRA — +91-22-27546669 (24×7)`,
          `• Vandrevala Foundation — +91-9999-666-555`,
          `If any number doesn’t connect, please try again or search “India suicide helpline” for the latest options. I’m still here with you.`,
        ].join('\n\n')
        setMsgs(m => [...m, { from:'bot', text: reply, ts: Date.now() }])
        setCrisis(text)
        return
      }
      const withCurrent = [...msgs, currentUserMsg]
      const lastCoach = withCurrent.slice(-6).map(m => ({ role: (m.from === 'user' ? 'user' : 'bot') as 'user'|'bot', text: m.text }))
      const route = decideRoute(text, lastCoach)
      const hasGemini = !!(import.meta as any).env?.VITE_GEMINI_API_KEY
      const useLocal = ((import.meta as any).env?.VITE_LOCAL_LLM === 'true') || !!(import.meta as any).env?.VITE_LOCAL_LLM_PATH
      if (/\b(what'?s|whats) my expression\b|\bmy expression\b/i.test(text)){
        if (webEmotion?.label){
          const pct = webEmotion.confidence ? ` (${Math.round(webEmotion.confidence*100)}%)` : ''
          setMsgs(m => [...m, { from:'bot', text: `${base}: From the webcam, I’m seeing "${webEmotion.label}"${pct}. You can turn tracking off anytime from the header.`, ts: Date.now() }])
        } else {
          setMsgs(m => [...m, { from:'bot', text: `${base}: I don’t have a recent webcam reading. If you allow camera access (top-right) and keep the window in view, I can estimate expressions on-device.`, ts: Date.now() }])
        }
        return
      }
      if (!isMentalHealthRelated(text)){
        const boundary = [
          `${base}: I’m here to support mental wellbeing—feelings, stress, sleep, motivation, and coping.`,
          `I can’t help with that topic, but if you’d like, tell me how you’re feeling right now or what’s been hardest today.`
        ].join('\n\n')
        const lastBot = msgs.slice().reverse().find(m => m.from === 'bot')
        if (lastBot && lastBot.text?.trim() === boundary.trim()){
          setMsgs(m => [...m, { from: 'bot', text: `${base}: Okay — I hear you. I’m here if you want to talk later.`, ts: Date.now() }])
          return
        }
        if (hasGemini || useLocal){
          try {
            const system = buildSystemPrompt({ botLabel: base, sentiment: { label: 'neutral' as any, confidence: 0.95 }, crisis: false, humorAllowed: false, arousal: 'low' as any })
            const prompt = `Rephrase the following concise, firm but friendly boundary message so it sounds warm and human, without adding new instructions or resources. Keep it short:\n\n${boundary}`
            const humanized = hasGemini
              ? await chatGemini(prompt, [], { system })
              : await chatLocal(prompt, [], { system })
            setMsgs(m => [...m, { from: 'bot', text: humanizeResponse(humanized || boundary), ts: Date.now() }])
            return
          } catch (e) {
          }
        }
        setMsgs(m => [...m, { from:'bot', text: boundary, ts: Date.now() }])
        return
      }
      const sent = await analyzeSentiment(text)
      const conf = typeof (sent as any).confidence === 'number' ? (sent as any).confidence : 0.6
      const profane = /(fuck|bitch|asshole|bastard|stupid|idiot|madarchod|mc|bc|screw you|shut up)/i.test(text)
      const hfEmo = await analyzeTextEmotion(text)
      const va = mapEmotionToVA(hfEmo.label)
      const arousal = va.arousal
      const webVA = webEmotion?.label ? mapEmotionToValenceArousal(webEmotion.label) : null
      const webcamHighNeg = webVA ? (webVA.valence === 'negative' && webVA.arousal === 'high') : false
      const humorAllowed = !urgentCrisis && !profane && (sent.label !== 'negative' || (conf < 0.65 && arousal !== 'high')) && !webcamHighNeg
      const motTone = sent.label === 'positive' ? 'energizing' : sent.label === 'negative' ? (conf >= 0.75 ? 'gentle' : 'steady') : 'steady'
      const mot = getMotivation(motTone as any)
      const joke = humorAllowed ? await getSafeJoke({ category: sent.label === 'positive' ? 'Programming' : 'Misc' }) : null
      const banner = (!urgentCrisis && sent.label === 'positive') ? await getAsciiBanner('You got this') : null

      // ===== NEW: compute and emit a stress point for this user message =====
      try {
        const stressValue = computeStressValue(sent.label as string | undefined, conf, arousal as string | undefined, webVA, webEmotion?.confidence)
        // emit realtime stress point
        emitStress(stressValue)
      } catch (e) {
        // don't break flow if emit fails
        console.warn('emitStress failed', e)
      }
      // ===================================================================

      if (route === 'hf'){
        const planned = await generateReply(text, lastCoach)
        if (hasGemini || useLocal){
          const system = buildSystemPrompt({ botLabel: base, sentiment: { label: sent.label as any, confidence: conf }, crisis: false, humorAllowed, arousal })
            const contextExtras = [
            `Context meta: sentiment=${sent.label} confidence=${conf.toFixed(2)} humorAllowed=${humorAllowed}`,
            hfEmo.label ? `Emotion (HF): ${hfEmo.label}${(hfEmo.scores?.[0]?.score != null) ? ` (${Math.round((hfEmo.scores![0]!.score)*100)}%)` : ''}` : '',
            onboarding ? `User prefs: goal=${onboarding.goal||'n/a'} style=${onboarding.style||'n/a'} humor=${onboarding.humor||'n/a'} grounding=${onboarding.grounding||'n/a'}` : '',
            webEmotion?.label ? `Observed emotion (webcam): ${webEmotion.label}${webEmotion.confidence ? ` (${Math.round(webEmotion.confidence*100)}%)` : ''}` : '',
            mot ? `Motivation: ${mot}` : '',
            joke ? `Joke: ${joke}` : '',
            banner ? `Banner:\n${banner}` : ''
          ].filter(Boolean).join('\n\n')
          try {
            const payloadText = `User said: \"${text}\"\n\nPlan suggestions for you to adapt:\n${planned.text}\n\n${contextExtras}\n\nRespond directly to the user in a warm tone.`
            const history = withCurrent.slice(-4).map(m => ({ role: (m.from === 'user' ? 'user' : 'model') as 'user'|'model', text: m.text }))
            const humanized = hasGemini
              ? await chatGemini(payloadText, history, { system })
              : await chatLocal(payloadText, history, { system })
            setMsgs(m => [...m, { from:'bot', text: humanizeResponse(humanized), ts: Date.now() }])
          } catch {
            setMsgs(m => [...m, { from:'bot', text: planned.text, ts: Date.now() }])
          }
        } else {
          setMsgs(m => [...m, { from:'bot', text: planned.text, ts: Date.now() }])
        }
      } else {
        if (hasGemini || useLocal){
          try {
            const directSystem = buildSystemPrompt({ botLabel: base, sentiment: { label: sent.label as any, confidence: conf }, crisis: false, humorAllowed, arousal })
            const context = [
              `Context meta: sentiment=${sent.label} confidence=${conf.toFixed(2)} humorAllowed=${humorAllowed}`,
              hfEmo.label ? `Emotion (HF): ${hfEmo.label}${(hfEmo.scores?.[0]?.score != null) ? ` (${Math.round((hfEmo.scores![0]!.score)*100)}%)` : ''}` : '',
              onboarding ? `User prefs: goal=${onboarding.goal||'n/a'} style=${onboarding.style||'n/a'} humor=${onboarding.humor||'n/a'} grounding=${onboarding.grounding||'n/a'}` : '',
              webEmotion?.label ? `Observed emotion (webcam): ${webEmotion.label}${webEmotion.confidence ? ` (${Math.round((webEmotion.confidence*100))}%)` : ''}` : '',
              mot ? `Motivation: ${mot}` : '',
              joke ? `Joke: ${joke}` : '',
              banner ? `Banner:\n${banner}` : '',
              `You may suggest opening /games for a 2-minute breathing or grounding exercise when appropriate.`
            ].filter(Boolean).join('\n\n')
            const history = withCurrent.slice(-6).map(m => ({ role: (m.from === 'user' ? 'user' : 'model') as 'user'|'model', text: m.text }))
            const gReply = hasGemini
              ? await chatGemini(`${context}\n\nUser: ${text}`, history, { system: directSystem })
              : await chatLocal(`${context}\n\nUser: ${text}`, history, { system: directSystem })
            setMsgs(m => [...m, { from:'bot', text: humanizeResponse(gReply), ts: Date.now() }])
          } catch {
            const planned = await generateReply(text, lastCoach)
            setMsgs(m => [...m, { from:'bot', text: planned.text, ts: Date.now() }])
          }
        } else {
          const planned = await generateReply(text, lastCoach)
          setMsgs(m => [...m, { from:'bot', text: planned.text, ts: Date.now() }])
        }
      }

      if ((/suicid|kill|end it|hopeless|worthless|i'm done|im done|done with life/i.test(text))) {
        setCrisis(text)
      }
    } catch {
      const base = baseLabel
      setMsgs(m => [...m, { from:'bot', text: `${base}: I’m here. Let’s try a 3-minute breathing exercise together? If you’d like, open Games for a calming start.`, ts: Date.now() }])
    } finally {
      setTyping(false)
      setPending(null)
    }
  }

  function handleTranscript(t: string){
    const trimmed = t.trim()
    if (!trimmed) return
    if (!isMentalHealthRelated(trimmed)){
      const base = baseLabel
      const boundary = [
        `${base}: I’m here to support mental wellbeing—feelings, stress, sleep, motivation, and coping.`,
        `I can’t help with that topic via voice, but if you’d like, tell me how you’re feeling right now.`
      ].join('\n\n')
      setMsgs(m => [...m, { from:'bot', text: boundary, ts: Date.now() }])
      return
    }
    if (isCrisis(trimmed)){
      setMsgs(m => [...m, { from:'user', text: trimmed, ts: Date.now() }])
      setCrisis(trimmed)
      return
    }
    if (sttAutoSend) send(trimmed)
    else setInput(trimmed)
  }

  useEffect(()=>{ /* TTS speak last bot message */ 
    try {
      if (!ttsEnabled || !voiceActive) return
      const last = msgs[msgs.length - 1]
      if (!last || last.from !== 'bot') return
      if (crisis) return
      const text = last.text || ''
      if (/\d{3,}/.test(text) && /helpline|call|emergency|phone|call\s+112/i.test(text)) return
      const synth: any = (window as any).speechSynthesis
      if (!synth) return
      synth.cancel()
      const utter = new SpeechSynthesisUtterance(text.length > 800 ? text.slice(0, 600) + '... I have more in the chat.' : text)
      utter.lang = 'en-US'
      utter.rate = 1
      utter.pitch = 1
      synth.speak(utter)
    } catch (e) {
    }
    return ()=>{ try{ const s: any = (window as any).speechSynthesis; s?.cancel() }catch{} }
  }, [msgs])

  function speakMessage(text: string){
    try{
      if (!text) return
      if (crisis) return
      if (/\d{3,}/.test(text) && /helpline|call|emergency|phone|call\s+112/i.test(text)) return
      const synth: any = (window as any).speechSynthesis
      if (!synth) return
      synth.cancel()
      const utter = new SpeechSynthesisUtterance(text.length > 800 ? text.slice(0, 600) + '... I have more in the chat.' : text)
      utter.lang = 'en-US'
      utter.rate = 1
      utter.pitch = 1
      synth.speak(utter)
    }catch(e){ }
  }

  const headerIcon = '💬'
  const headerName = 'MindMate'

  async function closeChatAndReport(){
    if (closing) return
    setClosing(true)
    try{
      const transcript = msgs.map(m => `${m.from==='user' ? 'User' : 'AI'}: ${m.text}`).join('\n')
      const { report } = await generateConversationReport(transcript)
      const startedAt = msgs[0]?.ts || Date.now()
      const endedAt = Date.now()
      const session: ChatSession = {
        id: makeSessionId(),
        bot: 'mindmate' as any,
        title: summarizeTitle(msgs as any),
        startedAt,
        endedAt,
        messages: msgs,
        report: report || undefined
      }
      addOrUpdateSession(session)

      // NEW: if report includes points, emit them so dashboard receives final curve
      try {
        if (report?.points && Array.isArray(report.points) && report.points.length) {
          for (const p of report.points) {
            // emit each stored point
            emitStress(p.value)
          }
        } else if (report?.stressLevel) {
          // fallback: map label to a single value and emit
          const mapLabelToValue = (label?: string) => {
            const l = (label||'').toLowerCase()
            if (l.includes('high')) return 85
            if (l.includes('moderate')) return 60
            if (l.includes('low')) return 25
            return 50
          }
          emitStress(mapLabelToValue(report?.stressLevel))
        }
      } catch (e) {
        console.warn('emit final report points failed', e)
      }

      // Navigate to Reports page
      navigate('/reports')
    } catch (e) {
      // If something goes wrong, still navigate to reports so the user can see existing ones
      navigate('/reports')
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_120%_-10%,theme(colors.indigo.300/15),transparent),radial-gradient(60rem_40rem_at_-10%_0%,theme(colors.cyan.300/12),transparent)]" />

      <section className="card rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white text-lg shadow">{headerIcon}</span>
            <div>
              <h3 className="font-semibold leading-tight">{headerName}</h3>
          {YOLO_ENABLED && showYolo && (
            <div className="px-4 md:px-6 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50">
              <YoloDetect />
            </div>
          )}
              <p className="text-xs text-slate-500 dark:text-slate-400">Empathetic companion • responses may be AI-generated</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <CameraEmotion hideStatus onResult={(r)=>{
              setWebEmotion({ label: r.label, confidence: r.confidence })
              if (r.label) setMoodTrail(t => {
                const next = [...t, r.label!]
                return next.slice(-8)
              })
            }} onHealthChange={(h)=>setCameraApiHealthy(h)} />
            <div className="flex items-center gap-2">
              {YOLO_ENABLED && (
                <button
                  type="button"
                  onClick={()=> setShowYolo(v=>!v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Toggle YOLO object detection"
                >
                  <Scan size={16} />
                  <span>YOLO</span>
                </button>
              )}
              {TALK_ENABLED && (
                <VoiceControls
                  onTranscript={handleTranscript}
                  autoSend={sttAutoSend}
                  lang={navigator.language || 'en-US'}
                  onStart={()=>{ setVoiceActive(true); setTtsEnabled(true) }}
                  onStop={()=>setVoiceActive(false)}
                />
              )}
              <a
                href={VOICE_ASSISTANT_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Open Voice Assistant"
                className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <LinkIcon size={16} />
                <span>Voice Assistant</span>
              </a>
              <span title="Text-to-speech status">{ttsEnabled ? '🔊' : '🔈'}</span>
            </div>
            {moodTrail.length > 0 && (
              <div className="text-xs opacity-75" title={moodTrail.join(', ')}>
                {moodTrail.map((e,i)=> <span key={i} className="ml-0.5">{({happy:'🙂',sad:'🙁',angry:'😠',fear:'😨',disgust:'🤢',surprise:'😮',neutral:'😐'} as any)[e]}</span>)}
              </div>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/40 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5"/> Be kind to yourself
            </span>
            <button onClick={closeChatAndReport} disabled={closing} aria-label="Close chat" title="Close chat and generate report" className={`ml-2 p-1.5 rounded-md border hover:bg-slate-100 dark:hover:bg-slate-800 ${closing ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <button onClick={closeChatAndReport} disabled={closing} aria-label="Close chat" title="Close chat and generate report" className={`p-2 rounded-md border hover:bg-slate-100 dark:hover:bg-slate-800 ${closing ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="md:hidden px-4 py-2 border-b border-slate-200/60 dark:border-slate-800/60 flex justify-end bg-white/60 dark:bg-slate-900/60">
          <button onClick={closeChatAndReport} disabled={closing} className={`px-3 py-1.5 rounded-xl border ${closing ? 'opacity-60 cursor-not-allowed' : ''}`} title="Close chat and generate report">
            {closing ? 'Generating…' : 'Close Chat'}
          </button>
        </div>

        <div className="px-4 md:px-6 py-4 h-[62vh] overflow-y-auto space-y-3">
          <AnimatePresence initial={false}>
            {msgs.map((m, i)=> (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className={(m.from==='user' ? 'ml-auto' : '') + ' max-w-[82%]'}
              >
                <div className={'px-3 py-2 rounded-2xl shadow-sm ' + (m.from==='user' ? 'bg-forest-100 dark:bg-forest-900/30' : 'bg-slate-100 dark:bg-slate-800/80')}>
                    <div className="flex items-start gap-2">
                      <p className="text-sm whitespace-pre-wrap flex-1">{renderTextWithLinks(m.text)}</p>
                      {m.from === 'bot' && (
                        <button aria-label="Play message" title="Play message" onClick={()=>speakMessage(m.text)} className="ml-2 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                          <Volume2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {typing && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="max-w-[82%]">
                <div className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 inline-flex items-center gap-2">
                  <Bot className="h-4 w-4 text-slate-500" />
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:240ms]" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <div className="px-4 md:px-6 pb-4">
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="chat-input">Type how you feel</label>
            <input id="chat-input" ref={inputRef} className="flex-1 border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50" placeholder={onboarding ? "Type how you feel..." : "Please complete quick setup to start chatting"} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if (e.key==='Enter') send() }} aria-label="Type how you feel" disabled={!onboarding} />
            <button onClick={()=>send()} className="btn btn-primary inline-flex items-center gap-2" disabled={!input.trim() || !onboarding} aria-disabled={!input.trim() || !onboarding}>
              <Send className="h-4 w-4" /> Send
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {smartSuggestions.map(s => (
              <button key={s} onClick={()=>send(s)} className="text-xs rounded-full border border-slate-200/60 dark:border-slate-800/60 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">{s}</button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {!onboarding && (
          <OnboardingWizard onComplete={(ans)=>{
            saveOnboarding(ans)
            setOnboarding(ans)
            setMsgs(prev=>{
              if (prev.length >= 2){
                const m0 = prev[0]!
                const m1 = prev[1]!
                const updated0: Msg = { from: m0.from, ts: m0.ts, text: `🐱 Whiskers the cat: Meow! Hi${ans.name ? ' ' + ans.name : ''}.` }
                const updated1: Msg = { from: m1.from, ts: m1.ts, text: `${baseLabel}: Hi${ans.name ? ' ' + ans.name : ''} — we're glad you're here. When you're ready, say hello or tell me how you're feeling.` }
                return [updated0, updated1, ...prev.slice(2)]
              }
              return prev
            })
          }} />
        )}
        {crisis && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" aria-live="assertive">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }} role="dialog" aria-modal="true" className="card max-w-md w-full rounded-2xl border border-amber-300/40 bg-amber-50/70 text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> You matter. Let’s get support.</h3>
                <button className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5" onClick={()=>setCrisis(null)} aria-label="Close"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-sm text-amber-900/90 dark:text-amber-200/90 mt-1">Your message suggests you might be in distress. Consider reaching out to someone you trust or local emergency services immediately.</p>
              {user?.lovedOnes?.length ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm">Send a WhatsApp message to:</p>
                  {user.lovedOnes.map((l,i)=> (
                    <a key={i} className="block px-3 py-2 rounded-xl border hover:bg-amber-100/40 dark:hover:bg-amber-900/20" target="_blank" rel="noreferrer noopener" href={waLink(l.whatsapp ?? '', `This is ${user.name}. I need support right now. Can we talk?`)}>
                      <span className="inline-flex items-center gap-2"><HeartHandshake className="h-4 w-4" /> {l.name}</span> <span className="text-xs opacity-70">({l.whatsapp})</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-900/90 dark:text-amber-200/90 mt-3">Add loved-one contacts in your Dashboard to enable quick alerts.</p>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <a className="px-3 py-2 rounded-xl border btn-outline inline-flex items-center gap-2" href="tel:112"><PhoneCall className="h-4 w-4" /> Call emergency (112)</a>
                <button className="btn btn-primary" onClick={()=>setCrisis(null)}>I’m safe</button>
              </div>
              <p className="text-xs opacity-70 mt-3">This demo does not automatically notify anyone. Automated messaging requires consent and WhatsApp Business API.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sr-only">Chat supports quick suggestions, typing indicator, and crisis resources.</div>
    </div>
  )
}
