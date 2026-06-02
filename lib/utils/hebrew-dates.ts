/**
 * Hebrew Dates — @hebcal/core integration
 */
import { HDate, HebrewCalendar } from '@hebcal/core'

export function toHebrewDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    const hd = new HDate(date)
    return hd.toString()
  } catch { return '' }
}

export function getHebrewYear(dateStr: string): number {
  try {
    const hd = new HDate(new Date(dateStr))
    return hd.getFullYear()
  } catch { return 0 }
}

export function formatDualDate(dateStr: string): { gregorian: string; hebrew: string; combined: string } {
  try {
    const date = new Date(dateStr)
    const gregorian = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    const hebrew = toHebrewDate(dateStr)
    return { gregorian, hebrew, combined: `${gregorian} (${hebrew})` }
  } catch { return { gregorian: dateStr, hebrew: '', combined: dateStr } }
}

export function getHolidays(year?: number): Array<{ name: string; hebrewDate: string; gregorianDate: string }> {
  try {
    const y = year || new HDate().getFullYear()
    const events = HebrewCalendar.calendar({ year: y, isHebrewYear: true, candlelighting: false, sedrot: false, omer: false, il: true })
    return events.map(ev => ({
      name: ev.render('he'),
      hebrewDate: ev.getDate().toString(),
      gregorianDate: ev.getDate().greg().toISOString().split('T')[0],
    }))
  } catch { return [] }
}
