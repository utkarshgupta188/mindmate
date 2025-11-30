import React from 'react'
import { Send } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import OnboardingWizard from '../components/OnboardingWizard'
import { saveOnboarding } from '../utils/onboarding'
import { useChatLogic } from '../hooks/useChatLogic'
import ChatHeader from '../components/chat/ChatHeader'
import MessageList, { Msg } from '../components/chat/MessageList'
import CrisisModal from '../components/chat/CrisisModal'

const smartSuggestions = [
  'I feel overwhelmed by studies',
  'Can we do a 3-minute breathing?',
  'I slept well and felt calmer today',
  'Teach me grounding 5-4-3-2-1',
]

export default function Chat() {
  const {
    input, setInput,
    typing,
    closing,
    msgs, setMsgs,
    crisis, setCrisis,
    onboarding, setOnboarding,
    user,
    bottomRef,
    inputRef,
    webEmotion, setWebEmotion,
    moodTrail, setMoodTrail,
    ttsEnabled, setTtsEnabled,
    sttAutoSend,
    voiceActive, setVoiceActive,
    cameraApiHealthy, setCameraApiHealthy,
    showYolo, setShowYolo,
    send,
    handleTranscript,
    speakMessage,
    closeChatAndReport,
    YOLO_ENABLED,
    TALK_ENABLED,
    baseLabel
  } = useChatLogic()

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_120%_-10%,theme(colors.indigo.300/15),transparent),radial-gradient(60rem_40rem_at_-10%_0%,theme(colors.cyan.300/12),transparent)]" />

      <section className="card rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-0 overflow-hidden">
        <ChatHeader
          headerIcon="💬"
          headerName="MindMate"
          YOLO_ENABLED={YOLO_ENABLED}
          showYolo={showYolo}
          setShowYolo={setShowYolo}
          TALK_ENABLED={TALK_ENABLED}
          handleTranscript={handleTranscript}
          sttAutoSend={sttAutoSend}
          setVoiceActive={setVoiceActive}
          setTtsEnabled={setTtsEnabled}
          ttsEnabled={ttsEnabled}
          moodTrail={moodTrail}
          setWebEmotion={setWebEmotion}
          setMoodTrail={setMoodTrail}
          setCameraApiHealthy={setCameraApiHealthy}
          closeChatAndReport={closeChatAndReport}
          closing={closing}
        />

        <div className="md:hidden px-4 py-2 border-b border-slate-200/60 dark:border-slate-800/60 flex justify-end bg-white/60 dark:bg-slate-900/60">
          <button onClick={closeChatAndReport} disabled={closing} className={`px-3 py-1.5 rounded-xl border ${closing ? 'opacity-60 cursor-not-allowed' : ''}`} title="Close chat and generate report">
            {closing ? 'Generating…' : 'Close Chat'}
          </button>
        </div>

        <MessageList
          msgs={msgs}
          typing={typing}
          bottomRef={bottomRef}
          speakMessage={speakMessage}
        />

        <div className="px-4 md:px-6 pb-4">
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="chat-input">Type how you feel</label>
            <input id="chat-input" ref={inputRef} className="flex-1 border rounded-xl px-3 py-2 bg-white/70 dark:bg-slate-900/50" placeholder={onboarding ? "Type how you feel..." : "Please complete quick setup to start chatting"} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} aria-label="Type how you feel" disabled={!onboarding} />
            <button onClick={() => send()} className="btn btn-primary inline-flex items-center gap-2" disabled={!input.trim() || !onboarding} aria-disabled={!input.trim() || !onboarding}>
              <Send className="h-4 w-4" /> Send
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {smartSuggestions.map(s => (
              <button key={s} onClick={() => send(s)} className="text-xs rounded-full border border-slate-200/60 dark:border-slate-800/60 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">{s}</button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {!onboarding && (
          <OnboardingWizard onComplete={(ans) => {
            saveOnboarding(ans)
            setOnboarding(ans)
            setMsgs(prev => {
              if (prev.length >= 2) {
                const m0 = prev[0]!
                const m1 = prev[1]!
                const updated0: Msg = { from: m0.from, ts: m0.ts, text: `🐱 Whiskers the cat: Meow! Hi${ans.name ? ' ' + ans.name : ''}.` }
                const updated1: Msg = { from: m1.from, ts: m1.ts, text: `${baseLabel}: Hi${ans.name ? ' ' + ans.name : ''} — we're glad you're here. When you're ready, say hello or tell me how you're feeling.` }
                return [updated0, updated1, ...prev.slice(2)]
              }
              return prev
            })
          }} />
        )}
        <CrisisModal crisis={crisis} setCrisis={setCrisis} user={user} />
      </AnimatePresence>

      <div className="sr-only">Chat supports quick suggestions, typing indicator, and crisis resources.</div>
    </div>
  )
}
