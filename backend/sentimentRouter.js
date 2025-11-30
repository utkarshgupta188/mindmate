// backend/sentimentRouter.js
import express from 'express'
import fetch from 'node-fetch'

const router = express.Router()

// Gradio model endpoint - can be overridden by environment variable
const GRADIO_URL = process.env.VITE_HF_SPACE_URL || process.env.HF_SPACE_URL || 'https://unknownhackerr-mental-health-beta16.hf.space'

/**
 * Analyze sentiment using Gradio model
 * POST /api/sentiment
 * Body: { text: string }
 * Returns: { label: 'negative'|'neutral'|'positive', confidence?: number }
 */
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' })
    }

    const response = await callGradioApi(text)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('Gradio API error:', response.status, response.statusText, errorText)
      console.log('Falling back to keyword-based sentiment analysis')
      // Fallback to keyword-based sentiment
      return res.json({
        label: fallbackSentiment(text),
        source: 'fallback'
      })
    }

    const result = await response.json()

    console.log('Gradio API response for:', text.substring(0, 50), 'Result:', JSON.stringify(result))

    // Gradio returns data in format: { data: [prediction] }
    // The prediction could be a string or object
    let sentimentLabel = 'neutral'
    if (result.data && result.data.length > 0) {
      const prediction = result.data[0]

      // Handle string response (e.g., "positive", "negative", "neutral")
      if (typeof prediction === 'string') {
        const lower = prediction.toLowerCase().trim()
        if (lower.includes('negative') || lower.includes('depressed') || lower.includes('sad') || lower === 'neg') {
          sentimentLabel = 'negative'
        } else if (lower.includes('positive') || lower.includes('happy') || lower.includes('good') || lower === 'pos') {
          sentimentLabel = 'positive'
        } else if (lower.includes('neutral') || lower === 'neu') {
          sentimentLabel = 'neutral'
        }
      }
      // Handle object response (e.g., { label: "positive", confidence: 0.95 })
      else if (typeof prediction === 'object' && prediction !== null) {
        if (prediction.label) {
          const label = String(prediction.label).toLowerCase()
          sentimentLabel = label.includes('negative') ? 'negative' :
            label.includes('positive') ? 'positive' : 'neutral'
        } else if (prediction.sentiment) {
          const label = String(prediction.sentiment).toLowerCase()
          sentimentLabel = label.includes('negative') ? 'negative' :
            label.includes('positive') ? 'positive' : 'neutral'
        }
      }

      console.log('Parsed sentiment from Gradio:', sentimentLabel)
    } else {
      console.warn('Unexpected Gradio response format:', result)
    }

    res.json({
      label: sentimentLabel,
      source: 'gradio',
      raw: result.data // Include raw data for debugging
    })

  } catch (error) {
    console.error('Sentiment analysis error:', error.message)
    // Fallback to keyword-based sentiment
    const label = fallbackSentiment(req.body.text || '')
    res.json({
      label,
      source: 'fallback',
      error: error.message
    })
  }
})

/**
 * Generate chat response using Gemini API based on sentiment
 * POST /api/chat/respond
 * Body: { text: string, sentiment: 'negative'|'neutral'|'positive', botName: 'adem'|'eve' }
 */
