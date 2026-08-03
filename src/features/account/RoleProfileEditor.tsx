import { useEffect, useState } from 'react'
import MediaPicker from '../../components/cms/MediaPicker'
import { RICH_TEXT_HINT } from '../../components/RichText'
import { getSpeakerByUserId, upsertOwnSpeakerProfile } from '../../lib/firestore/speakers'
import { getPartnerByUserId, upsertOwnPartnerProfile } from '../../lib/firestore/partnerProfiles'
import type { MediaAsset, ParticipationRole, PartnerCategory } from '../../types/models'

const inputClass =
  'rounded-md border border-sand-200 bg-white px-3 py-2 text-ink-950 outline-none focus:border-ink-700'
const labelClass = 'flex flex-col gap-1 text-sm text-slate-700'
const hintClass = 'text-xs text-slate-400'

// Shown on the account page once a registration holds a role that gets a
// public profile (project-docs meeting notes 2026-07-31: presenters submit
// bio/image/presentation, exhibitors/facilitators submit logo/blurb/image).
// Presenters also submit their organisation's profile (logo/blurb/website)
// alongside their personal one — organisers confirmed partner organisations
// are the ones sending speakers, besides GDEnv/UJ, so this is what feeds
// both the Partners page and the footer logos. Submissions always start
// hidden — an admin has to review and publish them.
export default function RoleProfileEditor({
  userId,
  role,
}: {
  userId: string
  role: Extract<ParticipationRole, 'presenter' | 'exhibitor' | 'facilitator'>
}) {
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [orgVisible, setOrgVisible] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [photo, setPhoto] = useState<MediaAsset | null>(null)
  const [photoId, setPhotoId] = useState<string | undefined>(undefined)
  const [presentation, setPresentation] = useState<MediaAsset | null>(null)
  const [presentationId, setPresentationId] = useState<string | undefined>(undefined)

  const [logo, setLogo] = useState<MediaAsset | null>(null)
  const [logoId, setLogoId] = useState<string | undefined>(undefined)
  const [image, setImage] = useState<MediaAsset | null>(null)
  const [imageId, setImageId] = useState<string | undefined>(undefined)
  const [websiteUrl, setWebsiteUrl] = useState('')

  // Presenter-only: their organisation's own profile, separate from their
  // personal one above — a presenter's org uses this block instead of the
  // shared name/bio/logo/website fields above (those stay exhibitor/
  // facilitator-only), since a presenter needs both at once.
  const [orgName, setOrgName] = useState('')
  const [orgBlurb, setOrgBlurb] = useState('')
  const [orgLogo, setOrgLogo] = useState<MediaAsset | null>(null)
  const [orgLogoId, setOrgLogoId] = useState<string | undefined>(undefined)
  const [orgWebsiteUrl, setOrgWebsiteUrl] = useState('')

  const isPresenter = role === 'presenter'

  useEffect(() => {
    async function load() {
      if (isPresenter) {
        const [existingSpeaker, existingOrg] = await Promise.all([
          getSpeakerByUserId(userId),
          getPartnerByUserId(userId),
        ])
        if (existingSpeaker) {
          setName(existingSpeaker.name)
          setTitle(existingSpeaker.title ?? '')
          setBio(existingSpeaker.bio ?? '')
          setPhotoId(existingSpeaker.photoMediaId)
          setPresentationId(existingSpeaker.presentationMediaId)
          setVisible(existingSpeaker.visible)
        }
        if (existingOrg) {
          setOrgName(existingOrg.name)
          setOrgBlurb(existingOrg.blurb ?? '')
          setOrgLogoId(existingOrg.logoMediaId)
          setOrgWebsiteUrl(existingOrg.websiteUrl ?? '')
          setOrgVisible(existingOrg.visible)
        }
      } else {
        const existing = await getPartnerByUserId(userId)
        if (existing) {
          setName(existing.name)
          setBio(existing.blurb ?? '')
          setLogoId(existing.logoMediaId)
          setImageId(existing.imageMediaId)
          setWebsiteUrl(existing.websiteUrl ?? '')
          setVisible(existing.visible)
        }
      }
      setLoading(false)
    }
    load()
  }, [userId, isPresenter])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      if (isPresenter) {
        await upsertOwnSpeakerProfile(userId, {
          name,
          title: title || undefined,
          bio: bio || undefined,
          photoMediaId: photo?.id ?? photoId,
          presentationMediaId: presentation?.id ?? presentationId,
        })
        if (orgName) {
          await upsertOwnPartnerProfile(userId, 'partner', {
            name: orgName,
            blurb: orgBlurb || undefined,
            logoMediaId: orgLogo?.id ?? orgLogoId,
            imageMediaId: undefined,
            websiteUrl: orgWebsiteUrl || undefined,
          })
        }
      } else {
        await upsertOwnPartnerProfile(userId, role as PartnerCategory, {
          name,
          blurb: bio || undefined,
          logoMediaId: logo?.id ?? logoId,
          imageMediaId: image?.id ?? imageId,
          websiteUrl: websiteUrl || undefined,
        })
      }
      setSaved(true)
    } catch {
      setError('Could not save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="mt-10 border-t border-sand-200 pt-8">
      <h2 className="text-lg font-semibold text-ink-900">Your public profile</h2>
      <p className="mt-1 text-sm text-slate-500">
        {visible
          ? "Live on the site — changes you save here go back to pending review."
          : 'Pending admin review — not on the site yet.'}
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <label className={labelClass}>
          {isPresenter ? 'Name' : 'Organization name'}
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>

        {isPresenter && (
          <label className={labelClass}>
            Title / affiliation
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </label>
        )}

        <label className={labelClass}>
          {isPresenter ? 'Bio' : 'Blurb'}
          <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className={inputClass} />
          <span className={hintClass}>{RICH_TEXT_HINT}</span>
        </label>

        {isPresenter ? (
          <>
            <MediaPicker label="Photo" accept="image" selectedAssetId={photo?.id ?? photoId} onSelect={setPhoto} />
            <MediaPicker
              label="Presentation"
              accept="document"
              selectedAssetId={presentation?.id ?? presentationId}
              onSelect={setPresentation}
            />
          </>
        ) : (
          <>
            <MediaPicker label="Logo" accept="image" selectedAssetId={logo?.id ?? logoId} onSelect={setLogo} />
            <MediaPicker label="Image" accept="image" selectedAssetId={image?.id ?? imageId} onSelect={setImage} />
            <label className={labelClass}>
              Website (optional)
              <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={inputClass} />
            </label>
          </>
        )}
      </div>

      {isPresenter && (
        <div className="mt-10 border-t border-sand-200 pt-8">
          <h2 className="text-lg font-semibold text-ink-900">Your organization</h2>
          <p className="mt-1 text-sm text-slate-500">
            {orgName
              ? orgVisible
                ? "Live on the Partners page and in the footer — changes you save here go back to pending review."
                : 'Pending admin review — not on the site yet.'
              : "Shown on the Partners page and in the site footer. Leave the name blank if your organization shouldn't be listed."}
          </p>

          <div className="mt-4 flex flex-col gap-4">
            <label className={labelClass}>
              Organization name
              <input value={orgName} onChange={(e) => setOrgName(e.target.value)} className={inputClass} />
            </label>
            <MediaPicker
              label="Organization logo"
              accept="image"
              selectedAssetId={orgLogo?.id ?? orgLogoId}
              onSelect={setOrgLogo}
            />
            <label className={labelClass}>
              About your organization
              <textarea
                rows={3}
                value={orgBlurb}
                onChange={(e) => setOrgBlurb(e.target.value)}
                className={inputClass}
              />
              <span className={hintClass}>{RICH_TEXT_HINT}</span>
            </label>
            <label className={labelClass}>
              Website (optional)
              <input
                value={orgWebsiteUrl}
                onChange={(e) => setOrgWebsiteUrl(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-green-600">Saved.</p>}

        <button
          onClick={handleSave}
          disabled={saving || !name}
          className="self-start rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </div>
  )
}
