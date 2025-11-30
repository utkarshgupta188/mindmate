import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Bot } from 'lucide-react'

export type Msg = { from: 'user' | 'bot'; text: string; ts: number }

interface MessageListProps {
    msgs: Msg[]
    typing: boolean
    bottomRef: React.RefObject<HTMLDivElement>
    speakMessage: (text: string) => void
}

function renderTextWithLinks(text: string): React.ReactNode {
    const lines = text.split('\n')
    return (
        <>
            {lines.map((line, i) => {
                const parts = line.split(/(https?:\/\/[^\s]+)/i)
                return (
                    <React.Fragment key={`line-${i}`}>
                        {parts.map((p, j) =>
                            /^https?:\/\//i.test(p) ? (
                                <a key={`l-${i}-${j}`} href={p} target="_blank" rel="noopener noreferrer" className="underline">{p}</a>
                            ) : (
                                <React.Fragment key={`t-${i}-${j}`}>{p}</React.Fragment>
                            )
                        )}
                        {i < lines.length - 1 ? <br /> : null}
                    </React.Fragment>
                )
            })}
        </>
    )
}

export default function MessageList({ msgs, typing, bottomRef, speakMessage }: MessageListProps) {
    return (
        <div className="px-4 md:px-6 py-4 h-[62vh] overflow-y-auto space-y-3">
            <AnimatePresence initial={false}>
                {msgs.map((m, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className={(m.from === 'user' ? 'ml-auto' : '') + ' max-w-[82%]'}
                    >
                        <div className={'px-3 py-2 rounded-2xl shadow-sm ' + (m.from === 'user' ? 'bg-forest-100 dark:bg-forest-900/30' : 'bg-slate-100 dark:bg-slate-800/80')}>
                            <div className="flex items-start gap-2">
                                <p className="text-sm whitespace-pre-wrap flex-1">{renderTextWithLinks(m.text)}</p>
                                {m.from === 'bot' && (
                                    <button aria-label="Play message" title="Play message" onClick={() => speakMessage(m.text)} className="ml-2 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                                        <Volume2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            <AnimatePresence>
                {typing && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="max-w-[82%]">
                        <div className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 inline-flex items-center gap-2">
                            <Bot className="h-4 w-4 text-slate-500" />
                            <div className="flex gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:120ms]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:240ms]" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div ref={bottomRef} />
        </div>
    )
}
