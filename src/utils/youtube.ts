export function videosForMood(mood: 'positive'|'neutral'|'negative'){
  const calming = ['jfKfPfyJRdk','DWcJFNfaw9c','1ZYbU82GVz4']
  const uplift = ['ZXsQAXx_ao0','mgmVOuLgFB0','H14bBuluwB8']
  if (mood === 'negative') return calming
  if (mood === 'neutral') return [calming[0], calming[1], uplift[0]]
  return uplift
}

