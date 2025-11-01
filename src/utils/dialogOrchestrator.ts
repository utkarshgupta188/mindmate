// src/utils/dialogOrchestrator.ts

import { analyzeSentiment } from './hfSentiment';
import { getSafeJoke } from './jokes';
import { getMotivation } from './motivation';
import { getAsciiBanner } from './ascii';
import { estimateArousal } from './arousalValence';
import { isMentalHealthRelated } from './topicGate';
import { greetings, friendshipLines, pickRandom, positiveReplies, neutralReplies, negativeReplies, crisisReplies } from './responseTemplates'

type ChatHistory = { role: 'user' | 'bot'; text: string };

/**
 * Generates a "plan" for the bot to follow.
 * This plan is what gets "humanized" by Gemini.
 */
export async function generateReply(text: string, history: ChatHistory[]): Promise<{ text: string }> {
  try {
  const sentiment = await analyzeSentiment(text);
  const conf = typeof sentiment.confidence === 'number' ? sentiment.confidence : 0.6
  const arousal = estimateArousal(text)

    // Domain restriction: if not mental‑health related, provide a gentle boundary
    if (!isMentalHealthRelated(text)){
      return {
        text: `I'm here to support mental wellbeing—feelings, stress, sleep, motivation, and coping. If you'd like, tell me how you're feeling right now or what's been hardest today.`
      }
    }

    // 0) Greeting-first experience (only when the message is basically just a greeting)
    const trimmed = text.trim()
    const isGreetingBare = /^(hi|hello|hey|yo|hiya|sup|good\s*(morning|afternoon|evening))\s*[!.]*$/i.test(trimmed)
    const userTurns = history.filter(h => h.role === 'user').length
    if (isGreetingBare && userTurns === 0) {
      // Prefer a friendly greeting and a short friendship line
      const greet = pickRandom(greetings)
      const friend = Math.random() < 0.6 ? pickRandom(friendshipLines) : ''
      return { text: [greet, friend].filter(Boolean).join('\n\n') }
    }

    // 1) Topic-aware empathy (simple keyword cues)
  const t = text.toLowerCase()
    const jobLoss = /(fired|laid off|layoff|lost (my )?job|let go|terminated|pink\s*slip)/i.test(t)
    const dayOff = /(day off|off today|on leave|took (a )?day off|holiday|took leave)/i.test(t)
  const profane = /(fuck|bitch|asshole|bastard|stupid|idiot|madarchod|mc|bc|screw you|shut up)/i.test(t)

    // Prioritize topic-specific empathy regardless of base sentiment
    if (jobLoss) {
      return {
        text: [
          `Oh, that's incredibly tough news. I'm really sorry you're going through that.`,
          `Losing a job is a major life event, and feeling this way is completely understandable and valid. It can shake your routine and your sense of stability.`,
          `Please take a moment to just process that—there's no pressure to feel a certain way.`,
          `If you feel up to it, I'm here to listen. Would you like to talk more about what happened, or about how you're feeling right now?`,
          getMotivation('gentle'),
          `If a tiny step would help, we can try a 2‑minute breathing or grounding exercise in /games.`
        ].join('\n\n')
      }
    }

    if (sentiment.label === 'negative') {
      // Use template replies and personalize with motivation; keep humor gated
      const tone = conf >= 0.75 || arousal === 'high' ? 'gentle' : 'steady'
      const mot = getMotivation(tone as 'gentle'|'steady')
      const template = pickRandom(negativeReplies)
      const parts: string[] = [template, mot]
      if (!profane && conf < 0.65 && arousal !== 'high') {
        const joke = await getSafeJoke({ category: 'Misc' })
        if (joke) parts.push(`If a light moment helps, here's a quick one: ${joke}`)
      }
      if (profane) parts.unshift(`I want to help. I won't engage with insults, but I'm here for you if you want to talk about what's going on.`)
      parts.push(`We can also open /games for a 2‑minute breathing or grounding exercise.`)
      // Maybe add a friendship line to reinforce connection
      if (Math.random() < 0.4) parts.push(pickRandom(friendshipLines))
      return { text: parts.join('\n\n') }
    }

    if (sentiment.label === 'positive') {
      const template = pickRandom(positiveReplies)
      const mot = getMotivation('energizing')
      const pieces = [template]
      // prefer savoring or channeling based on arousal
      if (arousal === 'low') pieces.push(`If you feel peaceful, we can savor this moment—maybe note one small thing to remember.`)
      else if (arousal === 'high') pieces.push(`Want to channel that energy into one tiny step you care about?`)
      else pieces.push(mot)
      const joke = await getSafeJoke({ category: 'Programming' })
      if (joke) pieces.push(`For a smile: ${joke}`)
      const banner = await getAsciiBanner('You got this')
      if (banner) pieces.push(banner)
      pieces.push(`If you want to keep the momentum, pick a tiny activity in /games.`)
      // friendly reinforcement
      if (Math.random() < 0.5) pieces.push(pickRandom(friendshipLines))
      return { text: pieces.join('\n\n') }
    }

    if (dayOff) {
      return {
        text: [
          `A day off can mean different things—rest, reset, or just some space. How does it feel for you today?`,
          `If you want, we could pick one tiny thing to support the kind of day you want (a short stretch, a mindful pause, or just talking a bit).`
        ].join('\n\n')
      }
    }

    // Neutral or unclear
    {
      const mot = getMotivation('steady')
      const bits = [
        `Thanks for reaching out. What's on your mind today?`,
        mot
      ]
      // Reduce joke frequency in neutral to feel more human
      try {
        if (Math.random() < 0.45) {
          const joke = await getSafeJoke({ category: 'Misc' })
          if (joke) bits.push(`Would a light joke help? ${joke}`)
        }
      } catch {}
      bits.push(`We can also try a brief calming exercise together in /games.`)
      return { text: bits.join('\n\n') }
    }
  } catch (error) {
    console.error('Error in dialog orchestrator:', error)
    return {
      text: `I'm here with you. Would it help to start with a quick check-in on how you're feeling, or try a 3‑minute breathing exercise together?`
    }
  }
}
