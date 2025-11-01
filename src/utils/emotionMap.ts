export type DeepfaceEmotion = 'angry'|'disgust'|'fear'|'happy'|'sad'|'surprise'|'neutral'

export type Valence = 'negative'|'neutral'|'positive'
export type Arousal = 'low'|'medium'|'high'

export function mapEmotionToValenceArousal(e: DeepfaceEmotion): { valence: Valence; arousal: Arousal } {
  switch (e) {
    case 'happy':
      return { valence: 'positive', arousal: 'medium' }
    case 'sad':
      return { valence: 'negative', arousal: 'low' }
    case 'angry':
      return { valence: 'negative', arousal: 'high' }
    case 'fear':
      return { valence: 'negative', arousal: 'high' }
    case 'disgust':
      return { valence: 'negative', arousal: 'medium' }
    case 'surprise':
      return { valence: 'neutral', arousal: 'high' }
    case 'neutral':
    default:
      return { valence: 'neutral', arousal: 'low' }
  }
}

export function emotionToEmoji(e: DeepfaceEmotion | undefined): string {
  switch (e) {
    case 'happy': return '🙂'
    case 'sad': return '🙁'
    case 'angry': return '😠'
    case 'fear': return '😨'
    case 'disgust': return '🤢'
    case 'surprise': return '😮'
    case 'neutral': return '😐'
    default: return '😶'
  }
}
