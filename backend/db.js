// In-memory store to avoid native modules on Windows.
const news = []   // { id, title, link, source, category, ts }
const prefs = []  // { user_id, action, payload, ts }

export const insertItem = {
  run({ id, title, link, source, category, ts }) {
    if (!news.some(n => n.id === id)) news.push({ id, title, link, source, category, ts })
  }
}

export const selectByCategory = {
  all({ category, limit }) {
    const arr = category === 'all' ? news : news.filter(n => n.category === category)
    return arr.sort((a,b) => b.ts - a.ts).slice(0, limit)
  }
}

export const insertPref = {
  run(user_id, action, payload, ts) {
    prefs.push({ user_id, action, payload, ts })
  }
}

export const __memory = { news, prefs } // optional for debugging
