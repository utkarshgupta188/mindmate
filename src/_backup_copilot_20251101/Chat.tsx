import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { sentimentScore } from '../utils/sentiment'
import { analyzeSentiment, generateChatResponse } from '../utils/sentimentApi'
import { isCrisis, waLink } from '../utils/crisis'
import { useAuth } from '../context/AuthContext'
import { Send, Bot, User as UserIcon, AlertTriangle, HeartHandshake, PhoneCall, X } from 'lucide-react'
import BreathingWidget from '../components/BreathingWidget'
import { videosForMood } from '../utils/youtube'

// message shape
export type Msg = { from: 'user'|'bot'; text: string; ts: number }

function botReply(bot:'adem'|'eve', userText:string){
  const s = sentimentScore(userText)
  const base = bot === 'adem' ? '🧠 Adem' : '🌿 Eve'
  const lowerText = userText.toLowerCase()
  
  // Negative sentiment responses - varied and contextual
  if (s.label === 'negative') {
    const responses = [
      "I hear you. That sounds heavy. Want to try a 3-minute breathing exercise together? You're not alone.",
      "I'm really sorry you're feeling this way. It takes courage to share your feelings. I'm here to listen and support you. 💙",
      "Thank you for trusting me with these feelings. Sadness and struggle are natural, and you don't have to go through it alone. 🌅",
      "I can sense that you're going through a difficult time, and I want you to know that your feelings are completely valid. I'm here to support you. 🤗"
    ]
    
    // More specific responses for different emotions
    if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('down')) {
      return `${base}: ${responses[Math.floor(Math.random() * responses.length)]}`
    }
    if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('stressed')) {
      return `${base}: I can sense that anxiety is weighing on you right now. That's such a heavy feeling to carry. I'm here to help. 🌿`
    }
    if (lowerText.includes('angry') || lowerText.includes('frustrated') || lowerText.includes('mad')) {
      return `${base}: I understand you're feeling angry or frustrated right now. Those are valid emotions. I'm here to help you work through this. 💫`
    }
    if (lowerText.includes('lonely') || lowerText.includes('alone')) {
      return `${base}: I'm so glad you reached out instead of keeping those lonely feelings to yourself. You're not alone in this - I'm right here with you. 🤝`
    }
    if (lowerText.includes('not okay') || lowerText.includes('not feeling') || lowerText.includes('not good')) {
      return `${base}: I hear that you're not feeling okay, and I'm here for you. Your feelings matter, and you're taking a brave step by reaching out. 💙`
    }
    
    return `${base}: ${responses[Math.floor(Math.random() * responses.length)]}`
  }
  
  // Positive sentiment responses - varied
  if (s.label === 'positive') {
    const responses = [
      "Love that! What helped today? Let's note one thing to repeat tomorrow.",
      "That's wonderful to hear! It's so lovely that you're feeling good today. Positivity is beautiful! ✨",
      "Your happiness is contagious! I'm smiling hearing about your good feelings. What's contributing to this wonderful mood? 🎉",
      "How wonderful that you're experiencing joy today! These positive moments are precious. Tell me more about what's making you feel so good! 🌈"
    ]
    return `${base}: ${responses[Math.floor(Math.random() * responses.length)]}`
  }
  
  // Neutral/mixed sentiment responses - varied contextual responses
  const neutralResponses = [
    "I'm with you. Tell me a bit more about what's on your mind.",
    "Thank you for sharing that with me. I'm here to support you no matter how you're feeling. 🌸",
    "I appreciate you checking in with yourself and sharing where you're at. I'm here to sit with whatever you're experiencing. 🌿",
    "Thank you for being honest about where you are emotionally. I'm here with you. ☁️"
  ]
  
  // Context-aware neutral responses
  if (lowerText.includes('hey') || lowerText.includes('hi') || lowerText.includes('hello')) {
    return `${base}: Hi! I'm here for you. How are you feeling today? 🌟`
  }
  if (lowerText.length < 10 && !lowerText.includes('not')) {
    // Very short messages that aren't explicitly negative
    return `${base}: ${neutralResponses[Math.floor(Math.random() * neutralResponses.length)]}`
  }
  
  return `${base}: ${neutralResponses[Math.floor(Math.random() * neutralResponses.length)]}`
}

const suggestions = [
  'I feel overwhelmed by studies',
  'Can we do a 3-minute breathing?',
  'I slept well and felt calmer today',
  'Teach me grounding 5-4-3-2-1',
]

