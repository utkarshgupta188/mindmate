import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type Point = { day: string; stress: number; mood: number }

export default function ChartCard({ data }: { data: Point[] }) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Stress & Mood Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="stress" />
            <Line type="monotone" dataKey="mood" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Lower stress & higher mood indicate positive progress.</p>
    </div>
  )
}
