import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import RichText from '../../../components/RichText'
import { listDirectoryUsers } from '../../../lib/firestore/users'
import { listCommunities, listAllOptIns } from '../../../lib/firestore/communities'
import { getDefaultSymposium } from '../../../lib/firestore/symposia'
import { getMediaAsset } from '../../../lib/firestore/media'
import type { MediaAsset, ThematicCommunity, User, UserCommunityOptIn } from '../../../types/models'

export default function Directory() {
  const [users, setUsers] = useState<User[]>([])
  const [photos, setPhotos] = useState<Record<string, MediaAsset>>({})
  const [communities, setCommunities] = useState<ThematicCommunity[]>([])
  const [optIns, setOptIns] = useState<UserCommunityOptIn[]>([])
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const symposium = await getDefaultSymposium()
      const [directoryUsers, comms, allOptIns] = await Promise.all([
        listDirectoryUsers(),
        symposium ? listCommunities(symposium.id) : Promise.resolve([]),
        listAllOptIns(),
      ])
      setUsers(directoryUsers)
      setCommunities(comms)
      setOptIns(allOptIns)

      const photoIds = [...new Set(directoryUsers.map((u) => u.photoMediaId).filter((id): id is string => !!id))]
      const assets = await Promise.all(photoIds.map((id) => getMediaAsset(id)))
      const map: Record<string, MediaAsset> = {}
      assets.forEach((a) => {
        if (a) map[a.id] = a
      })
      setPhotos(map)
      setLoading(false)
    }
    load()
  }, [])

  const memberIdsInCommunity = activeCommunityId
    ? new Set(optIns.filter((o) => o.communityId === activeCommunityId).map((o) => o.userId))
    : null

  const filtered = users.filter((u) => {
    if (memberIdsInCommunity && !memberIdsInCommunity.has(u.id)) return false
    if (search) {
      const haystack = `${u.name} ${u.surname} ${u.organization ?? ''} ${u.jobTitle ?? ''}`.toLowerCase()
      if (!haystack.includes(search.toLowerCase())) return false
    }
    return true
  })

  if (loading) return null

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm uppercase tracking-wide text-gold-600">Community of practice</p>
      <h1 className="mt-2 text-4xl">Directory</h1>
      <p className="mt-2 max-w-2xl text-slate-500">
        Members who've opted into the directory. Reach out via whatever contact details they've
        chosen to share.
      </p>
      <Link to="/account" className="mt-4 inline-block text-sm text-ink-800 underline">
        ← Back to my account
      </Link>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or organisation…"
          className="rounded-md border border-sand-200 bg-white px-3 py-2 text-sm"
        />
        {communities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCommunityId(null)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                activeCommunityId === null
                  ? 'border-ink-800 bg-ink-800 text-sand-50'
                  : 'border-sand-200 text-slate-600 hover:border-ink-700'
              }`}
            >
              All members
            </button>
            {communities.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCommunityId(c.id)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  activeCommunityId === c.id
                    ? 'border-ink-800 bg-ink-800 text-sand-50'
                    : 'border-sand-200 text-slate-600 hover:border-ink-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">No members match.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => {
            const photo = u.photoMediaId ? photos[u.photoMediaId] : undefined
            const email = u.showEmail ? (u.profileEmail || u.email) : undefined
            return (
              <div key={u.id} className="overflow-hidden rounded-lg border border-sand-200 bg-white">
                <div className="aspect-square bg-sand-100">
                  {photo && <img src={photo.fileUrl} alt={photo.altText} className="h-full w-full object-cover" />}
                </div>
                <div className="p-5">
                  <p className="text-lg text-ink-900">
                    {u.salutation ? `${u.salutation} ` : ''}
                    {u.name} {u.surname}
                  </p>
                  {(u.jobTitle || u.organization) && (
                    <p className="mt-1 text-sm text-gold-600">
                      {[u.jobTitle, u.organization].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {u.bio && (
                    <p className="mt-2 text-sm text-slate-500">
                      <RichText text={u.bio} />
                    </p>
                  )}
                  {u.areasOfInterest && (
                    <p className="mt-2 text-xs text-slate-400">Interests: {u.areasOfInterest}</p>
                  )}
                  <div className="mt-3 flex flex-col gap-1 text-sm">
                    {email && (
                      <a href={`mailto:${email}`} className="text-ink-800 underline">
                        {email}
                      </a>
                    )}
                    {u.showWhatsapp && u.whatsappNumber && (
                      <a
                        href={`https://wa.me/${u.whatsappNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink-800 underline"
                      >
                        WhatsApp
                      </a>
                    )}
                    {u.linkedinUrl && (
                      <a href={u.linkedinUrl} target="_blank" rel="noreferrer" className="text-ink-800 underline">
                        LinkedIn / Socials
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
