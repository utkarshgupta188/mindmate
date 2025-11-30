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