router.post('/chat/respond', async (req, res) => {
  try {
    const { text, sentiment, botName = 'adem' } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY

    if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
      // Return fallback response if Gemini not configured
      return res.json({
        response: getFallbackResponse(text, sentiment, botName),
        source: 'fallback'
      })
    }

    // Build prompt based on sentiment
    const base = botName === 'adem' ? '🧠 Adem' : '🌿 Eve'
    let prompt = ''

    if (sentiment === 'negative') {
      prompt = `You are ${base}, a compassionate mental wellness assistant. The user said: "${text}". They seem to be feeling down. Respond with empathy and support. Keep your response under 100 words, be caring, and offer helpful suggestions. Use natural, conversational language with appropriate emojis.`
    } else if (sentiment === 'positive') {
      prompt = `You are ${base}, a friendly mental wellness assistant. The user said: "${text}". They seem to be feeling good! Respond with genuine enthusiasm and positivity. Ask them about what's making them feel good and keep the conversation uplifting. Keep your response under 100 words and use appropriate emojis.`
    } else {
      prompt = `You are ${base}, a supportive mental wellness assistant. The user said: "${text}". Respond in a warm, supportive way. Be present with whatever they're feeling and offer to listen. Keep your response under 100 words and be conversational with gentle emojis.`
    }

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', geminiResponse.status, errorText)
      throw new Error('Gemini API failed')
    }

    const geminiData = await geminiResponse.json()
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      getFallbackResponse(text, sentiment, botName)

    res.json({
      response: responseText.trim(),
      source: 'gemini'
    })

  } catch (error) {
    console.error('Chat response error:', error.message)
    res.json({
      response: getFallbackResponse(req.body.text || '', req.body.sentiment || 'neutral', req.body.botName || 'adem'),
      source: 'fallback',
      error: error.message
    })
  }
})

// Fallback sentiment analysis (keyword-based)
function fallbackSentiment(text) {
  const t = text.toLowerCase()

  // CRISIS WORDS - These should trigger immediate crisis response
  const CRISIS = ['suicide', 'kill myself', 'end my life', 'want to die', 'wanna die',
    "don't want to live", "dont want to live", 'dying', 'im dying', "i'm dying",
    'end it all', 'give up', 'hurt myself', 'take my life', 'wish i was dead']

  // Check for crisis words first
  for (const word of CRISIS) {
    if (t.includes(word)) {
      return 'negative' // Return negative but crisis detection should catch this first
    }
  }

  const NEG = ['sad', 'depressed', 'anxious', 'stress', 'tired', 'angry', 'bad', 'hate', 'worthless', 'hopeless', 'awful', 'terrible', 'upset', 'hurt', 'pain', 'lonely', 'worried', 'overwhelmed', 'miserable', 'unhappy', 'not okay', 'not feeling', 'not good']
  const POS = ['happy', 'calm', 'excited', 'love', 'grateful', 'hopeful', 'proud', 'good', 'joy', 'great', 'wonderful', 'amazing', 'delighted', 'thrilled', 'peaceful', 'content', 'confident', 'energetic', 'bright', 'cheerful']

  let score = 0
  NEG.forEach(w => { if (t.includes(w)) score -= 1 })
  POS.forEach(w => { if (t.includes(w)) score += 1 })

  return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
}

// Fallback response generator
/**
 * Helper to call Gradio API with fallback endpoints
 */
async function callGradioApi(text) {
  // Try /run/predict first (standard Gradio HTTP API)
  try {
    const response = await fetch(`${GRADIO_URL}/run/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [text]
      })
    })

    if (response.ok) return response

    // If 404, try alternative endpoint
    if (response.status === 404) {
      return await fetch(`${GRADIO_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [text],
          api_name: '/predict'
        })
      })
    }
    return response
  } catch (error) {
    // If fetch fails, try alternative endpoint
    try {
      return await fetch(`${GRADIO_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [text],
          api_name: '/predict'
        })
      })
    } catch (retryError) {
      throw new Error(`Gradio API unavailable: ${error.message}`)
    }
  }
}

function getFallbackResponse(text, sentiment, botName) {
  const base = botName === 'adem' ? '🧠 Adem' : '🌿 Eve'
  const lowerText = text.toLowerCase()

  if (sentiment === 'negative') {
    if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('down')) {
      return `${base}: I'm really sorry you're feeling this way. It takes courage to share your feelings. I'm here to listen and support you. 💙`
    }
    if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('stressed')) {
      return `${base}: I can sense that anxiety is weighing on you right now. That's such a heavy feeling to carry. I'm here to help. 🌿`
    }
    return `${base}: I hear you. That sounds heavy. Want to try a 3-minute breathing exercise together? You're not alone.`
  }

  if (sentiment === 'positive') {
    return `${base}: Love that! What helped today? Let's note one thing to repeat tomorrow. ✨`
  }

  return `${base}: I'm with you. Tell me a bit more about what's on your mind. 🌸`
}

export { router as sentimentRouter }

