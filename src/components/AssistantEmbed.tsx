import React, { useMemo, useState } from 'react'
import { VOICE_ASSISTANT_URL } from '../config/appConfig'

type Props = {
  url?: string
  height?: number | string
}

export default function AssistantEmbed({ url, height = 640 }: Props){
  const assistantUrl = useMemo(() => {
    return url || VOICE_ASSISTANT_URL
  }, [url])

  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  // If the iframe fails to load within 6s, show a hint
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (!loaded) setFailed(true)
    }, 6000)
    return () => clearTimeout(t)
  }, [loaded])

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Connected to: <span className="font-medium">{assistantUrl}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={assistantUrl} target="_blank" rel="noreferrer" className="btn btn-outline text-xs px-3 py-1.5">Open in new tab</a>
          <button onClick={() => { setLoaded(false); setFailed(false); const el = document.getElementById('assistant-iframe') as HTMLIFrameElement | null; el?.contentWindow?.location.reload(); }} className="btn text-xs px-3 py-1.5">Reload</button>
        </div>
      </div>
      {!loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center text-slate-500 dark:text-slate-400 text-sm">
            {failed ? (
              <div className="space-y-1">
                <p>Trying to reach your Personal Assistant at the configured URL.</p>
                <p>Ensure it’s running (Flask on port 8001 by default), or click “Open in new tab”.</p>
              </div>
            ) : (
              <div className="animate-pulse">Loading assistant…</div>
            )}
          </div>
        </div>
      )}
      <iframe
        id="assistant-iframe"
        title="Personal Assistant"
        src={assistantUrl}
        className="w-full bg-white dark:bg-slate-900"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
