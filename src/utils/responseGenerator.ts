import { analyzeSentiment } from './hfSentiment'
import { analyzeTextEmotion, mapEmotionToVA } from './hfEmotion'
import { mapEmotionToValenceArousal, DeepfaceEmotion } from './emotionMap'
import { getMotivation } from './motivation'
import { getSafeJoke } from './jokes'
import { getAsciiBanner } from './ascii'
import { computeStressValue } from './stressCalculator'
import { decideRoute } from './coachRouter'
import { generateReply } from './dialogOrchestrator'
import { buildSystemPrompt } from './systemPrompt'
import { chatGemini } from './gemini'
import { chatLocal } from './localLLM'
import { humanizeResponse } from './textPost'
import { Msg } from '../components/chat/MessageList'
import { OnboardingAnswers } from './onboarding'

export async function generateResponse(
    text: string,
    msgs: Msg[],
    currentUserMsg: Msg,
    webEmotion: { label?: DeepfaceEmotion; confidence?: number } | null,
    onboarding: OnboardingAnswers | null,
    baseLabel: string,
    emitStress: (val: number) => void
): Promise<string> {
    const withCurrent = [...msgs, currentUserMsg]
    const lastCoach = withCurrent.slice(-6).map(m => ({ role: (m.from === 'user' ? 'user' : 'bot') as 'user' | 'bot', text: m.text }))
    const route = decideRoute(text, lastCoach)

    const sent = await analyzeSentiment(text)
    const conf = typeof (sent as any).confidence === 'number' ? (sent as any).confidence : 0.6
    const profane = /(fuck|bitch|asshole|bastard|stupid|idiot|madarchod|mc|bc|screw you|shut up)/i.test(text)
    const hfEmo = await analyzeTextEmotion(text)
    const va = mapEmotionToVA(hfEmo.label)
    const arousal = va.arousal
    const webVA = webEmotion?.label ? mapEmotionToValenceArousal(webEmotion.label) : null
    const webcamHighNeg = webVA ? (webVA.valence === 'negative' && webVA.arousal === 'high') : false
    const humorAllowed = !profane && (sent.label !== 'negative' || (conf < 0.65 && arousal !== 'high')) && !webcamHighNeg
    const motTone = sent.label === 'positive' ? 'energizing' : sent.label === 'negative' ? (conf >= 0.75 ? 'gentle' : 'steady') : 'steady'
    const mot = getMotivation(motTone as any)
    const joke = humorAllowed ? await getSafeJoke({ category: sent.label === 'positive' ? 'Programming' : 'Misc' }) : null
    const banner = (sent.label === 'positive') ? await getAsciiBanner('You got this') : null

    // compute and emit a stress point
    try {
        const stressValue = computeStressValue(sent.label as string | undefined, conf, arousal as string | undefined, webVA, webEmotion?.confidence)
        emitStress(stressValue)
    } catch (e) {
        console.warn('emitStress failed', e)
    }

    const hasGemini = !!(import.meta as any).env?.VITE_GEMINI_API_KEY
    const useLocal = ((import.meta as any).env?.VITE_LOCAL_LLM === 'true') || !!(import.meta as any).env?.VITE_LOCAL_LLM_PATH

    if (route === 'hf') {
        const planned = await generateReply(text, lastCoach)
        if (hasGemini || useLocal) {
            const system = buildSystemPrompt({ botLabel: baseLabel, sentiment: { label: sent.label as any, confidence: conf }, crisis: false, humorAllowed, arousal })
            const contextExtras = [
                `Context meta: sentiment=${sent.label} confidence=${conf.toFixed(2)} humorAllowed=${humorAllowed}`,
                hfEmo.label ? `Emotion (HF): ${hfEmo.label}${(hfEmo.scores?.[0]?.score != null) ? ` (${Math.round((hfEmo.scores![0]!.score) * 100)}%)` : ''}` : '',
                onboarding ? `User prefs: goal=${onboarding.goal || 'n/a'} style=${onboarding.style || 'n/a'} humor=${onboarding.humor || 'n/a'} grounding=${onboarding.grounding || 'n/a'}` : '',
                webEmotion?.label ? `Observed emotion (webcam): ${webEmotion.label}${webEmotion.confidence ? ` (${Math.round(webEmotion.confidence * 100)}%)` : ''}` : '',
                mot ? `Motivation: ${mot}` : '',
                joke ? `Joke: ${joke}` : '',
                banner ? `Banner:\n${banner}` : ''
            ].filter(Boolean).join('\n\n')
            try {
                const payloadText = `User said: \"${text}\"\n\nPlan suggestions for you to adapt:\n${planned.text}\n\n${contextExtras}\n\nRespond directly to the user in a warm tone.`
                const history = withCurrent.slice(-4).map(m => ({ role: (m.from === 'user' ? 'user' : 'model') as 'user' | 'model', text: m.text }))
                const humanized = hasGemini
                    ? await chatGemini(payloadText, history, { system })
                    : await chatLocal(payloadText, history, { system })
                return humanizeResponse(humanized)
            } catch {
                return planned.text
            }
        } else {
            return planned.text
        }
    } else {
        if (hasGemini || useLocal) {
            try {
                const directSystem = buildSystemPrompt({ botLabel: baseLabel, sentiment: { label: sent.label as any, confidence: conf }, crisis: false, humorAllowed, arousal })
                const context = [
                    `Context meta: sentiment=${sent.label} confidence=${conf.toFixed(2)} humorAllowed=${humorAllowed}`,
                    hfEmo.label ? `Emotion (HF): ${hfEmo.label}${(hfEmo.scores?.[0]?.score != null) ? ` (${Math.round((hfEmo.scores![0]!.score) * 100)}%)` : ''}` : '',
                    onboarding ? `User prefs: goal=${onboarding.goal || 'n/a'} style=${onboarding.style || 'n/a'} humor=${onboarding.humor || 'n/a'} grounding=${onboarding.grounding || 'n/a'}` : '',
                    webEmotion?.label ? `Observed emotion (webcam): ${webEmotion.label}${webEmotion.confidence ? ` (${Math.round((webEmotion.confidence * 100))}%)` : ''}` : '',
                    mot ? `Motivation: ${mot}` : '',
                    joke ? `Joke: ${joke}` : '',
                    banner ? `Banner:\n${banner}` : '',
                    `You may suggest opening /games for a 2-minute breathing or grounding exercise when appropriate.`
                ].filter(Boolean).join('\n\n')
                const history = withCurrent.slice(-6).map(m => ({ role: (m.from === 'user' ? 'user' : 'model') as 'user' | 'model', text: m.text }))
                const gReply = hasGemini
                    ? await chatGemini(`${context}\n\nUser: ${text}`, history, { system: directSystem })
                    : await chatLocal(`${context}\n\nUser: ${text}`, history, { system: directSystem })
                return humanizeResponse(gReply)
            } catch {
                const planned = await generateReply(text, lastCoach)
                return planned.text
            }
        } else {
            const planned = await generateReply(text, lastCoach)
            return planned.text
        }
    }
}
