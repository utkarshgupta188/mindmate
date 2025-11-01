// Frontend demo-only in-memory store (to avoid native sqlite bindings in the browser build)
type NewsRow = { id: string; title: string; link: string; source: string; category: string; ts: number }
const NEWS: NewsRow[] = []

export const insertItem = {
  run({ id, title, link, source, category, ts }: NewsRow) {
    if (!NEWS.some(n => n.id === id)) NEWS.push({ id, title, link, source, category, ts })
  }
}

export const selectByCategory = {
  all({ category, limit }: { category: string; limit: number }) {
    const rows = category === 'all' ? NEWS : NEWS.filter(n => n.category === category)
    return rows.sort((a,b)=> b.ts - a.ts).slice(0, limit)
  }
}

export const insertPref = {
  run(user_id: string, action: string, payload: string, ts: number){
    // no-op for browser build
    void user_id; void action; void payload; void ts
  }
}
