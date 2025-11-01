import { useEffect, useMemo, useRef, useState } from 'react'

export type TrendPoint = { t: number; value: number }

type UseLiveTrendOpts = {
  enabled: boolean
  userId?: string
  seedZero?: boolean // default true: start from 0 point
  pollMs?: number    // fallback polling interval
}

export function useLiveTrend({ enabled, userId, seedZero = true, pollMs = 5000 }: UseLiveTrendOpts) {
  const [points, setPoints] = useState<TrendPoint[]>(() => {
    if (!seedZero) return []
    // seed with a single zero point
    return [{ t: Date.now(), value: 0 }]
  })

  const lastPoint = points.length > 0 ? points[points.length - 1] : undefined
  const lastTimestampRef = useRef<number>(lastPoint?.t ?? 0)
  const esRef = useRef<EventSource | null>(null)
  const pollingRef = useRef<number | null>(null)

  const addPoint = (p: TrendPoint) => {
    lastTimestampRef.current = Math.max(lastTimestampRef.current, p.t)
    setPoints(prev => {
      // avoid duplicates if same timestamp arrives via SSE + polling
  if (prev.length && (prev[prev.length - 1]?.t === p.t)) return prev
      return [...prev, p]
    })
  }

  useEffect(() => {
  if (!enabled || !userId) return

    // --- 1) Try SSE (recommended) ---
    try {
  const es = new EventSource(`/api/progress/stream?userId=${encodeURIComponent(userId)}`)
      esRef.current = es

      es.onmessage = (evt) => {
        // expected payload: { t: number (ms), value: number }
        try {
          const data = JSON.parse(evt.data) as TrendPoint
          if (typeof data?.t === 'number' && typeof data?.value === 'number') {
            addPoint(data)
          }
        } catch { /* no-op */ }
      }

      es.onerror = () => {
        // If SSE errors, close and fall back to polling
        es.close()
        esRef.current = null
        startPolling()
      }

      // slight warm-up polling in case backend buffers first SSE message
      const warmup = setTimeout(() => {
        if (!esRef.current) return
        // optional: kick a one-time fetch to fill gaps
        fetchLatest()
      }, 1500)

      return () => {
        clearTimeout(warmup)
        if (esRef.current) esRef.current.close()
        if (pollingRef.current) window.clearInterval(pollingRef.current)
      }
    } catch {
      // --- 2) If SSE not supported, poll ---
      startPolling()
      return () => {
        if (pollingRef.current) window.clearInterval(pollingRef.current)
      }
    }

    function startPolling() {
      if (pollingRef.current) window.clearInterval(pollingRef.current)
      fetchLatest() // immediate fetch
      pollingRef.current = window.setInterval(fetchLatest, pollMs)
    }

    async function fetchLatest() {
      try {
  const since = lastTimestampRef.current || 0
  const res = await fetch(`/api/progress?userId=${encodeURIComponent(userId || '')}&since=${since}`)
        if (!res.ok) return
        // expected payload: TrendPoint[] sorted by t ascending
        const arr = (await res.json()) as TrendPoint[]
        if (Array.isArray(arr)) {
          arr.forEach(addPoint)
        }
      } catch {
        // ignore network errors; next tick will retry
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId])

  // keep only recent N points (optional)
  const trimmed = useMemo(() => {
    const MAX = 500
    return points.length > MAX ? points.slice(points.length - MAX) : points
  }, [points])

  return { points: trimmed }
}
