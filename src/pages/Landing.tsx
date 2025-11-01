import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircleHeart, Sparkles, Gamepad2, BookOpenText, HeartHandshake, ArrowRight, ShieldCheck, Clock, Lock } from 'lucide-react'

export default function Landing(){
  // marquee items
  const ticker = [
    'Small steps, big change',
    'You are not alone',
    'Breathe. You are doing your best',
    'Progress over perfection',
    'One day at a time',
  ]

  return (
    <div className="container-p">
      {/* HERO */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800">
        {/* soft gradient bg */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_120%_-10%,theme(colors.indigo.300/15),transparent),radial-gradient(60rem_40rem_at_-10%_0%,theme(colors.cyan.300/12),transparent)]" />
        {/* glass veil */}
        <div className="absolute inset-0 bg-white/65 dark:bg-black/40 backdrop-blur-[2px]" />

        <div className="relative p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-forest-600 to-moss bg-clip-text text-transparent">
                We help you feel better — one small step at a time.
              </span>
            </h1>
            <p className="text-slate-700 dark:text-slate-300 mb-2">
              This website supports your mental wellness — understand feelings, track mood, and get evidence‑informed suggestions.
            </p>
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              Start a chat, explore calming activities, or read positive updates. With consent, loved‑one alerts can be enabled.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/chat/adem" className="btn btn-primary inline-flex items-center gap-2">
                <MessageCircleHeart className="h-4 w-4" /> Talk now
              </Link>
              <Link to="/signup" className="btn btn-outline inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Create account
              </Link>
              <Link to="/india-help" className="btn btn-outline inline-flex items-center gap-2">
                <HeartHandshake className="h-4 w-4" /> Help
              </Link>
            </div>

            {/* quick trusts */}
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/40 px-3 py-1.5"><Clock className="h-3.5 w-3.5"/> 24×7</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/40 px-3 py-1.5"><Lock className="h-3.5 w-3.5"/> Private</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/40 px-3 py-1.5"><ShieldCheck className="h-3.5 w-3.5"/> Evidence‑informed</span>
            </div>
          </motion.div>
        </div>

        {/* marquee / ticker */}
        <div className="relative border-t border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur py-2">
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-8 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300"
              initial={{ x: '0%' }}
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
            >
              {[...Array(2)].map((_,i)=> (
                <div key={i} className="flex gap-8">
                  {ticker.map((t) => (
                    <span key={t} className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> {t}
                    </span>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="mt-10 grid md:grid-cols-3 gap-6">
        {[
          {title:'Motivations', to:'/motivations', desc:'Stories of resilience from people you know.', icon: BookOpenText},
          {title:'News', to:'/news', desc:'Positive, future‑looking updates from around the world.', icon: Sparkles},
          {title:'Games', to:'/games', desc:'Guided breathing + mini quizzes to unwind.', icon: Gamepad2},
        ].map((c)=> (
          <Link key={c.title} to={c.to} className="card group rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6 hover:shadow-lg hover:-translate-y-0.5 transition">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow">
                  {React.createElement(c.icon, { className: 'h-5 w-5' })}
                </span>
                {c.title}
              </h3>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition" />
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{c.desc}</p>
          </Link>
        ))}
      </section>

  {/* direct navigation to /chat/:bot is used now */}
    </div>
  )
}
