import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function BotLauncher(){
  const [open, setOpen] = useState(false)
  const nav = useNavigate()

  return (
    <>
      <button onClick={()=>nav('/chat')} className="px-3 py-2 rounded-xl bg-forest-600 text-white hover:bg-forest-700">Talk</button>
    </>
  )
}
