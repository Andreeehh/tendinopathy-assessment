const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'])

export function isValidYoutubeUrl(value: string): boolean {
  if (!value.trim()) return true

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    if (!youtubeHosts.has(url.hostname.toLocaleLowerCase())) return false
    if (url.hostname === 'youtu.be') return url.pathname.length > 1
    return (
      (url.pathname === '/watch' && Boolean(url.searchParams.get('v'))) ||
      url.pathname.startsWith('/shorts/') ||
      url.pathname.startsWith('/embed/')
    )
  } catch {
    return false
  }
}

export function getYoutubeEmbedUrl(value: string): string | null {
  if (!isValidYoutubeUrl(value)) return null

  const url = new URL(value)
  const videoId =
    url.hostname === 'youtu.be'
      ? url.pathname.slice(1)
      : url.searchParams.get('v') ??
        url.pathname.split('/').filter(Boolean).slice(-1)[0]

  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}
