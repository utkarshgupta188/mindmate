const NEG = ['sad','depressed','anxious','stress','tired','angry','bad','hate','worthless','suicide','kill','end it','hopeless','awful','terrible','upset','hurt','pain','lonely','empty','numb','worried','overwhelmed','miserable','unhappy','gloomy','devastated','heartbroken','crying','tears','frustrated','down','blue']
const POS = ['happy','calm','excited','love','grateful','hopeful','proud','good','joy','great','wonderful','amazing','delighted','thrilled','ecstatic','peaceful','content','satisfied','confident','energetic','bright','cheerful','pleased','thankful','blessed','optimistic']

export function sentimentScore(text: string): { score: number; label: 'negative'|'neutral'|'positive' } {
  const t = text.toLowerCase()
  let s = 0
  
  // Check for negative phrases first (more specific patterns)
  const negativePhrases = ['not okay', 'not feeling okay', 'not feeling good', 'not good', 'not well', 'dont feel', "don't feel", 'cant feel', "can't feel", 'feeling down', 'feel bad', 'feel sad', 'feel awful', 'im not', "i'm not", 'not fine']
  negativePhrases.forEach(phrase => { if (t.includes(phrase)) s -= 2 })
  
  // Check for positive phrases
  const positivePhrases = ['feeling good', 'feeling great', 'feel good', 'feel great', 'im happy', "i'm happy", 'so happy', 'very happy', 'really happy']
  positivePhrases.forEach(phrase => { if (t.includes(phrase)) s += 2 })
  
  // Then check individual words
  POS.forEach(w => { if (t.includes(w)) s += 1 })
  NEG.forEach(w => { if (t.includes(w)) s -= 1 })
  
  const score = Math.max(-3, Math.min(3, s))
  const label = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
  return { score, label }
}
