import { useEffect, useState } from 'react'
import HeroBlock from '../../../components/cms/HeroBlock'
import RichText from '../../../components/RichText'
import { usePageHero } from '../cms/usePageHero'
import { listVisibleSpeakers } from '../../../lib/firestore/speakers'
import { getMediaAsset } from '../../../lib/firestore/media'
import type { MediaAsset, Speaker, SpeakerRole } from '../../../types/models'

const GROUP_LABEL: Record<SpeakerRole, string> = {
  presenter: 'Speakers',
  facilitator: 'Facilitators',
}
const GROUP_ORDER: SpeakerRole[] = ['presenter', 'facilitator']

function SpeakerCard({ speaker, photo }: { speaker: Speaker; photo?: MediaAsset }) {
  return (
    <div id={speaker.id} className="scroll-mt-32 overflow-hidden rounded-lg border border-sand-200 bg-white">
      <div className="aspect-square bg-sand-100">
        {photo && <img src={photo.fileUrl} alt={photo.altText} className="h-full w-full object-cover" />}
      </div>
      <div className="p-5">
        <p className="text-lg text-ink-900">{speaker.name}</p>
        {speaker.title && <p className="mt-1 text-sm text-gold-600">{speaker.title}</p>}
        {speaker.bio && (
          <p className="mt-2 text-sm text-slate-500">
            <RichText text={speaker.bio} />
          </p>
        )}
      </div>
    </div>
  )
}

// Presenters and facilitators show together on one "Experts" page, grouped
// into a Speakers section and a Facilitators section (each in the order set
// from admin) rather than fully interleaved — per organiser feedback
// 2026-08-12 asking for cards to be reorderable and grouped.
export default function Speakers() {
  const { hero, loading: heroLoading } = usePageHero('speakers')
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [photos, setPhotos] = useState<Record<string, MediaAsset>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listVisibleSpeakers().then(async (list) => {
      setSpeakers(list)
      const ids = [...new Set(list.map((s) => s.photoMediaId).filter((id): id is string => !!id))]
      const assets = await Promise.all(ids.map((id) => getMediaAsset(id)))
      const map: Record<string, MediaAsset> = {}
      assets.forEach((a) => {
        if (a) map[a.id] = a
      })
      setPhotos(map)
      setLoading(false)
    })
  }, [])

  if (heroLoading || loading) return null

  return (
    <div>
      <HeroBlock hero={hero} />
      <div className="mx-auto max-w-6xl px-6 py-16">
        {speakers.length === 0 ? (
          <p className="text-slate-500">Experts will be announced here soon.</p>
        ) : (
          <div className="flex flex-col gap-14">
            {GROUP_ORDER.map((role) => {
              const group = speakers.filter((s) => s.role === role)
              if (group.length === 0) return null
              return (
                <div key={role}>
                  <h2 className="text-2xl text-ink-900">{GROUP_LABEL[role]}</h2>
                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {group.map((speaker) => (
                      <SpeakerCard
                        key={speaker.id}
                        speaker={speaker}
                        photo={speaker.photoMediaId ? photos[speaker.photoMediaId] : undefined}
                      />
                    ))}
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
