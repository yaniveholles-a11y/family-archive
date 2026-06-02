# Family Archive — Tech Stack מתקדם

## מותקן ומוכן לשימוש

### 🌍 גלובוס ומפות
| ספרייה | גרסה | מה עושה | איפה משתמשים |
|---------|-------|---------|-------------|
| globe.gl | 2.31 | גלובוס 3D עם נקודות, קשתות, טבעות | `/map` — GlobeView |
| Three.js | (דרך globe.gl) | כוכבים, אטמוספרה, post-processing | `/map` — אפקטים |
| MapLibre GL | 4.7 | מפה 2D למבט עירוני | `/map` — CityView |
| Leaflet | 1.9 | מפה ברחוב עם markers | `/map` — StreetView |
| Nominatim | API | Geocoding חינמי (שם→קורדינטות) | `/map` — geocode() |

### 🌳 עץ משפחה
| ספרייה | גרסה | מה עושה | איפה |
|---------|-------|---------|------|
| React Flow | 11.11 | Canvas אינטראקטיבי לעץ | `/families/[id]/tree` |
| dagre | 0.8.5 | Layout אוטומטי hierarchical | FamilyTree.tsx |
| ELK.js | 0.11.1 | Layout מתקדם (Eclipse Kernel) — טוב יותר מdagre לעצים מורכבים | `lib/utils/elkjs-layout.ts` |

### 🎬 אנימציות
| ספרייה | גרסה | מה עושה | איפה |
|---------|-------|---------|------|
| GSAP | 3.15 | אנימציות מורכבות, ScrollTrigger, timelines | כל האתר |
| Framer Motion | 12.40 | אנימציות React — hover, enter/exit, spring | Components |
| Lenis | 1.3 | Smooth scroll קולנועי | `lib/utils/smooth-scroll.ts` |

### 📅 תאריכים
| ספרייה | גרסה | מה עושה | איפה |
|---------|-------|---------|------|
| @hebcal/core | ✅ | תאריך עברי, יארצייט, חגים | `lib/utils/hebrew-dates.ts` |

### 🔍 חיפוש
| ספרייה | גרסה | מה עושה | איפה |
|---------|-------|---------|------|
| Fuse.js | ✅ | Fuzzy search עברית+אנגלית, weighted fields | `lib/utils/search.ts` |

### 🖼️ מדיה
| ספרייה | גרסה | מה עושה | איפה |
|---------|-------|---------|------|
| Wavesurfer.js | ✅ | נגן אודיו עם waveform | `components/media/AudioPlayer.tsx` |
| Swiper | 12.2 | Carousel/slider מתקדם עם touch | גלריות, תמונות |
| react-masonry-css | 1.0 | Layout גלריה masonry | `/gallery` |
| yet-another-react-lightbox | ✅ | Lightbox לתמונות | `/gallery` |

### 📄 מסמכים ויצוא
| ספרייה | גרסה | מה עושה | איפה |
|---------|-------|---------|------|
| Tesseract.js | 7.0 | OCR — קריאת טקסט מתמונות (עב/אנ/גר/פול) | `lib/utils/ocr.ts` |
| jsPDF | 4.2 | יצירת PDF | `lib/utils/export.ts` |
| html2canvas | 1.4 | צילום מסך DOM → PNG | `lib/utils/export.ts` |

### 🧠 NLP ועיבוד טקסט
| ספרייה | גרסה | מה עושה | איפה |
|---------|-------|---------|------|
| compromise | ✅ | חילוץ שמות, תאריכים, מקומות מטקסט | `lib/utils/nlp.ts` |

### 🌐 i18n
| ספרייה | גרסה | מה עושה | איפה |
|---------|-------|---------|------|
| next-intl | 4.12 | תרגומים HE/EN/NL/DE | כל האתר |

### 🗃️ Backend
| ספרייה | גרסה | מה עושה | איפה |
|---------|-------|---------|------|
| Supabase JS | 2.105 | Database, Auth, Storage, Realtime | `lib/supabase.ts` |
| Supabase SSR | 0.10 | Server-side rendering עם Supabase | API routes |

---

## מודולים שנבנו (מוכן לשימוש)

### `lib/utils/hebrew-dates.ts`
```typescript
import { toHebrewDate, getYahrzeits, formatDualDate, isNearYahrzeit } from '@/lib/utils/hebrew-dates'

// המרת תאריך
toHebrewDate('1920-03-14') // → "י"ד אדר תר"פ"

// יארצייט הבא
getYahrzeits('1943-05-01', 5) // → [{hebrewDate, gregorianDate, year}]

// תצוגה כפולה
formatDualDate('1920-03-14') // → {gregorian: "14 במרץ 1920", hebrew: "...", combined: "..."}

// האם קרוב ליארצייט?
isNearYahrzeit('1943-05-01', 30) // → true/false
```