export default function Chat(){
  const { bot } = useParams()
  const pick = (bot === 'eve' ? 'eve' : 'adem') as 'adem'|'eve'
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{
    from:'bot',
    text: `${pick==='adem'?'🧠 Adem':'🌿 Eve'}: Hi! I’m here, what’s up?`,
    ts: Date.now()
  }])
  const [crisis, setCrisis] = useState<string | null>(null)
  const { user } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Activities (inspired by MentalWellness flow)
  type Phase = 'greeting'|'watching'|'meditating'|'post-video'|'post-meditation'|'complete'
  const [phase, setPhase] = useState<Phase>('greeting')
  const [showVideos, setShowVideos] = useState(false)
  const [videoIds, setVideoIds] = useState<string[]>([])
  const [showBreathing, setShowBreathing] = useState(false)
  const [completed, setCompleted] = useState({ videos: false, meditation: false })

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:'smooth', block: 'end' }) }, [msgs, typing])
  useEffect(()=>{ inputRef.current?.focus() }, [])

  const canSend = input.trim().length > 0

  async function send(textFromSuggestion?: string){
    const raw = typeof textFromSuggestion === 'string' ? textFromSuggestion : input
    if (!raw.trim()) return
    const text = raw.trim()
    setMsgs(m => [...m, { from:'user', text, ts: Date.now() }])
    setInput('')

    // CRITICAL: Check for crisis FIRST and stop processing immediately
    if (isCrisis(text)) {
      setCrisis(text)
      setTyping(false)
      // Send immediate crisis response
      setMsgs(m => [...m, { 
        from:'bot', 
        text: `${pick==='adem'?'🧠 Adem':'🌿 Eve'}: I'm really concerned about what you just shared. Your life has value, and I want you to get the support you need right now. Please stay with me—help is available. 💙`, 
        ts: Date.now() 
      }])
      return // Stop all further processing
    }

    // bot typing indicator
    setTyping(true)

    try {
      // Analyze sentiment using Gradio model
      const sentimentResult = await analyzeSentiment(text)
      const s = sentimentResult

      // If user is mid-activity, avoid generic replies to every message
      if (phase === 'watching' || phase === 'meditating'){
        setTyping(false)
        return
      }

      // If user seems down, offer a gentle activity automatically (single response)
      const canOffer = (phase === 'greeting' || phase === 'post-video' || phase === 'post-meditation') && !showVideos && !showBreathing
      if (s.label === 'negative' && canOffer){
        const pickVideos = Math.random() < 0.75
        if (pickVideos){
          const vids = videosForMood('negative')
          setVideoIds(vids)
          setShowVideos(true)
          setPhase('watching')
          setMsgs(m => [...m, { from:'bot', text: `${pick==='adem'?'🧠 Adem':'🌿 Eve'}: I picked a few soothing videos. Watch for a couple of minutes and tell me how you feel.`, ts: Date.now() }])
        } else {
          setShowBreathing(true)
          setPhase('meditating')
          setMsgs(m => [...m, { from:'bot', text: `${pick==='adem'?'🧠 Adem':'🌿 Eve'}: Let's try a short guided breathing. When you're done, tap "I'm done".`, ts: Date.now() }])
        }
        setTyping(false)
        return
      }

      // Generate response using Gemini API (with fallback to botReply)
      try {
        const botResponse = await generateChatResponse(text, s.label, pick)
        setMsgs(m => [...m, { from:'bot', text: botResponse, ts: Date.now() }])
      } catch (error) {
        // Fallback to botReply if API fails
        console.error('Chat response generation failed:', error)
        setMsgs(m => [...m, { from:'bot', text: botReply(pick, text), ts: Date.now() }])
      }
    } catch (error) {
      // Fallback to keyword-based sentiment if API fails
      console.error('Sentiment analysis failed:', error)
      const fallbackSentiment = sentimentScore(text)
      const botResponse = botReply(pick, text)
      setMsgs(m => [...m, { from:'bot', text: botResponse, ts: Date.now() }])
    } finally {
      setTyping(false)
    }
  }

  function closeCrisis(){ setCrisis(null) }

  const headerIcon = pick==='adem' ? '🧠' : '🌿'
  const headerName = pick==='adem' ? 'Adem' : 'Eve'

  // Activity handlers -------------------------------------------------------
  function completeVideos(watchedAll:boolean){
    setShowVideos(false)
    setCompleted(c=>({ ...c, videos: true }))
    setPhase('post-video')
    setMsgs(m => [...m, { from:'bot', text: `${pick==='adem'?'🧠 Adem':'🌿 Eve'}: Nice work. How are you feeling now?`, ts: Date.now() }])

    // Combo completion message
    if (completed.meditation){
      setTimeout(()=>{
        setMsgs(m => [...m, { from:'bot', text: `${pick==='adem'?'🧠 Adem':'🌿 Eve'}: You've completed both activities! You're taking such good care of yourself. ✨`, ts: Date.now() }])
      }, 1200)
    }
  }

  function completeBreathing(){
    setShowBreathing(false)
    setCompleted(c=>({ ...c, meditation: true }))
    setPhase('post-meditation')
    setMsgs(m => [...m, { from:'bot', text: `${pick==='adem'?'🧠 Adem':'🌿 Eve'}: Proud of you for trying that. How do you feel now?`, ts: Date.now() }])

    if (completed.videos){
      setTimeout(()=>{
        setMsgs(m => [...m, { from:'bot', text: `${pick==='adem'?'🧠 Adem':'🌿 Eve'}: You've completed both activities! You're taking such good care of yourself. 🌟`, ts: Date.now() }])
      }, 1200)
    }
  }

  function onMoodCheck(choice:'good'|'okay'|'bad'){
    if (choice === 'bad'){
      setPhase('greeting')
      setMsgs(m => [...m, { from:'bot', text: `${pick==='adem'?'🧠 Adem':'🌿 Eve'}: Thanks for being honest. We can try something else together, or just talk. I’m here.`, ts: Date.now() }])
      return
    }
    setPhase('complete')
    setMsgs(m => [...m, { from:'bot', text: `${pick==='adem'?'🧠 Adem':'🌿 Eve'}: I’m glad that helped even a little. I’m always here when you need me.`, ts: Date.now() }])
  }

  return (
    <div className="relative max-w-3xl mx-auto">
      {/* ambient gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_120%_-10%,theme(colors.indigo.300/15),transparent),radial-gradient(60rem_40rem_at_-10%_0%,theme(colors.cyan.300/12),transparent)]" />

      {/* chat card */}
      <section className="card rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-0 overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white text-lg shadow">{headerIcon}</span>
            <div>
              <h3 className="font-semibold leading-tight">{headerName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Empathetic companion • responses may be AI-generated</p>
            </div>
          </div>
        </div>

        {/* messages */}
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
                <div className={
                  'px-3 py-2 rounded-2xl shadow-sm ' +
                  (m.from==='user'
                    ? 'bg-forest-100 dark:bg-forest-900/30'
                    : 'bg-slate-100 dark:bg-slate-800/80')
                }>
                  <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* typing indicator */}
          <AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="max-w-[82%]"
              >
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

        {/* activities (videos / breathing) */}
        {(showVideos || showBreathing || ((phase==='post-video'||phase==='post-meditation') && !showVideos && !showBreathing)) && (
          <div className="px-4 md:px-6 pb-2">
            {showVideos && (
              <div className="mb-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 p-3">
                <h4 className="font-semibold mb-2">Soothing videos</h4>
                <div className="grid md:grid-cols-3 gap-2">
                  {videoIds.map(id => (
                    <div key={id} className="aspect-video rounded-xl overflow-hidden border">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube-nocookie.com/embed/${id}`}
                        title="YouTube video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-end">
                  <button className="btn btn-primary" onClick={()=>completeVideos(true)}>I’m done</button>
                </div>
              </div>
            )}

            {showBreathing && (
              <div className="mb-3">
                <BreathingWidget />
                <div className="mt-2 flex justify-end">
                  <button className="btn btn-primary" onClick={completeBreathing}>I’m done</button>
                </div>
              </div>
            )}

            {(phase==='post-video'||phase==='post-meditation') && !showVideos && !showBreathing && (
              <div className="mb-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 p-3">
                <h4 className="font-semibold mb-2">How do you feel now?</h4>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-outline" onClick={()=>onMoodCheck('good')}>😊 Better</button>
                  <button className="btn btn-outline" onClick={()=>onMoodCheck('okay')}>😐 Okay</button>
                  <button className="btn btn-outline" onClick={()=>onMoodCheck('bad')}>😔 Still down</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* input */}
        <div className="px-4 md:px-6 pb-4">
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="chat-input">Type how you feel</label>
            <input
              id="chat-input"
              ref={inputRef}
              className="flex-1 border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50"
              placeholder="Type how you feel..."
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if (e.key==='Enter') send() }}
              aria-label="Type how you feel"
            />
            <button
              onClick={()=>send()}
              className="btn btn-primary inline-flex items-center gap-2"
              disabled={!canSend}
              aria-disabled={!canSend}
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </div>

          {/* smart suggestions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={()=>send(s)}
                className="text-xs rounded-full border border-slate-200/60 dark:border-slate-800/60 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              >{s}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Crisis modal */}
      <AnimatePresence>
        {crisis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            aria-live="assertive"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              className="card max-w-md w-full rounded-2xl border border-amber-300/40 bg-amber-50/70 text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-200 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> You matter. Let’s get support.
                </h3>
                <button className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5" onClick={closeCrisis} aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-amber-900/90 dark:text-amber-200/90 mt-1">Your message suggests you might be in distress. Consider reaching out to someone you trust or local emergency services immediately.</p>

              {user?.lovedOnes?.length ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm">Send a WhatsApp message to:</p>
                  {user.lovedOnes.map((l,i)=> (
                    <a key={i} className="block px-3 py-2 rounded-xl border hover:bg-amber-100/40 dark:hover:bg-amber-900/20" target="_blank" rel="noreferrer noopener"
                      href={waLink(l.whatsapp, `This is ${user.name}. I need support right now. Can we talk?`)}>
                      <span className="inline-flex items-center gap-2"><HeartHandshake className="h-4 w-4" /> {l.name}</span> <span className="text-xs opacity-70">({l.whatsapp})</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-900/90 dark:text-amber-200/90 mt-3">Add loved‑one contacts in your Dashboard to enable quick alerts.</p>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <a className="px-3 py-2 rounded-xl border btn-outline inline-flex items-center gap-2" href="tel:112">
                  <PhoneCall className="h-4 w-4" /> Call emergency (112)
                </a>
                <button className="btn btn-primary" onClick={closeCrisis}>I’m safe</button>
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
