import type { SentimentLabel, SentimentScores } from './hfSentiment'
import { videosForMood } from './youtube'

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export type Recommendation = {
  label: SentimentLabel
  confidence: number
  level: ConfidenceLevel
  actions: {
    cure: string
    exercise: string
    videoId: string
    game: string
  }
}

export function toLevel(conf: number): ConfidenceLevel {
  if (conf >= 0.75) return 'high'
  if (conf >= 0.55) return 'medium'
  return 'low'
}

export function recommendFor(label: SentimentLabel, confidence: number, _scores?: SentimentScores): Recommendation {
  const level = toLevel(confidence)
  const vids = videosForMood(label)
  const videoId = vids[Math.floor(Math.random() * vids.length)] || ''

  if (label === 'negative') {
    if (level === 'high') {
      return {
        label, confidence, level,
        actions: {
          cure: 'Grounding 5‑4‑3‑2‑1 + message a trusted person',
          exercise: '3‑minute paced breathing (exhale longer)',
          videoId,
          game: '/games',
        },
      }
    }
    if (level === 'medium') {
      return {
        label, confidence, level,
        actions: {
          cure: 'Journal one worry → one next step',
          exercise: '10‑minute walk outdoors',
          videoId,
          game: '/games',
        },
      }
    }
    return {
      label, confidence, level,
      actions: {
        cure: 'Name the feeling + one thing in your control',
        exercise: '1‑minute box breathing (4‑4‑4‑4)',
        videoId,
        game: '/games',
      },
    }
  }

  if (label === 'neutral') {
    if (level === 'high') {
      return {
        label, confidence, level,
        actions: {
          cure: '2‑minute body scan (head → toes)',
          exercise: 'Light stretch + water break',
          videoId,
          game: '/games',
        },
      }
    }
    if (level === 'medium') {
      return {
        label, confidence, level,
        actions: {
          cure: 'Write one gratitude',
          exercise: 'Short walk or 10 squats',
          videoId,
          game: '/games',
        },
      }
    }
    return {
      label, confidence, level,
      actions: {
        cure: 'Label the mood (Neutral is okay)',
        exercise: '1‑minute breathing to center',
        videoId,
        game: '/games',
      },
    }
  }

  // positive
  if (level === 'high') {
    return {
      label, confidence, level,
      actions: {
        cure: 'Capture what worked today (habit stack)',
        exercise: 'Share a small win with a friend',
        videoId,
        game: '/games',
      },
    }
  }
  if (level === 'medium') {
    return {
      label, confidence, level,
      actions: {
        cure: 'Note 2 things to repeat tomorrow',
        exercise: '5‑minute nature walk',
        videoId,
        game: '/games',
      },
    }
  }
  return {
    label, confidence, level,
    actions: {
      cure: 'One gratitude + one intention',
      exercise: '1‑minute breathe and smile',
      videoId,
      game: '/games',
    },
  }
}
