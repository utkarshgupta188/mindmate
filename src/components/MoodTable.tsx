import React from 'react'

type Row = {
  date: string
  stress: number
  mood: number
  note?: string
}

export default function MoodTable({ rows }: { rows: Row[] }) {
  return (
    <div className="card overflow-x-auto">
      <h3 className="font-semibold mb-3">Weekly Summary</h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b border-slate-200/60 dark:border-slate-800">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Stress (%)</th>
            <th className="py-2 pr-4">Mood (%)</th>
            <th className="py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-200/60 dark:border-slate-800">
              <td className="py-2 pr-4">{r.date}</td>
              <td className="py-2 pr-4">{r.stress}</td>
              <td className="py-2 pr-4">{r.mood}</td>
              <td className="py-2">{r.note || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
