import React, { useEffect, useRef, useState } from 'react'
import { emotionToEmoji, mapEmotionToValenceArousal, DeepfaceEmotion } from '../utils/emotionMap'

type Props = {
  apiUrl?: string
  intervalMs?: number
  onResult?: (r: { label?: DeepfaceEmotion; confidence?: number; scores?: Record<string, number> }) => void
  onHealthChange?: (healthy: boolean | null) => void
  className?: string
  hideStatus?: boolean
}

export default function CameraEmotion({ apiUrl = import.meta.env.VITE_EMOTION_API_URL || 'http://localhost:8000', intervalMs = 4000, onResult, onHealthChange, className, hideStatus }: Props){
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [permission, setPermission] = useState<'pending'|'granted'|'denied'>('pending')
  const [last, setLast] = useState<{ label?: DeepfaceEmotion; confidence?: number }>({})
  const [active, setActive] = useState(true)
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null)
  const [streamActive, setStreamActive] = useState<boolean>(false)

  useEffect(()=>{
    let stream: MediaStream | null = null
    async function start(){
      try{
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false })
        if (videoRef.current){
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setStreamActive(true)
        }
        setPermission('granted')
      } catch {
        setPermission('denied')
      }
    }
    start()
    return ()=>{ stream?.getTracks().forEach(t=>t.stop()); setStreamActive(false) }
  }, [])

  useEffect(()=>{
    if (permission !== 'granted' || !active) return
    let timer: number | null = null
    const tick = async () => {
      try{
        const v = videoRef.current, c = canvasRef.current
        if (!v || !c) return
        const w = v.videoWidth || 320
        const h = v.videoHeight || 240
        c.width = w; c.height = h
        const ctx = c.getContext('2d')
        if (!ctx) return
        ctx.drawImage(v, 0, 0, w, h)
        const dataUrl = c.toDataURL('image/jpeg', 0.6)
        const form = new FormData()
        form.append('image_base64', dataUrl)
        form.append('enforce_detection', 'false')
        const res = await fetch(`${apiUrl}/analyze`, { method: 'POST', body: form })
        const json = await res.json()
        const label = json.label as DeepfaceEmotion | undefined
        const confidence = typeof json.confidence === 'number' ? json.confidence : undefined
        const scores = (json.scores || {}) as Record<string, number>
        setLast({ label, confidence })
        onResult?.({ label, confidence, scores })
      } catch (e) {
        // fail silently, will try again
      } finally {
        timer = window.setTimeout(tick, intervalMs)
      }
    }
    timer = window.setTimeout(tick, 500)
    return ()=>{ if (timer) window.clearTimeout(timer) }
  }, [permission, active, apiUrl, intervalMs, onResult])

  // Ping backend health occasionally
  useEffect(()=>{
    let mounted = true
    async function ping(){
      try{
        const res = await fetch(`${apiUrl.replace(/\/$/, '')}/health`)
        const j = await res.json()
        if (!mounted) return
        const next = !!j?.deepface && !j?.import_error
        setBackendHealthy(next)
        try{ onHealthChange?.(next) }catch{}
      } catch {
        if (!mounted) return
        setBackendHealthy(false)
        try{ onHealthChange?.(false) }catch{}
      }
    }
    ping()
    const id = window.setInterval(ping, 30_000)
    return ()=>{ mounted = false; window.clearInterval(id) }
  }, [apiUrl, onHealthChange])

  const emoji = emotionToEmoji(last.label)
  const labelText = last.label ? `${last.label} ${last.confidence ? Math.round(last.confidence*100) + '%' : ''}` : 'no reading yet'

  return (
    <div className={"inline-flex items-center gap-2 text-xs " + (className||'')}>
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
      <span title={labelText} aria-live="polite">{emoji}</span>
      {!hideStatus && (
        <>
          <span className="text-[10px] opacity-75">{permission==='pending' ? 'cam:pending' : permission==='denied' ? 'cam:denied' : streamActive ? 'cam:on' : 'cam:off'}</span>
          <span className={`text-[10px] ${backendHealthy === null ? 'opacity-60' : backendHealthy ? 'text-green-600' : 'text-rose-600'}`}>{backendHealthy === null ? 'api:...' : backendHealthy ? 'api:ok' : 'api:down'}</span>
          <button type="button" className="underline opacity-70 hover:opacity-100" onClick={()=>setActive(a=>!a)}>{active ? 'tracking on' : 'tracking off'}</button>
        </>
      )}
    </div>
  )
}
