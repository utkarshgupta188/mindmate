export function generateTrend(days = 14){
  const data: { day: string; stress: number; mood: number }[] = []
  const now = new Date()
  for (let i=days-1; i>=0; i--){
    const d = new Date(now); d.setDate(now.getDate()-i)
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const stress = Math.max(5, Math.min(95, Math.round(60 + (Math.sin(i/3)*15) + (Math.random()*10 - 5))))
    const mood = Math.max(5, Math.min(95, Math.round(100 - stress + (Math.random()*10 - 5))))
    data.push({ day: label, stress, mood })
  }
  return data
}

export function weeklyRows(){
  const rows: { date: string; stress: number; mood: number; note?: string }[] = []
  for (let i=0;i<7;i++){
    const d = new Date(); d.setDate(d.getDate()-i)
    rows.push({
      date: d.toLocaleDateString(),
      stress: Math.round(50 + Math.random()*40),
      mood: Math.round(50 + Math.random()*40),
      note: i % 2 === 0 ? 'Did breathing exercise' : 'Walked 20 minutes'
    })
  }
  return rows
}

export function defaultTasks(){
  return [
    { id: 't1', title: '10-minute walk', done: false, tag: 'physical' },
    { id: 't2', title: '3-minute breathing', done: false, tag: 'mindfulness' },
    { id: 't3', title: 'Write one gratitude', done: false, tag: 'journaling' },
  ]
}
