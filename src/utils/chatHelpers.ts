import { isCrisis } from './crisis'
import { chatGemini } from './gemini'
import { chatLocal } from './localLLM'
import { buildSystemPrompt } from './systemPrompt'
import { humanizeResponse } from './textPost'
import { Msg } from '../components/chat/MessageList'

export const CRISIS_REGEX = /(suicid|kill myself|end my life|want to die|i want to die|i will kill myself|i am going to kill myself|self[- ]?harm|cut myself|jump off|can'?t go on|ending it|end it all|life isn'?t worth)/i

export function getCrisisResponse(base: string) {
    return [
        `${base}: I'm taking what you said very seriously. It sounds like you're in a lot of pain, and I'm genuinely worried about you.`,
        `Your safety is the most important thing. You are not alone, and there are people who can help you right now.`,
        `Please reach out to one of these 24/7, free resources in India (call or text):`,
        `• Emergency — Call 112`,
        `• KIRAN Mental Health Helpline — 1800-599-0019 (24×7, toll-free)`,
        `• AASRA — +91-22-27546669 (24×7)`,
        `• Vandrevala Foundation — +91-9999-666-555`,
        `If any number doesn’t connect, please try again or search “India suicide helpline” for the latest options. I’m still here with you.`,
    ].join('\n\n')
}

export function handleExpressionQuery(
    text: string,
    base: string,
    webEmotion: { label?: string; confidence?: number } | null,
    setMsgs: React.Dispatch<React.SetStateAction<Msg[]>>
): boolean {
    if (/\b(what'?s|whats) my expression\b|\bmy expression\b/i.test(text)) {
        if (webEmotion?.label) {
            const pct = webEmotion.confidence ? ` (${Math.round(webEmotion.confidence * 100)}%)` : ''
            setMsgs(m => [...m, { from: 'bot', text: `${base}: From the webcam, I’m seeing "${webEmotion.label}"${pct}. You can turn tracking off anytime from the header.`, ts: Date.now() }])
        } else {
            setMsgs(m => [...m, { from: 'bot', text: `${base}: I don’t have a recent webcam reading. If you allow camera access (top-right) and keep the window in view, I can estimate expressions on-device.`, ts: Date.now() }])
        }
        return true
    }
    return false
}

export async function handleTopicGating(
    text: string,
    base: string,
    hasGemini: boolean,
    useLocal: boolean,
    setMsgs: React.Dispatch<React.SetStateAction<Msg[]>>
): Promise<boolean> {
    const boundary = [
        `${base}: I’m here to support mental wellbeing—feelings, stress, sleep, motivation, and coping.`,
        `I can’t help with that topic, but if you’d like, tell me how you’re feeling right now or what’s been hardest today.`
    ].join('\n\n')

    if (hasGemini || useLocal) {
        try {
            const system = buildSystemPrompt({ botLabel: base, sentiment: { label: 'neutral' as any, confidence: 0.95 }, crisis: false, humorAllowed: false, arousal: 'low' as any })
            const prompt = `Rephrase the following concise, firm but friendly boundary message so it sounds warm and human, without adding new instructions or resources. Keep it short:\n\n${boundary}`
            const humanized = hasGemini
                ? await chatGemini(prompt, [], { system })
                : await chatLocal(prompt, [], { system })
            setMsgs(m => [...m, { from: 'bot', text: humanizeResponse(humanized || boundary), ts: Date.now() }])
            return true
        } catch (e) {
        }
    }
    setMsgs(m => [...m, { from: 'bot', text: boundary, ts: Date.now() }])
    return true
}

export function checkAutoResponse(
    moodTrail: string[],
    webEmotion: { label?: string; confidence?: number } | null,
    cameraApiHealthy: boolean | null,
    lastAutoRespond: number | null,
    baseLabel: string,
    setMsgs: React.Dispatch<React.SetStateAction<Msg[]>>,
    setLastAutoRespond: React.Dispatch<React.SetStateAction<number | null>>
) {
    try {
        if (!moodTrail.length || !webEmotion?.label) return
        if (cameraApiHealthy === false) return
        const negSet = new Set(['sad', 'angry', 'fear', 'disgust'])
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
}

export function emitReportStress(
    report: any,
    emitStress: (val: number) => void
) {
    try {
        if (report?.points && Array.isArray(report.points) && report.points.length) {
            for (const p of report.points) {
                // emit each stored point
                emitStress(p.value)
            }
        } else if (report?.stressLevel) {
            // fallback: map label to a single value and emit
            const mapLabelToValue = (label?: string) => {
                const l = (label || '').toLowerCase()
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
}
