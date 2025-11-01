import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import ChartCard from '../components/ChartCard'
import MoodTable from '../components/MoodTable'
import BreathingWidget from "../components/BreathingWidget"
import TaskList from '../components/TaskList'
import LiveTrendChart from '../components/LiveTrendChart'          // ⟵ NEW
import { useLiveTrend } from '../hooks/useLiveTrend'               // ⟵ NEW
import { generateTrend, weeklyRows, defaultTasks } from '../utils/sampleData'
import { useAuth } from '../context/AuthContext'
import { videosForMood } from '../utils/youtube'
import { HeartPulse, Activity, Youtube, Users, ShieldAlert, BadgeCheck } from 'lucide-react'

export default function Dashboard(){
  // existing sample data (you can keep for the table + other charts)
  const data = useMemo(()=>generateTrend(14), [])
  const rows = useMemo(()=>weeklyRows(), [])
  const [tasks, setTasks] = useState(defaultTasks())
  const { user, updateLovedOnes } = useAuth()
  const [lo, setLo] = useState<{name:string; whatsapp:string}[]>(user?.lovedOnes ?? [{name:'', whatsapp:''}, {name:'', whatsapp:''}])

  // derive latest mood for video picks
  const latestMood = useMemo(()=>{
    const last = rows[0] ?? { mood: 0, stress: 0 }
    const delta = last.mood - last.stress
    const score = delta > 5 ? 'positive' : delta < -5 ? 'negative' : 'neutral'
    return score as 'positive'|'neutral'|'negative'
  }, [rows])

  const vids = videosForMood(latestMood)

  function toggleTask(id:string){
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function saveLoved(){
    updateLovedOnes(lo.filter(l => l.name && l.whatsapp))
  }

  // ====== LIVE PROGRESS WIRING ======
  const isProfileComplete = Boolean(user) // simple toggle for demo
  const { points } = useLiveTrend({
    enabled: isProfileComplete,
    userId: user?.email,
    seedZero: true,   // start from a single 0 point
    pollMs: 5000,     // fallback polling if SSE isn’t available
  })

  // mood chip styles
  const moodChip = {
    positive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 border-emerald-200/60 dark:border-emerald-700/40',
    neutral:  'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200 border-slate-200/60 dark:border-slate-700/40',
    negative: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200 border-rose-200/60 dark:border-rose-700/40'
  } as const

  return (
    <div className="relative">
      {/* ambient gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_120%_-10%,theme(colors.indigo.300/15),transparent),radial-gradient(60rem_40rem_at_-10%_0%,theme(colors.cyan.300/12),transparent)]" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6 card shadow-sm"
        >
          <div className="flex items-center gap-4">
            <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=60" alt="calm" className="w-20 h-20 rounded-xl object-cover" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-emerald-500" /> Welcome back
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Gentle progress beats intensity. One small action today is enough.</p>
            </div>
            <span aria-live="polite" className={`hidden md:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${moodChip[latestMood]} `}>
              <Activity className="h-3.5 w-3.5" /> Mood: <b className="capitalize">{latestMood}</b>
            </span>
          </div>
        </motion.div>

        {/* Left column: REAL-TIME chart, table, videos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Replace the old ChartCard with the live chart.
              If the profile isn’t completed, it still shows a seeded 0 line + hint. */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
            {isProfileComplete ? (
              <LiveTrendChart points={points} />
            ) : (
              <LiveTrendChart points={points} subtitle="Complete your profile to start live tracking" />
            )}
          </motion.div>

          {/* Keep your historical/weekly mood table */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>
            <MoodTable rows={rows} />
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6 card"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow">
                  <Youtube className="h-5 w-5" />
                </span>
                Personalized Wellness
              </h3>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${moodChip[latestMood]}`}>
                <Activity className="h-3.5 w-3.5" /> Current: <b className="capitalize">{latestMood}</b>
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Based on recent mood, we suggest these short videos.
            </p>
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              {vids.map((id) => (
                <iframe key={id} className="w-full aspect-video rounded-2xl shadow-sm"
                  src={`https://www.youtube.com/embed/${id}`} title="YouTube video"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ))}
            </div>
          </motion.section>
        </div>

        {/* Right column: widgets, tasks, loved ones */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
            <BreathingWidget />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>
            <TaskList tasks={tasks} onToggle={toggleTask} />
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6 card"
          >
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Users className="h-5 w-5" /> Loved-one Alerts (Parent Control)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Add up to two trusted contacts (WhatsApp numbers in E.164 format like +91•••). With consent only.
            </p>
            <div className="grid gap-2">
              {lo.map((x, i)=>(
                <div key={i} className="flex gap-2">
                  <label className="sr-only" htmlFor={`lo-name-${i}`}>Name</label>
                  <input
                    id={`lo-name-${i}`}
                    className="border rounded-xl px-3 py-2 w-1/2 bg-white/70 dark:bg-slate-900/50"
                    placeholder="Name"
                    value={x.name}
                    onChange={e=> setLo(prev => prev.map((it, idx)=> idx===i ? { ...it, name: e.target.value } : it))}
                  />
                  <label className="sr-only" htmlFor={`lo-wa-${i}`}>WhatsApp</label>
                  <input
                    id={`lo-wa-${i}`}
                    className="border rounded-xl px-3 py-2 w-1/2 bg-white/70 dark:bg-slate-900/50"
                    placeholder="WhatsApp (+91•••)"
                    value={x.whatsapp}
                    onChange={e=> setLo(prev => prev.map((it, idx)=> idx===i ? { ...it, whatsapp: e.target.value } : it))}
                  />
                </div>
              ))}
            </div>
            <button onClick={saveLoved} className="btn btn-primary w-full mt-2 inline-flex items-center justify-center gap-2">
              <BadgeCheck className="h-4 w-4" /> Save
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              In crisis, we prepare a WhatsApp message for you to send. Automated sending requires a server + WhatsApp API.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="rounded-2xl border border-amber-300/40 bg-amber-50/70 text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-200 p-5 backdrop-blur"
          >
            <p className="text-xs md:text-sm leading-relaxed flex items-start gap-3">
              <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-400/20">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <span>
                <b>Safety:</b> This demo is not a substitute for professional care. If you’re in danger or thinking about self-harm,
                contact local emergency services immediately. In India, dial <b>112</b> or contact Tele-MANAS.
              </span>
            </p>
          </motion.section>
        </div>
      </div>

      <div className="sr-only">
        Dashboard uses motion for subtle entrance effects. Current mood badge updates from recent data.
      </div>
    </div>
  )
}
