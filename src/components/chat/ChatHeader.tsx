import React from 'react'
import { Scan, Link as LinkIcon, Sparkles, X } from 'lucide-react'
import { VOICE_ASSISTANT_URL } from '../../config/appConfig'
import CameraEmotion from '../CameraEmotion'
import YoloDetect from '../YoloDetect'
import VoiceControls from '../VoiceControls'
import { DeepfaceEmotion } from '../../utils/emotionMap'

interface ChatHeaderProps {
    headerIcon: string
    headerName: string
    YOLO_ENABLED: boolean
    showYolo: boolean
    setShowYolo: React.Dispatch<React.SetStateAction<boolean>>
    TALK_ENABLED: boolean
    handleTranscript: (t: string) => void
    sttAutoSend: boolean
    setVoiceActive: (active: boolean) => void
    setTtsEnabled: (enabled: boolean) => void
    ttsEnabled: boolean
    moodTrail: DeepfaceEmotion[]
    setWebEmotion: (val: { label?: DeepfaceEmotion; confidence?: number } | null) => void
    setMoodTrail: React.Dispatch<React.SetStateAction<DeepfaceEmotion[]>>
    setCameraApiHealthy: (healthy: boolean) => void
    closeChatAndReport: () => void
    closing: boolean
}

export default function ChatHeader({
    headerIcon,
    headerName,
    YOLO_ENABLED,
    showYolo,
    setShowYolo,
    TALK_ENABLED,
    handleTranscript,
    sttAutoSend,
    setVoiceActive,
    setTtsEnabled,
    ttsEnabled,
    moodTrail,
    setWebEmotion,
    setMoodTrail,
    setCameraApiHealthy,
    closeChatAndReport,
    closing
}: ChatHeaderProps) {
    return (
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white text-lg shadow">{headerIcon}</span>
                <div>
                    <h3 className="font-semibold leading-tight">{headerName}</h3>
                    {YOLO_ENABLED && showYolo && (
                        <div className="px-4 md:px-6 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50">
                            <YoloDetect />
                        </div>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">Empathetic companion • responses may be AI-generated</p>
                </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
                <CameraEmotion hideStatus onResult={(r) => {
                    setWebEmotion({ label: r.label, confidence: r.confidence })
                    if (r.label) setMoodTrail(t => {
                        const next = [...t, r.label!]
                        return next.slice(-8)
                    })
                }} onHealthChange={(h) => setCameraApiHealthy(h)} />
                <div className="flex items-center gap-2">
                    {YOLO_ENABLED && (
                        <button
                            type="button"
                            onClick={() => setShowYolo(v => !v)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Toggle YOLO object detection"
                        >
                            <Scan size={16} />
                            <span>YOLO</span>
                        </button>
                    )}
                    {TALK_ENABLED && (
                        <VoiceControls
                            onTranscript={handleTranscript}
                            autoSend={sttAutoSend}
                            lang={navigator.language || 'en-US'}
                            onStart={() => { setVoiceActive(true); setTtsEnabled(true) }}
                            onStop={() => setVoiceActive(false)}
                        />
                    )}
                    <a
                        href={VOICE_ASSISTANT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open Voice Assistant"
                        className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <LinkIcon size={16} />
                        <span>Voice Assistant</span>
                    </a>
                    <span title="Text-to-speech status">{ttsEnabled ? '🔊' : '🔈'}</span>
                </div>
                {moodTrail.length > 0 && (
                    <div className="text-xs opacity-75" title={moodTrail.join(', ')}>
                        {moodTrail.map((e, i) => <span key={i} className="ml-0.5">{({ happy: '🙂', sad: '🙁', angry: '😠', fear: '😨', disgust: '🤢', surprise: '😮', neutral: '😐' } as any)[e]}</span>)}
                    </div>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/40 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Sparkles className="h-3.5 w-3.5" /> Be kind to yourself
                </span>
                <button onClick={closeChatAndReport} disabled={closing} aria-label="Close chat" title="Close chat and generate report" className={`ml-2 p-1.5 rounded-md border hover:bg-slate-100 dark:hover:bg-slate-800 ${closing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="flex md:hidden items-center gap-2">
                <button onClick={closeChatAndReport} disabled={closing} aria-label="Close chat" title="Close chat and generate report" className={`p-2 rounded-md border hover:bg-slate-100 dark:hover:bg-slate-800 ${closing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}
