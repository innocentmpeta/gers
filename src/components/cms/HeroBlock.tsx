import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { getMediaAsset } from '../../lib/firestore/media'
import { useHeroOverlay } from '../../lib/heroOverlay'
import type { Hero, MediaAsset } from '../../types/models'

function formatDateRange(start?: string, end?: string): string | null {
  if (!start) return null
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = end && end !== start ? new Date(`${end}T00:00:00`) : null
  const longFmt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

  if (!endDate) return startDate.toLocaleDateString(undefined, longFmt)

  const sameMonth =
    startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()
  const startFmt = startDate.toLocaleDateString(
    undefined,
    sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'long' }
  )
  return `${startFmt} – ${endDate.toLocaleDateString(undefined, longFmt)}`
}

function CtaButton({ label, link, primary }: { label: string; link: string; primary: boolean }) {
  const external = link.startsWith('http')
  const className = primary
    ? 'rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600'
    : 'rounded-full border border-sand-50 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-sand-50/10'

  return external ? (
    <a href={link} className={className}>
      {label}
    </a>
  ) : (
    <Link to={link} className={className}>
      {label}
    </Link>
  )
}

interface HeroBlockProps {
  hero: Hero | null
  // 'large' is reserved for the homepage — every other page gets 'compact'
  // so they read as distinct from Home rather than all looking the same.
  size?: 'large' | 'compact'
}

export default function HeroBlock({ hero, size = 'compact' }: HeroBlockProps) {
  const [image, setImage] = useState<MediaAsset | null>(null)
  const { setHasHero } = useHeroOverlay()

  // Renders whenever there's a headline or an image — matches the fallback
  // rule from the CMS spec: no image still shows the solid brand-colour
  // section below, which is dark enough for the header to overlay on too.
  const shouldRender = !!hero && !!(hero.headline || hero.imageId)

  useEffect(() => {
    if (hero?.imageId) {
      getMediaAsset(hero.imageId).then(setImage)
    } else {
      setImage(null)
    }
  }, [hero?.imageId])

  useEffect(() => {
    setHasHero(shouldRender)
    return () => setHasHero(false)
  }, [shouldRender, setHasHero])

  if (!shouldRender) return null

  const objectPosition = hero.focalPoint ? `${hero.focalPoint.x}% ${hero.focalPoint.y}%` : 'center'
  const dateRange = formatDateRange(hero.eventStartDate, hero.eventEndDate)

  return (
    <section
      className={clsx(
        'relative flex items-end overflow-hidden bg-ink-900 text-sand-50',
        size === 'large' ? 'min-h-[85vh]' : 'min-h-[45vh]'
      )}
    >
      {image && (
        <img
          src={image.fileUrl}
          alt={image.altText}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition }}
        />
      )}
      {/* Vignette, not a bottom-only fade: the top needs to stay dark too, since
          the nav floats transparently over it and needs readable contrast. */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/25 to-ink-950/90" />
      <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-28">
        {hero.eyebrowText && (
          <p className="text-sm uppercase tracking-wide text-gold-500">{hero.eyebrowText}</p>
        )}
        {hero.headline && <h1 className="mt-2 max-w-2xl text-5xl text-sand-50">{hero.headline}</h1>}
        {hero.subtext && <p className="mt-4 max-w-xl text-slate-200">{hero.subtext}</p>}
        {dateRange && <p className="mt-3 text-xl font-medium text-gold-500">{dateRange}</p>}
        {(hero.cta1Label || hero.cta2Label) && (
          <div className="mt-6 flex gap-3">
            {hero.cta1Label && hero.cta1Link && (
              <CtaButton label={hero.cta1Label} link={hero.cta1Link} primary />
            )}
            {hero.cta2Label && hero.cta2Link && (
              <CtaButton label={hero.cta2Label} link={hero.cta2Link} primary={false} />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
