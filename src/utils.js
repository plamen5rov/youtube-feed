export function formatDuration(isoDuration) {
  if (!isoDuration) return null
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return null
  const hours = parseInt(match[1]) || 0
  const minutes = parseInt(match[2]) || 0
  const seconds = parseInt(match[3]) || 0
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function getDurationSeconds(isoDuration) {
  if (!isoDuration) return 0
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1]) || 0
  const minutes = parseInt(match[2]) || 0
  const seconds = parseInt(match[3]) || 0
  return hours * 3600 + minutes * 60 + seconds
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
