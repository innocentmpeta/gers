import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroBlock from '../../../components/cms/HeroBlock'
import { usePageHero } from '../cms/usePageHero'
import { getHomeContent } from '../../../lib/firestore/homeContent'
import { getMediaAsset } from '../../../lib/firestore/media'
import type { HomeContent, MediaAsset } from '../../../types/models'

function CardLink({ link, className, children }: { link: string; className: string; children: React.ReactNode }) {
  return link.startsWith('http') ? (
    <a href={link} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link to={link || '/'} className={className}>
      {children}
    </Link>
  )
}

export default function Home() {
  const { page, hero, loading: heroLoading } = usePageHero('home')
  const [content, setContent] = useState<HomeContent | null>(null)
  const [images, setImages] = useState<Record<string, MediaAsset>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!page) return
    getHomeContent(page.id).then(async (c) => {
      setContent(c)
      const ids = [
        c?.introImageId,
        ...(c?.exploreCards.map((card) => card.imageId) ?? []),
      ].filter((id): id is string => !!id)
      const assets = await Promise.all([...new Set(ids)].map((id) => getMediaAsset(id)))
      const map: Record<string, MediaAsset> = {}
      assets.forEach((a) => {
        if (a) map[a.id] = a
      })
      setImages(map)
      setLoading(false)
    })
  }, [page])

  if (heroLoading || (page && loading)) return null

  const hasIntro = content?.introHeading || content?.introBody || content?.introImageId
  const hasCards = content?.exploreCards.some((c) => c.title)
  const hasCta = content?.ctaHeading || content?.ctaButtonLabel

  return (
    <div>
      <HeroBlock hero={hero} size="large" />

      {hasIntro && (
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col items-center gap-10 md:flex-row">
            {content?.introImageId && images[content.introImageId] && (
              <div className="aspect-[4/3] w-full flex-1 overflow-hidden rounded-lg bg-sand-100">
                <img
                  src={images[content.introImageId].fileUrl}
                  alt={images[content.introImageId].altText}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              {content?.introEyebrow && (
                <p className="text-sm uppercase tracking-wide text-ochre-600">{content.introEyebrow}</p>
              )}
              {content?.introHeading && <h2 className="mt-2 text-3xl">{content.introHeading}</h2>}
              {content?.introBody && <p className="mt-3 text-slate-600">{content.introBody}</p>}
            </div>
          </div>
        </div>
      )}

      {hasCards && (
        <div className="bg-sand-100 py-16">
          <div className="mx-auto max-w-6xl px-6">
            {(content?.exploreEyebrow || content?.exploreHeading || content?.exploreSubtext) && (
              <div className="mb-10 max-w-2xl">
                {content?.exploreEyebrow && (
                  <p className="text-sm uppercase tracking-wide text-ochre-600">{content.exploreEyebrow}</p>
                )}
                {content?.exploreHeading && <h2 className="mt-2 text-3xl">{content.exploreHeading}</h2>}
                {content?.exploreSubtext && <p className="mt-3 text-slate-600">{content.exploreSubtext}</p>}
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {content?.exploreCards
                .filter((c) => c.title)
                .map((card, i) => (
                  <CardLink
                    key={i}
                    link={card.link}
                    className="group flex flex-col overflow-hidden rounded-lg border border-sand-200 bg-white transition-shadow hover:shadow-md"
                  >
                    <div className="aspect-[4/3] bg-sand-100">
                      {card.imageId && images[card.imageId] && (
                        <img
                          src={images[card.imageId].fileUrl}
                          alt={images[card.imageId].altText}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-lg text-teal-900 group-hover:underline">{card.title}</h3>
                      {card.body && <p className="mt-1 text-sm text-slate-500">{card.body}</p>}
                    </div>
                  </CardLink>
                ))}
            </div>
          </div>
        </div>
      )}

      {hasCta && (
        <div className="bg-teal-900 py-16 text-center text-sand-50">
          <div className="mx-auto max-w-2xl px-6">
            {content?.ctaEyebrow && (
              <p className="text-sm uppercase tracking-wide text-ochre-500">{content.ctaEyebrow}</p>
            )}
            {content?.ctaHeading && <h2 className="mt-2 text-3xl text-sand-50">{content.ctaHeading}</h2>}
            {content?.ctaSubtext && <p className="mt-3 text-slate-200">{content.ctaSubtext}</p>}
            {content?.ctaButtonLabel && content?.ctaButtonLink && (
              <CardLink
                link={content.ctaButtonLink}
                className="mt-6 inline-flex items-center rounded-full bg-ochre-500 px-6 py-3 text-sm font-medium text-sand-50 hover:bg-ochre-600"
              >
                {content.ctaButtonLabel}
              </CardLink>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
