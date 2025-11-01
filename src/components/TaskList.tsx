import React from 'react'

type Task = { id: string; title: string; done: boolean; tag?: string }

export default function TaskList({ tasks, onToggle }: { tasks: Task[]; onToggle: (id:string)=>void }) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Today's Tasks</h3>
      <ul className="space-y-2">
        {tasks.map(t => (
          <li key={t.id} className="flex items-center gap-3">
            <input id={t.id} type="checkbox" checked={t.done} onChange={()=>onToggle(t.id)} className="w-5 h-5" />
            <label htmlFor={t.id} className={t.done ? 'line-through text-slate-400' : ''}>
              {t.title} {t.tag && <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">#{t.tag}</span>}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
