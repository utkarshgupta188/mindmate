const envAny = (import.meta as any)?.env || {}
export const VOICE_ASSISTANT_URL: string =
  envAny.VITE_ASSISTANT_URL || envAny.VITE_VOICE_ASSISTANT_URL || 'https://pvassist.onrender.com/'
