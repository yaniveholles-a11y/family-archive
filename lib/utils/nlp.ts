/**
 * NLP utilities for family archive
 */

export function parseName(fullName: string): { firstName: string; lastName: string; middleName?: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] }
  return { firstName: parts[0], middleName: parts.slice(1, -1).join(' '), lastName: parts[parts.length - 1] }
}

export function extractDates(text: string): Array<{ text: string; type: 'date' | 'year' | 'range' }> {
  const results: Array<{ text: string; type: 'date' | 'year' | 'range' }> = []
  const rangeRegex = /\b(1[789]\d{2}|20[0-2]\d)\s*[-–]\s*(1[789]\d{2}|20[0-2]\d)\b/g
  let match
  while ((match = rangeRegex.exec(text)) !== null) {
    results.push({ text: match[0], type: 'range' })
  }
  const yearRegex = /\b(1[789]\d{2}|20[0-2]\d)\b/g
  while ((match = yearRegex.exec(text)) !== null) {
    if (!results.some(r => r.text.includes(match![0]))) {
      results.push({ text: match[0], type: 'year' })
    }
  }
  return results
}

export function extractPlaces(text: string): string[] {
  const places: string[] = []
  const placePatterns = [/ב([א-ת]{2,})/g, /מ([א-ת]{2,})/g, /ל([א-ת]{2,})/g]
  for (const pattern of placePatterns) {
    let m
    while ((m = pattern.exec(text)) !== null) places.push(m[1])
  }
  return [...new Set(places)]
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function summarizeBio(text: string, maxSentences: number = 3): string {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean)
  return sentences.slice(0, maxSentences).join('. ') + '.'
}
