import type { Symposium } from '../types/models'

// Every date ('YYYY-MM-DD') from startDate to endDate inclusive — generated
// rather than hardcoded "Day 1"/"Day 2" so a symposium of any length works
// without a code change. Plain string arithmetic (not Date parsing) avoids
// timezone-shift bugs with bare date strings.
export function getSymposiumDays(symposium: Pick<Symposium, 'startDate' | 'endDate'>): string[] {
  if (!symposium.startDate || !symposium.endDate) return []
  const days: string[] = []
  let cursor = new Date(`${symposium.startDate}T00:00:00Z`)
  const end = new Date(`${symposium.endDate}T00:00:00Z`)
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  }
  return days
}

export function formatSymposiumDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
