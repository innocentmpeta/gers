import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMediaAsset } from '../../lib/firestore/media'
import { useHeroOverlay } from '../../lib/heroOverlay'
import type { Hero, MediaAsset } from '../../types/models'

function CtaButton({ label, link, primary }: { label: string; link: string; primary: boolean }) {
  const external = link.startsWith('http')
  const className = primary
    ? 'rounded-full bg-ochre-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-ochre-600'
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

export default function HeroBlock({ hero }: { hero: Hero | null }) {
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

  return (
    <section className="relative flex min-h-[480px] items-end overflow-hidden bg-teal-900 text-sand-50">
      {image && (
        <img
          src={image.fileUrl}
          alt={image.altText}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-teal-950/90 via-teal-950/40 to-transparent" />
      <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-28">
        {hero.eyebrowText && (
          <p className="text-sm uppercase tracking-wide text-ochre-500">{hero.eyebrowText}</p>
        )}
        {hero.headline && <h1 className="mt-2 max-w-2xl text-5xl text-sand-50">{hero.headline}</h1>}
        {hero.subtext && <p className="mt-4 max-w-xl text-slate-200">{hero.subtext}</p>}
        {hero.eventDate && <p className="mt-3 text-ochre-500">{hero.eventDate}</p>}
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
