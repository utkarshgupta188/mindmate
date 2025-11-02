import React, { useMemo, useState } from 'react'
import { loadSessions, deleteSession, type ChatSession } from '../utils/chatStore'
import { useAuth } from '../context/AuthContext'
import type { ConversationReport } from '../utils/report'

export default function Reports(){
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>(()=>loadSessions())
  const [selectedId, setSelectedId] = useState<string | null>(sessions[0]?.id || null)

  const selected = useMemo(()=> sessions.find(s => s.id === selectedId) || null, [sessions, selectedId])

  function handleDelete(id: string){
    deleteSession(id)
    const next = loadSessions()
    setSessions(next)
    if (selectedId === id) setSelectedId(next[0]?.id || null)
  }

  async function ensureHtml2Pdf(){
    const w = window as any
    if (w.html2pdf) return
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js'
      s.defer = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load html2pdf'))
      document.head.appendChild(s)
    })
  }

  function renderPrintable(report: ConversationReport, s: ChatSession){
    const container = document.createElement('div')
    container.style.width = '800px'
    container.style.margin = '0 auto'
    container.style.fontFamily = `Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`
    container.style.color = '#1f2937'

    const header = document.createElement('div')
    header.style.background = 'linear-gradient(90deg,#4f46e5,#06b6d4)'
    header.style.color = '#fff'
    header.style.padding = '16px 20px'
    header.style.borderRadius = '12px 12px 0 0'
    const h1 = document.createElement('h1')
    h1.style.margin = '0'
    h1.style.fontSize = '20px'
    h1.style.fontWeight = '700'
    h1.textContent = 'Conversation Well-being Analysis'
    const p = document.createElement('p')
    p.style.margin = '6px 0 0 0'
    p.style.fontSize = '12px'
    p.style.opacity = '0.9'
    p.textContent = `Chat: ${s.title} • ${new Date(s.startedAt).toLocaleString()} — Generated ${new Date().toLocaleString()}`
    header.appendChild(h1)
    header.appendChild(p)
    container.appendChild(header)

    const addSection = (title: string, body: HTMLElement)=>{
      const sec = document.createElement('div')
      sec.style.padding = '14px 18px'
      sec.style.borderBottom = '1px solid #eef2ff'
      const t = document.createElement('div')
      t.style.fontWeight = '700'
      t.style.marginBottom = '6px'
      t.textContent = title
      sec.appendChild(t)
      sec.appendChild(body)
      container.appendChild(sec)
    }

    const mkText = (txt: string)=>{ const d = document.createElement('div'); d.textContent = txt || '—'; return d }

    addSection('Nature Summary', mkText(report.natureSummary))

    const stressWrap = document.createElement('div')
    const badge = document.createElement('span')
    const stress = (report.stressLevel || '').toLowerCase()
    badge.textContent = report.stressLevel || '—'
    badge.style.display = 'inline-block'
    badge.style.padding = '6px 10px'
    badge.style.borderRadius = '999px'
    badge.style.fontWeight = '600'
    if (stress.includes('high')) { badge.style.background = '#fee2e2' }
    else if (stress.includes('moderate')) { badge.style.background = '#fef3c7' }
    else { badge.style.background = '#dcfce7' }
    stressWrap.appendChild(badge)
    addSection('Stress Level', stressWrap)

    addSection('Thinking Patterns', mkText(report.thinkingPatterns))

    const ul = document.createElement('ul')
    ul.style.paddingLeft = '18px'
    ;(Array.isArray(report.keyProblems) ? report.keyProblems : ['—']).forEach(item => {
      const li = document.createElement('li'); li.textContent = item; ul.appendChild(li)
    })
    addSection('Identified Themes/Concerns', ul)

    addSection('General Reflection', mkText(report.generalReflection))

    const rec = mkText(report.wellnessRecommendations)
    addSection('Personalized Wellness Recommendation', rec)

    const disc = document.createElement('div')
    disc.style.padding = '12px 18px'
    disc.innerHTML = '<small style="color:#6b7280">Disclaimer: This report is AI-generated and is not a substitute for professional advice.</small>'
    container.appendChild(disc)

    return container
  }

  async function exportSelectedToPdf(){
    if (!selected || !selected.report) return
    await ensureHtml2Pdf()
    const printable = renderPrintable(selected.report, selected)
    const w = window as any
    const opt = {
      margin: [12,12,12,12],
      filename: `chat_report_${new Date().toISOString().replace(/[:.]/g,'-')}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    }
    try {
      w.html2pdf().set(opt).from(printable).save()
    } catch (e) {
      alert('Failed to generate PDF. Please try again.')
    }
  }

  async function pdfBlobFromSelected(): Promise<Blob | null> {
    if (!selected || !selected.report) return null
    await ensureHtml2Pdf()
    const printable = renderPrintable(selected.report, selected)
    const w = window as any
    const opt = {
      margin: [12,12,12,12],
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    }
    try {
      // html2pdf returns a Promise chain; use outputPdf('blob') to get the blob
      const worker = w.html2pdf().set(opt).from(printable)
      const blob: Blob = await worker.outputPdf('blob')
      return blob
    } catch { return null }
  }

  async function sendReportByEmail(){
    if (!selected || !selected.report) return
    const email = prompt('Send to email address:', user?.email || '')
    if (!email) return
    // Build base64 using data URI for better reliability
    await ensureHtml2Pdf()
    const printable = renderPrintable(selected.report, selected)
    const w = window as any
    const opt = {
      margin: [12,12,12,12],
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    }
    const worker = w.html2pdf().set(opt).from(printable)
    const dataUri: string = await worker.outputPdf('datauristring')
    const b64 = dataUri.replace(/^data:application\/pdf;filename=generated\.pdf;base64,/, '')
    const filename = `chat_report_${new Date().toISOString().replace(/[:.]/g,'-')}.pdf`
    try{
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, subject: 'Your Conversation Report', filename, pdfBase64: b64 })
      })
      if (!res.ok){ throw new Error('Email send failed') }
      alert('Email sent!')
    }catch(e){
      alert('Failed to send email. Please check server email settings.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Conversation Reports</h1>
      {sessions.length === 0 ? (
        <p className="text-sm text-slate-500">No saved chats yet. Close a chat to generate and save a report.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-2">
            {sessions.map(s => (
              <button key={s.id} onClick={()=>setSelectedId(s.id)} className={`w-full text-left px-3 py-2 rounded-xl border ${selectedId===s.id ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white/70 dark:bg-slate-900/50'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-xs text-slate-500">{new Date(s.startedAt).toLocaleString()} → {new Date(s.endedAt).toLocaleTimeString()}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full border">💬 MindMate</span>
                </div>
              </button>
            ))}
          </div>
          <div className="md:col-span-2">
            {!selected ? (
              <p className="text-sm text-slate-500">Select a chat to view its report and messages.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.title}</h2>
                    <p className="text-xs text-slate-500">{new Date(selected.startedAt).toLocaleString()} • {selected.messages.length} messages</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selected.report && (
                      <>
                        <button className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700" onClick={exportSelectedToPdf}>
                          Download PDF
                        </button>
                        <button className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700" onClick={sendReportByEmail}>
                          Send via Email
                        </button>
                      </>
                    )}
                    <button className="text-red-600 text-sm" onClick={()=>handleDelete(selected.id)}>Delete</button>
                  </div>
                </div>

                {selected.report ? (
                  <div className="rounded-xl border bg-white/70 dark:bg-slate-900/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Stress Level:</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${/high/i.test(selected.report.stressLevel) ? 'bg-red-100 text-red-800' : /moderate/i.test(selected.report.stressLevel) ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{selected.report.stressLevel}</span>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Nature Summary</div>
                      <p className="text-sm whitespace-pre-wrap">{selected.report.natureSummary}</p>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Thinking Patterns</div>
                      <p className="text-sm whitespace-pre-wrap">{selected.report.thinkingPatterns}</p>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Identified Themes</div>
                      <ul className="list-disc list-inside text-sm">
                        {selected.report.keyProblems.map((p,i)=> <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">General Reflection</div>
                      <p className="text-sm whitespace-pre-wrap">{selected.report.generalReflection}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3 border">
                      <div className="font-semibold text-blue-800 dark:text-blue-100 mb-1">Personalized Wellness Recommendation</div>
                      <p className="text-sm text-blue-900/90 dark:text-blue-100/90">{selected.report.wellnessRecommendations}</p>
                    </div>
                    <p className="text-xs text-slate-500">Disclaimer: AI-generated insights; not a substitute for professional advice.</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No report found for this chat.</p>
                )}

                <div className="rounded-xl border bg-white/70 dark:bg-slate-900/50 p-4">
                  <div className="font-semibold mb-2">Messages</div>
                  <div className="max-h-[40vh] overflow-y-auto space-y-2 text-sm">
                    {selected.messages.map((m,i)=> (
                      <div key={i} className={`px-3 py-2 rounded-xl ${m.from==='user' ? 'bg-forest-100 dark:bg-forest-900/30' : 'bg-slate-100 dark:bg-slate-800/80'}`}>
                        <div className="text-xs opacity-60">{m.from==='user'?'User':'Bot'} • {new Date(m.ts).toLocaleTimeString()}</div>
                        <div className="whitespace-pre-wrap">{m.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
