import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, HeartHandshake, PhoneCall } from 'lucide-react'
import { waLink } from '../../utils/crisis'

interface CrisisModalProps {
    crisis: string | null
    setCrisis: (val: string | null) => void
    user: any
}

export default function CrisisModal({ crisis, setCrisis, user }: CrisisModalProps) {
    return (
        <AnimatePresence>
            {crisis && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" aria-live="assertive">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }} role="dialog" aria-modal="true" className="card max-w-md w-full rounded-2xl border border-amber-300/40 bg-amber-50/70 text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-200 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> You matter. Let’s get support.</h3>
                            <button className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setCrisis(null)} aria-label="Close"><X className="h-4 w-4" /></button>
                        </div>
                        <p className="text-sm text-amber-900/90 dark:text-amber-200/90 mt-1">Your message suggests you might be in distress. Consider reaching out to someone you trust or local emergency services immediately.</p>
                        {user?.lovedOnes?.length ? (
                            <div className="mt-3 space-y-2">
                                <p className="text-sm">Send a WhatsApp message to:</p>
                                {user.lovedOnes.map((l: any, i: number) => (
                                    <a key={i} className="block px-3 py-2 rounded-xl border hover:bg-amber-100/40 dark:hover:bg-amber-900/20" target="_blank" rel="noreferrer noopener" href={waLink(l.whatsapp ?? '', `This is ${user.name}. I need support right now. Can we talk?`)}>
                                        <span className="inline-flex items-center gap-2"><HeartHandshake className="h-4 w-4" /> {l.name}</span> <span className="text-xs opacity-70">({l.whatsapp})</span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-amber-900/90 dark:text-amber-200/90 mt-3">Add loved-one contacts in your Dashboard to enable quick alerts.</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-4">
                            <a className="px-3 py-2 rounded-xl border btn-outline inline-flex items-center gap-2" href="tel:112"><PhoneCall className="h-4 w-4" /> Call emergency (112)</a>
                            <button className="btn btn-primary" onClick={() => setCrisis(null)}>I’m safe</button>
                        </div>
                        <p className="text-xs opacity-70 mt-3">This demo does not automatically notify anyone. Automated messaging requires consent and WhatsApp Business API.</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
