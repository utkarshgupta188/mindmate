// src/utils/sentimentApi.ts
import { sentimentScore } from './sentiment'

export type SentimentResult = {
  label: 'negative' | 'neutral' | 'positive'
  source?: 'gradio' | 'fallback'
  confidence?: number
}

/**
 * Analyze sentiment using Gradio model (with fallback to keyword-based)
 */
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    const response = await fetch('/api/sentiment/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })

    if (!response.ok) {
      throw new Error('API request failed')
    }

    const result = await response.json()
    const source = result.source || 'gradio'
    console.log(`Sentiment analysis: ${result.label} (source: ${source})`)
    return {
      label: result.label || 'neutral',
      source: source,
      confidence: result.confidence
    }
  } catch (error) {
    console.error('Sentiment API error, using fallback:', error)
    // Fallback to keyword-based sentiment
    const fallback = sentimentScore(text)
    console.log(`Fallback sentiment: ${fallback.label}`)
    return {
      label: fallback.label,
      source: 'fallback'
    }
  }
}

/**
 * Generate chat response using Gemini API based on sentiment (with fallback)
 */
export async function generateChatResponse(
  userText: string,
  sentiment: 'negative' | 'neutral' | 'positive',
  botName: 'adem' | 'eve' = 'adem'
): Promise<string> {
  try {
    const response = await fetch('/api/sentiment/chat/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: userText,
        sentiment,
        botName
      })
    })

    if (!response.ok) {
      throw new Error('Chat API request failed')
    }

    const result = await response.json()
    return result.response || getFallbackResponse(userText, sentiment, botName)
  } catch (error) {
    console.error('Chat response API error, using fallback:', error)
    return getFallbackResponse(userText, sentiment, botName)
  }
}

// Fallback response generator (same as backend)
function getFallbackResponse(
  text: string,
  sentiment: 'negative' | 'neutral' | 'positive',
  botName: 'adem' | 'eve'
): string {
  const base = botName === 'adem' ? '🧠 Adem' : '🌿 Eve'
  const lowerText = text.toLowerCase()
  
  if (sentiment === 'negative') {
    if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('down')) {
      return `${base}: I'm really sorry you're feeling this way. It takes courage to share your feelings. I'm here to listen and support you. 💙`
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
    return `${base}: I hear you. That sounds heavy. Want to try a 3-minute breathing exercise together? You're not alone.`
  }
  
  if (sentiment === 'positive') {
    return `${base}: Love that! What helped today? Let's note one thing to repeat tomorrow. ✨`
  }
  
  if (lowerText.includes('hey') || lowerText.includes('hi') || lowerText.includes('hello')) {
    return `${base}: Hi! I'm here for you. How are you feeling today? 🌟`
  }
  
  return `${base}: I'm with you. Tell me a bit more about what's on your mind. 🌸`
}

