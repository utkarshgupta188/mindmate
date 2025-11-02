import React from 'react'

type Detection = {
  x1: number; y1: number; x2: number; y2: number;
  conf: number; label: string
}

type Props = {
  apiUrl?: string
  width?: number
  height?: number
  throttleMs?: number
}

export default function YoloDetect({ apiUrl, width = 480, height = 320, throttleMs = 700 }: Props){
  const YOLO_URL = (apiUrl || (import.meta as any)?.env?.VITE_YOLO_API || 'http://localhost:8002/yolo/detect') as string
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const busyRef = React.useRef(false)
  const timerRef = React.useRef<number | null>(null)
  const runningRef = React.useRef(false)
  const rafRef = React.useRef<number | null>(null)

  const drawDetections = React.useCallback((ctx: CanvasRenderingContext2D, dets: Detection[]) => {
    ctx.save()
    ctx.lineWidth = 2
    for (const d of dets){
      ctx.strokeStyle = 'rgba(34,197,94,0.9)'
      ctx.fillStyle = 'rgba(34,197,94,0.2)'
      const w = d.x2 - d.x1
      const h = d.y2 - d.y1
      ctx.strokeRect(d.x1, d.y1, w, h)
      const label = `${d.label} ${(d.conf*100).toFixed(0)}%`
      const pad = 4
      const textW = ctx.measureText(label).width
      const boxH = 18
      ctx.fillRect(d.x1, Math.max(0, d.y1 - boxH), textW + pad*2, boxH)
      ctx.fillStyle = '#0f172a'
      ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto'
      ctx.fillText(label, d.x1 + pad, Math.max(12, d.y1 - 4))
    }
    ctx.restore()
  }, [])

  const captureAndDetect = React.useCallback(async ()=>{
    if (busyRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    if (video.readyState < 2) return
    busyRef.current = true
    try{
      const ctx = canvas.getContext('2d')!
      // draw latest frame for snapshot
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      const res = await fetch(YOLO_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: dataUrl }) })
      if (!res.ok){
        throw new Error(`YOLO API ${res.status}`)
      }
      const json = await res.json()
      const dets: Detection[] = json?.detections || []
      // redraw frame and overlay boxes (ensure image is present)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      drawDetections(ctx, dets)
      setError(null)
    } catch(e:any){
      setError(e?.message || 'Detection failed')
    } finally {
      busyRef.current = false
    }
  }, [YOLO_URL, drawDetections])

  const start = React.useCallback(async ()=>{
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width, height }, audio: false })
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      runningRef.current = true
      setRunning(true)
      // paint loop shows live video immediately
      const paint = ()=>{
        if (!runningRef.current) return
        const v = videoRef.current, c = canvasRef.current
        if (v && c){
          const ctx = c.getContext('2d')!
          ctx.drawImage(v, 0, 0, c.width, c.height)
        }
        rafRef.current = window.requestAnimationFrame(paint)
      }
      rafRef.current = window.requestAnimationFrame(paint)
      // detection loop (throttled)
      const tick = async ()=>{
        if (!runningRef.current) return
        await captureAndDetect()
        timerRef.current = window.setTimeout(tick, throttleMs)
      }
      timerRef.current = window.setTimeout(tick, throttleMs)
    } catch(e:any){
      setError('Camera permission denied or unavailable')
      runningRef.current = false
      setRunning(false)
    }
  }, [width, height, throttleMs, captureAndDetect])

  const stop = React.useCallback(()=>{
    runningRef.current = false
    setRunning(false)
    if (timerRef.current){ window.clearTimeout(timerRef.current); timerRef.current = null }
    if (rafRef.current){ window.cancelAnimationFrame(rafRef.current); rafRef.current = null }
    const v = videoRef.current
    if (v && v.srcObject){
      const tracks = (v.srcObject as MediaStream).getTracks()
      tracks.forEach(t => t.stop())
      v.srcObject = null
    }
  }, [])

  React.useEffect(()=>()=>stop(), [stop])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {!running ? (
          <button className="btn btn-outline px-3 py-1.5" onClick={start}>Start YOLO</button>
        ) : (
          <button className="btn px-3 py-1.5" onClick={stop}>Stop YOLO</button>
        )}
        <span className="text-xs text-slate-500">Endpoint: {YOLO_URL}</span>
        {running && !error && <span className="text-xs text-emerald-600">Detecting…</span>}
      </div>
      {error && <div className="text-xs text-rose-600">{error}</div>}
      <div className="relative inline-block rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-800/60 bg-black">
        <video ref={videoRef} width={width} height={height} className="hidden" />
        <canvas ref={canvasRef} width={width} height={height} />
      </div>
    </div>
  )
}
