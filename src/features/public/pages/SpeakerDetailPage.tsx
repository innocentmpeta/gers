import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import RichText from '../../../components/RichText'
import { getSpeaker } from '../../../lib/firestore/speakers'
import { getPartnerByUserId } from '../../../lib/firestore/partnerProfiles'
import { getSession } from '../../../lib/firestore/sessions'
import { getMediaAsset } from '../../../lib/firestore/media'
import type { MediaAsset, PartnerProfile, Session, Speaker } from '../../../types/models'

const ROLE_LABEL: Record<Speaker['role'], string> = {
  presenter: 'Speaker',
  facilitator: 'Facilitator',
}

// Full-page profile for one expert — the card grid on the Speakers/Experts
// page only ever shows a short excerpt (professional bios run long, and a
// narrow card gets cramped fast), so this is where the complete bio,
// presentation download, session, and affiliated organisation actually live.
export default function SpeakerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [speaker, setSpeaker] = useState<Speaker | null>(null)
  const [photo, setPhoto] = useState<MediaAsset | null>(null)
  const [presentation, setPresentation] = useState<MediaAsset | null>(null)
  const [org, setOrg] = useState<PartnerProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getSpeaker(id).then(async (found) => {
      if (!found || !found.visible) {
        setSpeaker(null)
        setLoading(false)
        return
      }
      setSpeaker(found)
      const [photoAsset, presentationAsset, orgProfile, sessionDoc] = await Promise.all([
        found.photoMediaId ? getMediaAsset(found.photoMediaId) : Promise.resolve(null),
        found.presentationMediaId ? getMediaAsset(found.presentationMediaId) : Promise.resolve(null),
        found.userId ? getPartnerByUserId(found.userId) : Promise.resolve(null),
        found.sessionId ? getSession(found.sessionId) : Promise.resolve(null),
      ])
      setPhoto(photoAsset)
      setPresentation(presentationAsset)
      setOrg(orgProfile && orgProfile.visible ? orgProfile : null)
      setSession(sessionDoc)
      setLoading(false)
    })
  }, [id])

  if (loading) return null

  if (!speaker) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-slate-400">
        <p>Not found.</p>
        <Link to="/symposium/speakers" className="mt-4 inline-block text-ink-800 underline">
          ← Back to Experts
        </Link>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link to="/symposium/speakers" className="text-sm text-ink-800 underline">
        ← Back to Experts
      </Link>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        {photo && (
          <img
            src={photo.fileUrl}
            alt={photo.altText}
            className="h-40 w-40 shrink-0 rounded-lg object-cover"
          />
        )}
        <div>
          <span className="text-xs uppercase tracking-wide text-gold-600">{ROLE_LABEL[speaker.role]}</span>
          <h1 className="mt-1 text-4xl">{speaker.name}</h1>
          {(speaker.title || speaker.organization) && (
            <p className="mt-1 text-lg text-slate-500">
              {[speaker.title, speaker.organization].filter(Boolean).join(', ')}
            </p>
          )}
          {speaker.linkedinUrl && (
            <a href={speaker.linkedinUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-ink-800 underline">
              LinkedIn / socials
            </a>
          )}
        </div>
      </div>

      {speaker.bio && (
        <p className="mt-8 text-slate-700">
          <RichText text={speaker.bio} />
        </p>
      )}

      {speaker.areasOfInterest && (
        <p className="mt-4 text-sm text-slate-500">
          <span className="font-medium text-slate-700">Areas of interest:</span> {speaker.areasOfInterest}
        </p>
      )}

      {speaker.sdgs && speaker.sdgs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {speaker.sdgs.map((sdg) => (
            <span key={sdg} className="rounded-full bg-sand-100 px-3 py-1 text-xs text-ink-800">
              {sdg}
            </span>
          ))}
        </div>
      )}

      {session && (
        <div className="mt-8 rounded-md border border-sand-200 p-4">
          <p className="text-sm text-slate-500">Speaking in</p>
          <Link to="/symposium/programme" className="text-ink-800 underline">
            {session.title}
          </Link>
        </div>
      )}

      {presentation && (
        <div className="mt-6">
          <a href={presentation.fileUrl} target="_blank" rel="noreferrer" className="text-ink-800 underline">
            Download presentation
          </a>
        </div>
      )}

      {org && (
        <div className="mt-10 border-t border-sand-200 pt-8">
          <p className="text-sm uppercase tracking-wide text-gold-600">Organisation</p>
          <div className="mt-3 flex items-start gap-4">
            {org.logoMediaId && <OrgLogo mediaId={org.logoMediaId} name={org.name} />}
            <div>
              <p className="text-lg text-ink-900">{org.name}</p>
              {org.blurb && (
                <p className="mt-2 text-sm text-slate-500">
                  <RichText text={org.blurb} />
                </p>
              )}
              {org.websiteUrl && (
                <a href={org.websiteUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-ink-800 underline">
                  Visit website
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

function OrgLogo({ mediaId, name }: { mediaId: string; name: string }) {
  const [logo, setLogo] = useState<MediaAsset | null>(null)
  useEffect(() => {
    getMediaAsset(mediaId).then(setLogo)
  }, [mediaId])
  if (!logo) return null
  return <img src={logo.fileUrl} alt={name} className="h-16 w-16 shrink-0 rounded object-contain" />
}
