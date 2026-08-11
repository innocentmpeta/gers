import { useEffect, useState } from 'react'
import MediaPicker from '../../components/cms/MediaPicker'
import { RichTextHint } from '../../components/RichText'
import { updateOwnProfile } from '../../lib/firestore/users'
import { listCommunities, listUserOptIns, optIn, optOut } from '../../lib/firestore/communities'
import type {
  AgeGroup,
  Disability,
  Gender,
  MediaAsset,
  Salutation,
  Sdg,
  Sector,
  ThematicCommunity,
  User,
} from '../../types/models'

const inputClass =
  'rounded-md border border-sand-200 bg-white px-3 py-2 text-ink-950 outline-none focus:border-ink-700'
const labelClass = 'flex flex-col gap-1 text-sm text-slate-700'

const SALUTATIONS: Salutation[] = ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof', 'Other']
const SECTORS: Sector[] = ['Academia', 'Research', 'Government', 'Enterprise', 'Civil Society', 'Other']
const GENDERS: Gender[] = ['Female', 'Male', 'Prefer not to say']
const AGE_GROUPS: AgeGroup[] = ['Under 35 years', '35 years and over']
const DISABILITY_OPTIONS: Disability[] = ['Yes', 'No', 'Prefer not to say']
const SDGS: Sdg[] = [
  'SDG 6: Clean Water and Sanitation',
  'SDG 7: Affordable and Clean Energy',
  'SDG 11: Sustainable Cities and Communities',
  'SDG 12: Responsible Consumption and Production',
  'SDG 13: Climate Action',
  'SDG 14: Life Below Water',
  'SDG 15: Life on Land',
  'SDG 17: Partnerships for the Goals',
]

