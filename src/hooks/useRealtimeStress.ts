// src/hooks/useRealtimeStress.ts
import { useEffect, useRef } from 'react'
type StressPoint = { t:number; value:number; source?:string }

const PROGRESS_API = (import.meta as any).env?.VITE_PROGRESS_API || 'http://localhost:5001'

export function useRealtimeStress(userId?: string, wsUrl = 'ws://localhost:4000') {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(()=>{
    if (!userId) return
    // Optional WS connection (if you still run ws relay). Safe to skip if not used.
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onopen = () => ws.send(JSON.stringify({ type:'subscribe', userId }))
      ws.onclose = ()=> console.log('ws closed')
      return ()=> ws.close()
    } catch (e) {
      // ignore if ws not available
      console.warn('ws not opened', e)
    }
  }, [userId, wsUrl])

  async function postPoint(point: StressPoint) {
    try {
      await fetch(`${PROGRESS_API}/api/progress/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, point })
      })
    } catch (e) {
      // ignore network failures
      console.warn('postPoint failed', e)
    }
  }

  function emitStress(value:number, source='client') {
    const point: StressPoint = { t: Date.now(), value, source }
    // send via WS if connected (optional)
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type:'stressPoint', userId, point }))
      }
    } catch (e) {}
    // always also post to progress API (SSE consumers will receive this)
    postPoint(point)
  }

  function emitBulk(points: StressPoint[]) {
    for (const p of points) {
      postPoint(p)
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type:'stressPoint', userId, point: p }))
        }
      } catch {}
    }
  }

  function emitFinalReport(report:any) {
    if (report?.points && Array.isArray(report.points)) {
      emitBulk(report.points as StressPoint[])
    }
  }

  return { emitStress, emitBulk, emitFinalReport }
}
