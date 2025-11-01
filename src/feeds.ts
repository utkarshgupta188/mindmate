export type Feed = { url: string; category: string }

export const FEEDS: Record<string, Feed[]> = {
  uplifting: [
    { url: 'https://www.goodnewsnetwork.org/feed/', category: 'uplifting' },
    { url: 'https://www.positive.news/feed/', category: 'uplifting' },
  ],
  science: [
    { url: 'https://www.sciencedaily.com/rss/top/health.xml', category: 'science' },
    { url: 'https://www.nature.com/subjects/health-sciences.rss', category: 'science' },
  ],
  environment: [
    { url: 'https://www.eenews.net/latest/rss/', category: 'environment' },
  ],
  health: [
    { url: 'https://www.medicalnewstoday.com/rss', category: 'health' },
  ],
  education: [
    { url: 'https://www.edutopia.org/feeds/latest', category: 'education' },
  ],
  community: [
    { url: 'https://www.indiawaterportal.org/rss.xml', category: 'community' },
  ],
  business: [
    { url: 'https://www.forbes.com/innovation/feed/', category: 'business' },
  ],
}
