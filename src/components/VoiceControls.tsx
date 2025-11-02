import React, { useEffect, useRef, useState } from 'react'

type Props = {
  onTranscript: (text: string) => void
  autoSend?: boolean
  lang?: string
  onStart?: () => void
  onStop?: () => void
}

export default function VoiceControls({ onTranscript, autoSend = true, lang = 'en-US', onStart, onStop }: Props){
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<any>(null)

  useEffect(()=>{
    const Win: any = window as any
    const SpeechRecognition = Win.SpeechRecognition || Win.webkitSpeechRecognition
    if (!SpeechRecognition){ setSupported(false); return }
    const r = new SpeechRecognition()
    r.lang = lang
    r.interimResults = false
    r.maxAlternatives = 1
    r.onresult = (ev: any) => {
      const t = ev.results[0][0].transcript
      onTranscript(t)
      if (!autoSend) {
        // leave it to user to send
      }
    }
  r.onend = () => { setListening(false); try{ onStop?.() }catch{} }
  r.onerror = (e: any) => { console.warn('STT error', e); setListening(false); try{ onStop?.() }catch{} }
    recognitionRef.current = r
    return ()=>{ try{ r.stop() }catch{} }
  }, [onTranscript, autoSend, lang])

  function start(){
    const r = recognitionRef.current
    if (!r) return
    try{ r.start(); setListening(true) }catch(e){ console.warn(e); setListening(false) }
    try{ onStart?.() }catch{}
  }
  function stop(){ const r = recognitionRef.current; if (!r) return; try{ r.stop(); }catch{} setListening(false) }

  return (
    <div className="inline-flex items-center gap-2">
      {!supported && <span className="text-xs opacity-60">Speech not supported</span>}
      <button onClick={()=> listening ? stop() : start()} className={`px-2 py-1 rounded-md border text-xs ${listening ? 'bg-rose-100 dark:bg-rose-900' : 'bg-white/70 dark:bg-slate-900/50'}`} aria-pressed={listening}>
        {listening ? 'Listening…' : '🎤 Talk'}
      </button>
    </div>
  )
}
