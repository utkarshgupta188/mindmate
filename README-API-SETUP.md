# API Setup Instructions

## Gemini API Key Setup

1. Get your Gemini API key from: https://makersuite.google.com/app/apikey
2. Create a `.env.local` file in the project root
3. Add your API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```
4. Restart your dev server

## Gradio Model Integration

The chat now uses your Gradio model at `https://unknownhackerr-mental-health-beta16.hf.space/` for sentiment analysis.

### How it works:

1. **Sentiment Analysis**: Every user message is analyzed by your Gradio model to determine if it's negative, positive, or neutral
2. **Response Generation**: 
   - If Gemini API key is configured: Uses Gemini AI to generate contextual responses based on the sentiment
   - If no API key: Uses fallback responses that are still contextual and varied

### API Endpoints:

- `POST /api/sentiment/analyze` - Analyzes sentiment using Gradio model
  - Body: `{ text: string }`
  - Returns: `{ label: 'negative'|'neutral'|'positive', source: 'gradio'|'fallback' }`

- `POST /api/sentiment/chat/respond` - Generates chat response using Gemini
  - Body: `{ text: string, sentiment: 'negative'|'neutral'|'positive', botName: 'adem'|'eve' }`
  - Returns: `{ response: string, source: 'gemini'|'fallback' }`

### Testing:

You can test the sentiment analysis by sending messages in the chat. The system will:
1. Call your Gradio model to analyze sentiment
2. Use that sentiment to generate an appropriate response
3. Fall back to keyword-based analysis if Gradio is unavailable

### Troubleshooting:

- If Gradio model fails: The system automatically falls back to keyword-based sentiment analysis
- If Gemini API fails: The system uses contextual fallback responses
- Check the browser console and server logs for any errors