### `lib/utils/search.ts`
```typescript
import { initSearch, search, buildIndexFromData, highlightMatch } from '@/lib/utils/search'

// בנה אינדקס
const items = buildIndexFromData({ people, families, documents })
initSearch(items)

// חפש
const results = search('כהן', { type: 'person', limit: 10 })
results.forEach(r => console.log(r.item.title, r.score))
```

### `lib/utils/ocr.ts`
```typescript
import { recognizeText, extractDocument } from '@/lib/utils/ocr'

// OCR על תמונה
const result = await recognizeText(imageFile)
console.log(result.text, result.confidence)

// חילוץ מסמך מלא
const doc = await extractDocument(imageUrl)
console.log(doc.paragraphs, doc.language)
```

### `lib/utils/export.ts`
```typescript
import { captureAsPng, captureAsPdf, exportTree } from '@/lib/utils/export'

// יצוא עץ כתמונה
await exportTree(treeElement, 'כהן')

// יצוא כPDF
await captureAsPdf(element, 'profile.pdf', { title: 'פרופיל משפחתי' })
```

### `lib/utils/smooth-scroll.ts`
```typescript
import { initSmoothScroll, scrollTo, stopScroll, resumeScroll } from '@/lib/utils/smooth-scroll'

// הפעלה (פעם אחת ב-layout)
initSmoothScroll({ lerp: 0.08, duration: 1.4 })

// גלילה לאלמנט
scrollTo('#section-gallery', { offset: -80 })

// עצור (למודל/popup)
stopScroll()
resumeScroll()
```

### `lib/utils/nlp.ts`
```typescript
import { parseName, extractDates, extractPlaces } from '@/lib/utils/nlp'

// פרסור שם
parseName('אברהם יצחק כהן') // → {first: 'אברהם', middle: 'יצחק', last: 'כהן'}

// חילוץ תאריכים מטקסט
extractDates('נולד ב-1920 בוורשה ונפטר ב-1943 בטרבלינקה')

// חילוץ מקומות
extractPlaces('גר בוורשה ואחר כך עבר לברלין')
```

### `components/media/AudioPlayer.tsx`
```tsx
import AudioPlayer from '@/components/media/AudioPlayer'

<AudioPlayer
  url="/audio/interview-grandpa.mp3"
  title="ראיון עם סבא"
  personName="אברהם כהן"
  date="1995"
/>
```

---

## מה עוד אפשר להוסיף (שלב הבא)

| טכנולוגיה | מה עושה | עדיפות |
|-----------|---------|--------|
| Cloudinary | שיפור תמונות ישנות אוטומטי (URL-based) | 🔴 גבוה |
| deck.gl | Globe view מתקדם יותר עם WebGPU | 🟡 בינוני |
| Supabase Realtime | עדכונים בזמן אמת בין משתמשים | 🟡 בינוני |
| TanStack Query | Caching ו-mutation management | 🟡 בינוני |
| Workbox / PWA | תמיכה offline ו-install | 🟢 נמוך |
| React Chrono | Timeline component מתקדם | 🟢 נמוך |
| StPageFlip | אפקט ספר עם דפדוף | 🟢 נמוך |

---

## ארכיטקטורה

```
Family Archive
├── lib/
│   ├── supabase.ts              # Supabase client
│   └── utils/
│       ├── hebrew-dates.ts      # @hebcal/core — תאריכים עבריים
│       ├── search.ts            # Fuse.js — חיפוש fuzzy
│       ├── ocr.ts               # Tesseract.js — OCR מסמכים
│       ├── export.ts            # html2canvas + jsPDF — יצוא
│       ├── smooth-scroll.ts     # Lenis + GSAP — גלילה חלקה
│       ├── nlp.ts               # compromise — עיבוד טקסט
│       └── elkjs-layout.ts      # ELK.js — layout עצים מורכב
│
├── components/
│   ├── FamilyTree.tsx           # React Flow + dagre/elkjs + GSAP + Framer
│   ├── Globe.tsx                # globe.gl + Three.js
│   ├── Navbar.tsx               # Navigation
│   └── media/
│       └── AudioPlayer.tsx      # Wavesurfer.js — נגן אודיו
│
├── app/[locale]/
│   ├── map/
│   │   ├── GlobeView.tsx        # globe.gl + Three.js + GSAP
│   │   ├── CityView.tsx         # MapLibre GL
│   │   ├── StreetView.tsx       # Leaflet
│   │   └── page.tsx             # Framer Motion sidebar + Journey Playback
│   │
│   ├── families/[id]/tree/
│   │   └── page.tsx             # GSAP entrance + Framer Motion
│   └── ...
```
