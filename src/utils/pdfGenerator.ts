import { ChatSession } from './chatStore'
import { ConversationReport } from './report'

async function ensureHtml2Pdf() {
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

function renderPrintable(report: ConversationReport, s: ChatSession) {
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

    const addSection = (title: string, body: HTMLElement) => {
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

    const mkText = (txt: string) => { const d = document.createElement('div'); d.textContent = txt || '—'; return d }

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
        ; (Array.isArray(report.keyProblems) ? report.keyProblems : ['—']).forEach(item => {
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

export async function exportToPdf(session: ChatSession) {
    if (!session.report) return
    await ensureHtml2Pdf()
    const printable = renderPrintable(session.report, session)
    const w = window as any
    const opt = {
        margin: [12, 12, 12, 12],
        filename: `chat_report_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    }
    try {
        w.html2pdf().set(opt).from(printable).save()
    } catch (e) {
        throw new Error('Failed to generate PDF')
    }
}

export async function getPdfBlob(session: ChatSession): Promise<Blob | null> {
    if (!session.report) return null
    await ensureHtml2Pdf()
    const printable = renderPrintable(session.report, session)
    const w = window as any
    const opt = {
        margin: [12, 12, 12, 12],
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    }
    try {
        const worker = w.html2pdf().set(opt).from(printable)
        const blob: Blob = await worker.outputPdf('blob')
        return blob
    } catch { return null }
}

export async function getPdfDataUri(session: ChatSession): Promise<string | null> {
    if (!session.report) return null
    await ensureHtml2Pdf()
    const printable = renderPrintable(session.report, session)
    const w = window as any
    const opt = {
        margin: [12, 12, 12, 12],
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    }
    try {
        const worker = w.html2pdf().set(opt).from(printable)
        const dataUri: string = await worker.outputPdf('datauristring')
        return dataUri
    } catch { return null }
}
