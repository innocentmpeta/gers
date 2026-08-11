// Accepts watch/share/shorts/embed URL shapes and returns the bare 11-char
// video id, or null if the text isn't a recognisable YouTube URL — content
// managers paste whatever URL YouTube gave them, not a normalised one.
export function getYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function getYoutubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export function getYoutubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}
