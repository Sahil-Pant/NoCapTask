const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then

  if (diff < MINUTE) return "just now"
  if (diff < HOUR) return `${Math.round(diff / MINUTE)}m ago`
  if (diff < DAY) return `${Math.round(diff / HOUR)}h ago`
  const days = Math.round(diff / DAY)
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  return `${Math.round(days / 30)}mo ago`
}

export function formatDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function formatDueDate(iso?: string): { label: string; overdue: boolean } {
  const date = formatDate(iso)
  if (!iso) return { label: "No due date", overdue: false }
  const overdue = new Date(iso).getTime() < Date.now()
  return { label: overdue ? `${date} (overdue)` : date, overdue }
}

export function formatHours(h?: number): string {
  if (h === undefined) return "—"
  if (h < 1) return `${Math.round(h * 60)}m`
  const whole = Math.floor(h)
  const mins = Math.round((h - whole) * 60)
  return mins ? `${whole}h ${mins}m` : `${whole}h`
}
