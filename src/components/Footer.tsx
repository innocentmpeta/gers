import { useEffect, useState } from 'react'
import { listAllVisiblePartners } from '../lib/firestore/partnerProfiles'
import { getMediaAsset } from '../lib/firestore/media'
import type { MediaAsset, PartnerProfile } from '../types/models'

// Partner organisations (every participant's org, besides GDEnv/UJ who stay
// static below) get their logos shown here too — project-docs meeting
// notes: "the logos of these partner organisations must be displayed at
// the footer section."
export default function Footer() {
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [logos, setLogos] = useState<Record<string, MediaAsset>>({})

  useEffect(() => {
    listAllVisiblePartners().then(async (list) => {
      const withLogos = list.filter((p) => p.logoMediaId)
      setPartners(withLogos)
      const ids = [...new Set(withLogos.map((p) => p.logoMediaId).filter((id): id is string => !!id))]
      const assets = await Promise.all(ids.map((id) => getMediaAsset(id)))
      const map: Record<string, MediaAsset> = {}
      assets.forEach((a) => {
        if (a) map[a.id] = a
      })
      setLogos(map)
    })
  }, [])

  return (
    <footer className="border-t border-sand-200 bg-ink-950 text-sand-100">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm">
        <p className="font-display text-lg text-sand-50">GERS Symposium</p>
        <p className="mt-2 max-w-md text-slate-300">
          GDEnv, University of Johannesburg.
        </p>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-wide text-slate-400">In partnership with</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="rounded-md bg-sand-50 px-4 py-3">
              <img src="/GDEnv-logo.png" alt="Gauteng Department of Environment" className="h-8 w-auto" />
            </div>
            <div className="rounded-md bg-sand-50 px-4 py-3">
              <img src="/peets-logo.png" alt="UJ PEETS" className="h-8 w-auto" />
            </div>
            {partners.map((partner) => {
              const logo = partner.logoMediaId ? logos[partner.logoMediaId] : undefined
              if (!logo) return null
              return (
                <div key={partner.id} className="rounded-md bg-sand-50 px-4 py-3">
                  <img src={logo.fileUrl} alt={partner.name} className="h-8 w-auto" />
                </div>
              )
            })}
          </div>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          © {new Date().getFullYear()} GERS. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
