import { useEffect, useState } from 'react'
import HeroBlock from '../../../components/cms/HeroBlock'
import RichText from '../../../components/RichText'
import { usePageHero } from '../cms/usePageHero'
import { listVisiblePartners } from '../../../lib/firestore/partnerProfiles'
import { getMediaAsset } from '../../../lib/firestore/media'
import type { MediaAsset, PartnerCategory, PartnerProfile } from '../../../types/models'

const CATEGORY_LABEL: Record<PartnerCategory, string> = {
  partner: 'Partners',
  exhibitor: 'Exhibitors',
  facilitator: 'Facilitators',
}

export default function Partners() {
  const { hero, loading: heroLoading } = usePageHero('partners')
  const [category, setCategory] = useState<PartnerCategory>('partner')
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [logos, setLogos] = useState<Record<string, MediaAsset>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listVisiblePartners(category).then(async (list) => {
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
  }, [category])

  if (heroLoading) return null

  return (
    <div>
      <HeroBlock hero={hero} />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex gap-2 text-sm">
          {(['partner', 'exhibitor', 'facilitator'] as PartnerCategory[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 transition-colors ${
                category === c
                  ? 'bg-ink-900 text-sand-50'
                  : 'bg-sand-100 text-slate-700 hover:bg-sand-200'
              }`}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        {loading ? null : partners.length === 0 ? (
          <p className="mt-8 text-slate-500">
            {CATEGORY_LABEL[category]} will be announced here soon.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
