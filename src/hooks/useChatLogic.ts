import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRealtimeStress } from './useRealtimeStress'
import { isCrisis } from '../utils/crisis'
import { loadOnboarding, saveOnboarding, type OnboardingAnswers } from '../utils/onboarding'
import { isMentalHealthRelated } from '../utils/topicGate'
import { DeepfaceEmotion } from '../utils/emotionMap'
import { addOrUpdateSession, makeSessionId, summarizeTitle, type ChatSession } from '../utils/chatStore'
import { generateConversationReport } from '../utils/report'
import { Msg } from '../components/chat/MessageList'
import { CRISIS_REGEX, getCrisisResponse, handleExpressionQuery, handleTopicGating, checkAutoResponse, emitReportStress } from '../utils/chatHelpers'
import { generateResponse } from '../utils/responseGenerator'

type Pending = { kind: 'typing'; ts: number } | null

export function useChatLogic() {
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

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs, typing])
    useEffect(() => { inputRef.current?.focus() }, [])

    useEffect(() => {
        checkAutoResponse(moodTrail, webEmotion, cameraApiHealthy, lastAutoRespond, baseLabel, setMsgs, setLastAutoRespond)
    }, [moodTrail, webEmotion, lastAutoRespond, baseLabel, cameraApiHealthy])

    async function send(textFromSuggestion?: string) {
        if (!onboarding) return
        const raw = typeof textFromSuggestion === 'string' ? textFromSuggestion : input
        if (!raw.trim()) return
        const text = raw.trim()
        const now = Date.now()
        const currentUserMsg = { from: 'user' as const, text, ts: now }
        setMsgs(m => [...m, currentUserMsg])
        setInput('')

        if (isCrisis(text)) setCrisis(text)

        setTyping(true)
        setPending({ kind: 'typing', ts: Date.now() })
        try {
            const base = baseLabel
            const urgentCrisis = isCrisis(text) || CRISIS_REGEX.test(text)

            if (urgentCrisis) {
                const reply = getCrisisResponse(base)
                setMsgs(m => [...m, { from: 'bot', text: reply, ts: Date.now() }])
                setCrisis(text)
                return
            }

            if (handleExpressionQuery(text, base, webEmotion, setMsgs)) return

            const hasGemini = !!(import.meta as any).env?.VITE_GEMINI_API_KEY
            const useLocal = ((import.meta as any).env?.VITE_LOCAL_LLM === 'true') || !!(import.meta as any).env?.VITE_LOCAL_LLM_PATH

            if (!isMentalHealthRelated(text)) {
                const lastBot = msgs.slice().reverse().find(m => m.from === 'bot')
                const boundary = `${base}: I’m here to support mental wellbeing—feelings, stress, sleep, motivation, and coping.\n\nI can’t help with that topic, but if you’d like, tell me how you’re feeling right now or what’s been hardest today.`

                if (lastBot && lastBot.text?.trim() === boundary.trim()) {
                    setMsgs(m => [...m, { from: 'bot', text: `${base}: Okay — I hear you. I’m here if you want to talk later.`, ts: Date.now() }])
                    return
                }

                await handleTopicGating(text, base, hasGemini, useLocal, setMsgs)
                return
            }

            const responseText = await generateResponse(
                text,
                msgs,
                currentUserMsg,
                webEmotion,
                onboarding,
                base,
                emitStress
            )
            setMsgs(m => [...m, { from: 'bot', text: responseText, ts: Date.now() }])

            if ((/suicid|kill|end it|hopeless|worthless|i'm done|im done|done with life/i.test(text))) {
                setCrisis(text)
            }
        } catch {
            const base = baseLabel
            setMsgs(m => [...m, { from: 'bot', text: `${base}: I’m here. Let’s try a 3-minute breathing exercise together? If you’d like, open Games for a calming start.`, ts: Date.now() }])
        } finally {
            setTyping(false)
            setPending(null)
        }
    }

    function handleTranscript(t: string) {
        const trimmed = t.trim()
        if (!trimmed) return
        if (!isMentalHealthRelated(trimmed)) {
            const base = baseLabel
            const boundary = [
                `${base}: I’m here to support mental wellbeing—feelings, stress, sleep, motivation, and coping.`,
                `I can’t help with that topic via voice, but if you’d like, tell me how you’re feeling right now.`
            ].join('\n\n')
            setMsgs(m => [...m, { from: 'bot', text: boundary, ts: Date.now() }])
            return
        }
        if (isCrisis(trimmed)) {
            setMsgs(m => [...m, { from: 'user', text: trimmed, ts: Date.now() }])
            setCrisis(trimmed)
            return
        }
        if (sttAutoSend) send(trimmed)
        else setInput(trimmed)
    }

    useEffect(() => { /* TTS speak last bot message */
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
        return () => { try { const s: any = (window as any).speechSynthesis; s?.cancel() } catch { } }
    }, [msgs])

    function speakMessage(text: string) {
        try {
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
        } catch (e) { }
    }

    async function closeChatAndReport() {
        if (closing) return
        setClosing(true)
        try {
            const transcript = msgs.map(m => `${m.from === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n')
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

            emitReportStress(report, emitStress)

            // Navigate to Reports page
            navigate('/reports')
        } catch (e) {
            // If something goes wrong, still navigate to reports so the user can see existing ones
            navigate('/reports')
        } finally {
            setClosing(false)
        }
    }

    return {
        input, setInput,
        typing,
        closing,
        msgs, setMsgs,
        crisis, setCrisis,
        onboarding, setOnboarding,
        user,
        bottomRef,
        inputRef,
        webEmotion, setWebEmotion,
        moodTrail, setMoodTrail,
        ttsEnabled, setTtsEnabled,
        sttAutoSend,
        voiceActive, setVoiceActive,
        cameraApiHealthy, setCameraApiHealthy,
        showYolo, setShowYolo,
        send,
        handleTranscript,
        speakMessage,
        closeChatAndReport,
        YOLO_ENABLED,
        TALK_ENABLED,
        baseLabel
    }
}
