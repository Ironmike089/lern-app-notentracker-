export function timeBasedGreeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 5) return 'Guten Abend'
  if (hour < 11) return 'Guten Morgen'
  if (hour < 18) return 'Guten Tag'
  return 'Guten Abend'
}
