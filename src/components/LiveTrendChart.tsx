import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { TrendPoint } from '../hooks/useLiveTrend'
import { Activity } from 'lucide-react'

type Props = {
  points: TrendPoint[]
  title?: string
  subtitle?: string
}

function fmtTime(t: number) {
  const d = new Date(t)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function LiveTrendChart({ points, title = 'Real-time Progress', subtitle = 'Auto-updates as you use the app' }: Props) {
  const data = points.map(p => ({ time: fmtTime(p.t), value: p.value }))

  return (
    <div className="card rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow">
            <Activity className="h-5 w-5" />
          </span>
          {title}
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>
      </div>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.95}/>
                <stop offset="100%" stopColor="currentColor" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 'dataMax + 5']} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12 }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="url(#grad)"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Starts at <b>0</b> for new profiles. Once your profile is set up, this updates live as activities are completed.
      </p>
    </div>
  )
}