// Covers both "Edit my profile" (core account fields, previously only ever
// set once at signup) and "Your public profile" (bio/interests/SDGs/photo/
// contact — self-controlled, unmoderated, shown only in the logged-in
// directory to members who opted in). One form/one save because they're all
// just fields on the same User doc — see EditableProfileFields.
export default function AccountProfileEditor({
  userId,
  profile,
  symposiumId,
}: {
  userId: string
  profile: User
  symposiumId?: string
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [salutation, setSalutation] = useState<Salutation | ''>(profile.salutation ?? '')
  const [name, setName] = useState(profile.name)
  const [surname, setSurname] = useState(profile.surname)
  const [organization, setOrganization] = useState(profile.organization ?? '')
  const [jobTitle, setJobTitle] = useState(profile.jobTitle ?? '')
  const [sector, setSector] = useState<Sector | ''>(profile.sector ?? '')
  const [gender, setGender] = useState<Gender | ''>(profile.gender ?? '')
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>(profile.ageGroup ?? '')
  const [disability, setDisability] = useState<Disability | ''>(profile.disability ?? '')
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsappNumber ?? '')

  const [bio, setBio] = useState(profile.bio ?? '')
  const [areasOfInterest, setAreasOfInterest] = useState(profile.areasOfInterest ?? '')
  const [sdgs, setSdgs] = useState<Sdg[]>(profile.sdgs ?? [])
  const [photo, setPhoto] = useState<MediaAsset | null>(null)
  const [photoId, setPhotoId] = useState(profile.photoMediaId)
  const [profileEmail, setProfileEmail] = useState(profile.profileEmail ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl ?? '')

  const [showInDirectory, setShowInDirectory] = useState(profile.showInDirectory)
  const [showWhatsapp, setShowWhatsapp] = useState(profile.showWhatsapp)
  const [showEmail, setShowEmail] = useState(profile.showEmail)

  const [communities, setCommunities] = useState<ThematicCommunity[]>([])
  const [optedInIds, setOptedInIds] = useState<Set<string>>(new Set())
  const [initialOptedInIds, setInitialOptedInIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!symposiumId) return
    Promise.all([listCommunities(symposiumId), listUserOptIns(userId)]).then(([comms, optIns]) => {
      setCommunities(comms)
      const ids = new Set(optIns.filter((o) => o.symposiumId === symposiumId).map((o) => o.communityId))
      setOptedInIds(ids)
      setInitialOptedInIds(ids)
    })
  }, [userId, symposiumId])

  function toggleSdg(sdg: Sdg) {
    setSdgs((prev) => (prev.includes(sdg) ? prev.filter((s) => s !== sdg) : [...prev, sdg]))
  }

  function toggleCommunity(id: string) {
    setOptedInIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateOwnProfile(userId, {
        salutation: salutation || undefined,
        name,
        surname,
        organization: organization || undefined,
        jobTitle: jobTitle || undefined,
        sector: sector || undefined,
        gender: gender || undefined,
        ageGroup: ageGroup || undefined,
        disability: disability || undefined,
        whatsappNumber: whatsappNumber || undefined,
        bio: bio || undefined,
        areasOfInterest: areasOfInterest || undefined,
        sdgs: sdgs.length ? sdgs : undefined,
        photoMediaId: photo?.id ?? photoId,
        profileEmail: profileEmail || undefined,
        linkedinUrl: linkedinUrl || undefined,
        showInDirectory,
        showWhatsapp,
        showEmail,
      })

      if (symposiumId) {
        const toJoin = [...optedInIds].filter((id) => !initialOptedInIds.has(id))
        const toLeave = [...initialOptedInIds].filter((id) => !optedInIds.has(id))
        await Promise.all([
          ...toJoin.map((id) => optIn(userId, id, symposiumId)),
          ...toLeave.map((id) => {
            // optOut needs the opt-in doc's own id, not the community id —
            // refetch is avoided by keeping a parallel lookup would be
            // overkill for this small a list, so just re-list once here.
            return listUserOptIns(userId).then((optIns) => {
              const match = optIns.find((o) => o.communityId === id && o.symposiumId === symposiumId)
              if (match) return optOut(match.id)
            })
          }),
        ])
        setInitialOptedInIds(new Set(optedInIds))
      }

      setSaved(true)
    } catch {
      setError('Could not save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-10 border-t border-sand-200 pt-8">
      <h2 className="text-lg font-semibold text-ink-900">Edit my profile</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Title
          <select value={salutation} onChange={(e) => setSalutation(e.target.value as Salutation)} className={inputClass}>
            <option value="">—</option>
            {SALUTATIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div />
        <label className={labelClass}>
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Surname
          <input required value={surname} onChange={(e) => setSurname(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Organisation
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Job title / role
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Sector
          <select value={sector} onChange={(e) => setSector(e.target.value as Sector)} className={inputClass}>
            <option value="">—</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Gender
          <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={inputClass}>
            <option value="">—</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Age group
          <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as AgeGroup)} className={inputClass}>
            <option value="">—</option>
            {AGE_GROUPS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Disability
          <select value={disability} onChange={(e) => setDisability(e.target.value as Disability)} className={inputClass}>
            <option value="">—</option>
            {DISABILITY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          WhatsApp number
          <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="mt-10 border-t border-sand-200 pt-8">
        <h2 className="text-lg font-semibold text-ink-900">Your public profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Fill out these optional fields to help other members connect with you. Only visible to
          logged-in members if you opt into the directory below.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          <label className={labelClass}>
            Bio (max 300 words)
            <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className={inputClass} />
            <RichTextHint />
          </label>
          <label className={labelClass}>
            Areas of interest
            <input
              value={areasOfInterest}
              onChange={(e) => setAreasOfInterest(e.target.value)}
              className={inputClass}
            />
          </label>
          <div>
            <p className="text-sm text-slate-700">Relevant Sustainable Development Goals</p>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {SDGS.map((sdg) => (
                <label key={sdg} className="inline-flex items-start gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={sdgs.includes(sdg)} onChange={() => toggleSdg(sdg)} className="mt-0.5" />
                  {sdg}
                </label>
              ))}
            </div>
          </div>
          <MediaPicker
            label="Profile picture"
            accept="image"
            selectedAssetId={photo?.id ?? photoId}
            onSelect={(asset) => {
              setPhoto(asset)
              setPhotoId(asset?.id)
            }}
            browseExisting={false}
          />
          <label className={labelClass}>
            Profile contact email (optional — shown instead of your login email)
            <input
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            LinkedIn / Socials
            <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={showInDirectory} onChange={(e) => setShowInDirectory(e.target.checked)} />
            Include me in the community of practice directory
          </label>
          {showInDirectory && (
            <div className="ml-6 flex flex-col gap-2">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} />
                Show my email in the directory
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={showWhatsapp} onChange={(e) => setShowWhatsapp(e.target.checked)} />
                Show my WhatsApp number in the directory
              </label>
            </div>
          )}
          <p className="text-xs text-slate-400">
            Other logged-in members will see your name, profession, and any information you include
            above. You can change this at any time.
          </p>
        </div>

        {communities.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-slate-700">Thematic communities of practice</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {communities.map((c) => (
                <label key={c.id} className="inline-flex items-start gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={optedInIds.has(c.id)}
                    onChange={() => toggleCommunity(c.id)}
                    className="mt-0.5"
                  />
                  <span>
                    {c.label}
                    {c.description && <span className="block text-xs text-slate-400">{c.description}</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-green-600">Saved.</p>}
        <button
          onClick={handleSave}
          disabled={saving || !name || !surname}
          className="self-start rounded-full bg-ink-800 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </div>
  )
}
