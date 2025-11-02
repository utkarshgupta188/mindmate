// src/utils/coachRouter.ts

type ChatHistory = { role: 'user' | 'bot'; text: string };

/**
 * Decides how to route the user's input.
 * - 'hf': Route to the full analysis pipeline (Sentiment -> Suggestions -> Gemini)
 * - 'direct': Route directly to the conversational Gemini model
 */
export function decideRoute(text: string, history: ChatHistory[]): 'hf' | 'direct' {
  const lowerText = text.toLowerCase();
  
  // 1. Check for specific "task" keywords that need the HF pipeline
  const taskKeywords = [
    'i feel', 'i am feeling', 'sad', 'anxious', 'stressed', 
    'depressed', 'overwhelmed', 'lonely', 'empty', 'hopeless',
    'angry', 'frustrated', 'i need help', 'recommend me', 'what should i do'
  ];
  
  if (taskKeywords.some(kw => lowerText.includes(kw))) {
    return 'hf';
  }

  // 2. Check if it's a simple, conversational follow-up
  const simpleChat = [
    'hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'cool', 
    'who are you', 'what is this'
  ];

  if (simpleChat.some(kw => lowerText.trim() === kw)) {
    return 'direct';
  }
  
  // 3. Look at the last message. If the bot just asked a question,
  // the user is likely answering it directly.
  const lastBotMsg = history.filter(m => m.role === 'bot').pop();
  if (lastBotMsg && lastBotMsg.text.endsWith('?')) {
    // If it's a direct answer to a question, let the conversational
    // agent handle the flow.
    return 'direct';
  }

  // 4. Default: If it's a complex statement but not an obvious "I feel..."
  // let the 'direct' companion handle it first. It can escalate
  // to the HF route if the user clarifies.
  //
  // **Alternative Default**: You could default to 'hf' to analyze
  // *everything* that isn't simple chat. Let's do that.
  
  if (history.length > 2) { // Allow for initial greeting
    return 'hf';
  }

  // Default for the very start of a conversation
  return 'direct';
}
