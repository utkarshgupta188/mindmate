import React, { useEffect, useState } from 'react'

type Card = { id: number; icon: string; flipped: boolean; matched: boolean }

const ICONS = ['🌿','🌙','⭐','🪷','🦋','🌊']

function makeDeck(): Card[] {
  const cards: Card[] = []
  let id = 0
  const doubled = [...ICONS, ...ICONS]
  for (const icon of doubled) cards.push({ id: id++, icon, flipped: false, matched: false })
  // shuffle
  for (let i=cards.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1))
    const tmp = cards[i]!
    cards[i] = cards[j]!
    cards[j] = tmp
  }
  return cards
}

export default function MemoryGame(){
  const [deck, setDeck] = useState<Card[]>(makeDeck())
  const [prev, setPrev] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)

  function flip(i:number){
    const current = deck[i]
    if (!current || current.flipped || current.matched) return
    const next = deck.map((c, idx)=> idx===i ? { ...c, flipped: true } : c)
    setDeck(next)
    if (prev === null){
      setPrev(i)
    } else {
      setMoves(m=>m+1)
      const a = next[i]
      const b = next[prev]
      if (a && b && a.icon === b.icon){
        // match
        const m = next.map((c, idx)=> idx===i || idx===prev ? { ...c, matched: true } : c)
        setDeck(m); setPrev(null)
        if (m.every(c=>c.matched)) setWon(true)
      } else {
        // hide after a moment
        const pi = prev
        setTimeout(()=>{
          setDeck(d => d.map((c, idx)=> (idx===i || idx===pi) ? { ...c, flipped: false } : c))
        }, 700)
        setPrev(null)
      }
    }
  }

  function reset(){
    setDeck(makeDeck()); setPrev(null); setMoves(0); setWon(false)
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Memory Match</h3>
      <div className="grid grid-cols-3 gap-2">
        {deck.map((c, i)=> (
          <button key={c.id} onClick={()=>flip(i)}
            className={"h-16 rounded-xl flex items-center justify-center text-2xl transition " + (c.flipped || c.matched ? 'bg-forest-100 dark:bg-forest-900/30' : 'bg-slate-200 dark:bg-slate-800')}>
            {c.flipped || c.matched ? c.icon : '❂'}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className="btn btn-primary" onClick={reset}>Restart</button>
        <span className="text-sm text-slate-500 dark:text-slate-400">Moves: {moves}{won ? ' — You did it! 🎉' : ''}</span>
      </div>
    </div>
  )
}
