import { useEffect, useState } from 'react'
import HeroBlock from '../../../components/cms/HeroBlock'
import RichText from '../../../components/RichText'
import { usePageHero } from '../cms/usePageHero'
import { listVisiblePartners } from '../../../lib/firestore/partnerProfiles'
import { getMediaAsset } from '../../../lib/firestore/media'
import type { MediaAsset, PartnerProfile } from '../../../types/models'

// Exhibitor cards are organisation-first — heading is the org name, the
// submitting person's own name + website sit below (Stacey Bailie,
// 2026-08-04: "their card would have the Organisation as the heading, and
// their own name at the bottom with the website, unlike speakers and
// facilitators where the heading is their own name").
export default function Exhibition() {
  const { hero, loading: heroLoading } = usePageHero('exhibition')
  const [exhibitors, setExhibitors] = useState<PartnerProfile[]>([])
  const [logos, setLogos] = useState<Record<string, MediaAsset>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listVisiblePartners('exhibitor').then(async (list) => {
      setExhibitors(list)
      const ids = [...new Set(list.map((p) => p.logoMediaId).filter((id): id is string => !!id))]
      const assets = await Promise.all(ids.map((id) => getMediaAsset(id)))
      const map: Record<string, MediaAsset> = {}
      assets.forEach((a) => {
        if (a) map[a.id] = a
      })
      setLogos(map)
      setLoading(false)
    })
  }, [])

  if (heroLoading || loading) return null

  return (
    <div>
      <HeroBlock hero={hero} />
      <div className="mx-auto max-w-6xl px-6 py-16">
        {exhibitors.length === 0 ? (
          <p className="text-slate-500">Exhibitors will be announced here soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exhibitors.map((exhibitor) => {
              const logo = exhibitor.logoMediaId ? logos[exhibitor.logoMediaId] : undefined
              return (
                <div key={exhibitor.id} className="overflow-hidden rounded-lg border border-sand-200 bg-white">
                  <div className="flex aspect-[3/2] items-center justify-center bg-sand-100 p-6">
                    {logo && (
                      <img src={logo.fileUrl} alt={logo.altText} className="max-h-full max-w-full object-contain" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-lg text-ink-900">{exhibitor.name}</p>
                    {exhibitor.blurb && (
                      <p className="mt-2 text-sm text-slate-500">
                        <RichText text={exhibitor.blurb} />
                      </p>
                    )}
                    {(exhibitor.contactName || exhibitor.websiteUrl) && (
                      <p className="mt-3 text-sm text-slate-400">
                        {exhibitor.contactName}
                        {exhibitor.contactName && exhibitor.websiteUrl && ' · '}
                        {exhibitor.websiteUrl && (
                          <a
                            href={exhibitor.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gold-600 underline"
                          >
                            Visit website
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
