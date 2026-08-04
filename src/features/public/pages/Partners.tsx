import { useEffect, useState } from 'react'
import HeroBlock from '../../../components/cms/HeroBlock'
import RichText from '../../../components/RichText'
import { usePageHero } from '../cms/usePageHero'
import { listAllVisiblePartners } from '../../../lib/firestore/partnerProfiles'
import { getMediaAsset } from '../../../lib/firestore/media'
import type { MediaAsset, PartnerProfile } from '../../../types/models'

// Flat, unified list — no category tabs. Per Stacey Bailie's 2026-08-04
// email: "the page called Partners need not distinguish between
// facilitators, exhibitors, sponsors... it's actually just the
// organisations that participants represent... displayed equally,
// preferably in alphabetical order" (listAllVisiblePartners already sorts).
export default function Partners() {
  const { hero, loading: heroLoading } = usePageHero('partners')
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [logos, setLogos] = useState<Record<string, MediaAsset>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAllVisiblePartners().then(async (list) => {
      setPartners(list)
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
        {partners.length === 0 ? (
          <p className="text-slate-500">Partners will be announced here soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => {
              const logo = partner.logoMediaId ? logos[partner.logoMediaId] : undefined
              return (
                <div key={partner.id} className="overflow-hidden rounded-lg border border-sand-200 bg-white">
                  <div className="flex aspect-[3/2] items-center justify-center bg-sand-100 p-6">
                    {logo && (
                      <img src={logo.fileUrl} alt={logo.altText} className="max-h-full max-w-full object-contain" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-lg text-ink-900">{partner.name}</p>
                    {partner.blurb && (
                      <p className="mt-2 text-sm text-slate-500">
                        <RichText text={partner.blurb} />
                      </p>
                    )}
                    {partner.websiteUrl && (
                      <a
                        href={partner.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm text-gold-600 underline"
                      >
                        Visit website
                      </a>
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
