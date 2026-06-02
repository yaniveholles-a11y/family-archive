/**
 * Fuzzy Search — Fuse.js integration
 */
import Fuse, { type IFuseOptions, type FuseResultMatch } from 'fuse.js'

export type SearchableItem = {
  id: number | string
  type: 'person' | 'document' | 'photo' | 'event' | 'place' | 'family'
  title: string; subtitle?: string; description?: string; tags?: string[]
  url: string; image?: string; year?: number
}

const fuseOptions: IFuseOptions<SearchableItem> = {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'subtitle', weight: 2 },
    { name: 'description', weight: 1 },
    { name: 'tags', weight: 1.5 },
  ],
  threshold: 0.35, distance: 100, includeScore: true, includeMatches: true, minMatchCharLength: 2,
}

let fuseInstance: Fuse<SearchableItem> | null = null

export function initSearch(items: SearchableItem[]) {
  fuseInstance = new Fuse(items, fuseOptions)
}

export function search(query: string, options?: { type?: SearchableItem['type']; limit?: number }): Array<{ item: SearchableItem; score: number }> {
  if (!fuseInstance || !query.trim()) return []
  let results = fuseInstance.search(query)
  if (options?.type) results = results.filter(r => r.item.type === options.type)
  return results.slice(0, options?.limit ?? 20).map(r => ({ item: r.item, score: r.score ?? 0 }))
}

export function buildIndexFromData(data: { people?: any[]; families?: any[] }): SearchableItem[] {
  const items: SearchableItem[] = []
  data.people?.forEach(p => items.push({
    id: p.id, type: 'person', title: `${p.first_name} ${p.last_name}`,
    subtitle: p.birth_place || '', description: p.bio || '',
    url: `/people/${p.id}`, image: p.photo_url,
  }))
  data.families?.forEach(f => items.push({
    id: f.id, type: 'family', title: f.name,
    subtitle: f.name_en || '', url: `/families/${f.id}`, image: f.image_url,
  }))
  return items
}
