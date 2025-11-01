export function videosForMood(mood: 'positive'|'neutral'|'negative'){
  const calming = ['5qap5aO4i9A','DWcJFNfaw9c','2OEL4P1Rz04']
  const uplift = ['MB5IX-np5fE','ZXsQAXx_ao0','mgmVOuLgFB0']
  if (mood === 'negative') return calming
  if (mood === 'neutral') return calming.slice(0,2).concat(uplift.slice(0,1))
  return uplift
}
