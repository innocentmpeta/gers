import { useEffect, useState } from 'react'
import MediaPicker from '../../components/cms/MediaPicker'
import { RichTextHint } from '../../components/RichText'
import { getPartnerByUserId, upsertOwnPartnerProfile } from '../../lib/firestore/partnerProfiles'
import type { MediaAsset } from '../../types/models'

const inputClass =
  'rounded-md border border-sand-200 bg-white px-3 py-2 text-ink-950 outline-none focus:border-ink-700'
const labelClass = 'flex flex-col gap-1 text-sm text-slate-700'

// "My organisation" — available to anyone with a registration, not just
// presenters/facilitators, per project-docs meeting notes 2026-08-11 ("Data
// collected on website" doc shows it on every account, not role-gated).
// Feeds the same unified Partners page + footer as the exhibitor and
// presenter/facilitator org profiles. Not rendered for exhibitors — see the
// comment in RoleProfileEditor.tsx for why.
export default function OrganizationEditor({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true)
  const [orgVisible, setOrgVisible] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [orgName, setOrgName] = useState('')
  const [orgBlurb, setOrgBlurb] = useState('')
  const [orgLogo, setOrgLogo] = useState<MediaAsset | null>(null)
  const [orgLogoId, setOrgLogoId] = useState<string | undefined>(undefined)
  const [orgWebsiteUrl, setOrgWebsiteUrl] = useState('')

  useEffect(() => {
    getPartnerByUserId(userId).then((existing) => {
      if (existing) {
        setOrgName(existing.name)
        setOrgBlurb(existing.blurb ?? '')
        setOrgLogoId(existing.logoMediaId)
        setOrgWebsiteUrl(existing.websiteUrl ?? '')
        setOrgVisible(existing.visible)
      }
      setLoading(false)
    })
  }, [userId])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await upsertOwnPartnerProfile(userId, 'partner', {
        name: orgName,
        blurb: orgBlurb || undefined,
        logoMediaId: orgLogo?.id ?? orgLogoId,
        imageMediaId: undefined,
        websiteUrl: orgWebsiteUrl || undefined,
      })
      setSaved(true)
    } catch {
      setError('Could not save your organization. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
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
          browseExisting={false}
        />
        <label className={labelClass}>
          About your organization
          <textarea rows={3} value={orgBlurb} onChange={(e) => setOrgBlurb(e.target.value)} className={inputClass} />
          <RichTextHint />
        </label>
        <label className={labelClass}>
          Website (optional)
          <input value={orgWebsiteUrl} onChange={(e) => setOrgWebsiteUrl(e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-green-600">Saved.</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save organization'}
        </button>
      </div>
    </div>
  )
}
