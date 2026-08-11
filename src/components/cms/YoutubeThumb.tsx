import { getYoutubeThumbnailUrl } from '../../lib/youtube'

// Card-thumbnail preview for an Item with a youtubeUrl — a static thumbnail
// image with a play badge, not a live iframe, since these render inside
// ItemLink which may itself be an <a>/<Link> (an iframe can't nest inside
// an anchor). The real embed only appears on the item's own detail page.
export default function YoutubeThumb({ videoId }: { videoId: string }) {
  return (
    <div className="relative h-full w-full">
      <img
        src={getYoutubeThumbnailUrl(videoId)}
        alt=""
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-ink-950/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-950/70">
          <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-sand-50">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
