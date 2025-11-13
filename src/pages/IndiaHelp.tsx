import React from 'react'
import { ExternalLink, Phone, ShieldCheck, Globe, ArrowUpRight, Copy, CheckCircle2, HeartHandshake, Languages, Clock, Lock, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function IndiaHelp() {
  const [copied, setCopied] = React.useState<string | null>(null)

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1600)
    } catch (e) {
      // noop
    }
  }

  return (
    <div className="relative">
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_120%_-10%,theme(colors.indigo.300/15),transparent),radial-gradient(60rem_40rem_at_-10%_0%,theme(colors.cyan.300/12),transparent)]" />

      {/* Header card */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6 md:p-8 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow">
                <ShieldCheck className="h-5 w-5" />
              </span>
              Government Help — Official Mental Health Support
            </h2>
            <p className="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-400">
              Verified Government of India resources you can contact directly. Services are free and available 24×7.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/40 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Languages className="h-3.5 w-3.5" /> Multilingual
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/40 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5" /> 24×7
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/40 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" /> Confidential
            </span>
          </div>
        </div>
      </motion.section>

      {/* Resources Grid */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="mt-6 grid gap-6 md:grid-cols-2"
      >
        {/* Tele-MANAS */}
        <a
          href="https://telemanas.mohfw.gov.in/"
          target="_blank"
          rel="noreferrer noopener"
          className="group rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6 shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow">
                <Phone className="h-5 w-5" />
              </span>
              Tele‑MANAS (MoHFW)
            </h3>
            <ExternalLink className="h-4 w-4 text-slate-400 transition group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          </div>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            National Tele Mental Health Programme by the Ministry of Health & Family Welfare.
          </p>

          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                <Phone className="h-3.5 w-3.5" />
              </span>
              Call{' '}
              <a href="tel:14416" className="font-semibold underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
                14416
              </a>{' '}
              (all‑India)
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  copy('14416', '14416')
                }}
                className="ml-2 inline-flex items-center gap-1 rounded-md border border-slate-200/60 dark:border-slate-800/60 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Copy 14416"
              >
                {copied === '14416' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === '14416' ? 'Copied' : 'Copy'}
              </button>
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                <Phone className="h-3.5 w-3.5" />
              </span>
              Alternate toll‑free{' '}
              <a href="tel:18008914416" className="font-semibold underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
                1800‑891‑4416
              </a>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  copy('18008914416', 'tollfree')
                }}
                className="ml-2 inline-flex items-center gap-1 rounded-md border border-slate-200/60 dark:border-slate-800/60 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Copy 1800-891-4416"
              >
                {copied === 'tollfree' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === 'tollfree' ? 'Copied' : 'Copy'}
              </button>
            </li>
            <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <HeartHandshake className="h-4 w-4" /> Multilingual, 24/7, free & confidential
            </li>
          </ul>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Visit the official website for app/video options and state cells.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/40 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Globe className="h-3.5 w-3.5" /> telemanas.mohfw.gov.in
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </a>

        {/* NMHP */}
        <a
          href="https://dghs.mohfw.gov.in/national-mental-health-programme.php"
          target="_blank"
          rel="noreferrer noopener"
          className="group rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6 shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow">
                <ShieldCheck className="h-5 w-5" />
              </span>
              National Mental Health Programme (NMHP)
            </h3>
            <ExternalLink className="h-4 w-4 text-slate-400 transition group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          </div>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Policy and programme details from the Directorate General of Health Services.
          </p>

          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Public health policy, district mental health services</li>
            <li className="flex items-center gap-2"><Globe className="h-4 w-4" /> How Tele‑MANAS fits within India’s system</li>
          </ul>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Learn how Tele‑MANAS fits within India’s public health system.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/40 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Globe className="h-3.5 w-3.5" /> dghs.mohfw.gov.in
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </a>
      </motion.section>

      {/* Safety Banner */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="mt-6"
      >
        <div className="rounded-2xl border border-amber-300/40 bg-amber-50/70 text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-200 p-5 backdrop-blur">
          <p className="text-xs md:text-sm leading-relaxed flex items-start gap-3">
            <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-400/20">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <span>
              <b>Safety:</b> If you or someone else is in immediate danger, call <b>112</b> right now. MindMate is an educational demo and does not automatically contact anyone.
            </span>
          </p>
        </div>
      </motion.section>

      {/* Accessibility & small tips */}
      <div className="sr-only">
        Links open in a new tab. Phone numbers can be copied via the copy buttons.
      </div>
    </div>
  )
}
