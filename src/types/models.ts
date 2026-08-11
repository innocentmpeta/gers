// Mirrors project-docs/GERS_Technical_Data_Model.docx.
// Firestore Timestamps are typed as `Timestamp` from 'firebase/firestore' at the
// data-access layer; here we use ISO strings / numbers for the plain domain types
// that flow through the UI, and convert at the repository boundary.

export type SystemRole = 'super_admin' | 'organiser' | 'content_manager' | null

export type VisibilityScope = 'private' | 'all_attendees' | 'same_role_only' | 'organisers_only'

// Confirmed via the organisers' tracked-changes registration form
// (GDEnv/UJ, 2026-08-04) — Sector/Gender/Age group/Disability options below
// match that document exactly.
export type Salutation = 'Mr' | 'Ms' | 'Mrs' | 'Dr' | 'Prof' | 'Other'
export type Sector = 'Academia' | 'Research' | 'Government' | 'Enterprise' | 'Civil Society' | 'Other'
export type Gender = 'Female' | 'Male' | 'Prefer not to say'
export type AgeGroup = 'Under 35 years' | '35 years and over'
export type Disability = 'Yes' | 'No' | 'Prefer not to say'

// Per "Data collected on website" doc — the fixed set of SDGs GERS tracks,
// not the full UN list of 17.
export type Sdg =
  | 'SDG 6: Clean Water and Sanitation'
  | 'SDG 7: Affordable and Clean Energy'
  | 'SDG 11: Sustainable Cities and Communities'
  | 'SDG 12: Responsible Consumption and Production'
  | 'SDG 13: Climate Action'
  | 'SDG 14: Life Below Water'
  | 'SDG 15: Life on Land'
  | 'SDG 17: Partnerships for the Goals'

export interface User {
  id: string
  salutation?: Salutation
  name: string
  surname: string
  email: string
  phone?: string
  whatsappNumber?: string
  organization?: string
  jobTitle?: string
  sector?: Sector
  gender?: Gender
  ageGroup?: AgeGroup
  disability?: Disability
  // "Your public profile" fields (project-docs "Data collected on website")
  // — self-controlled, unmoderated, and shown only in the logged-in
  // community-of-practice directory (never on a public page). Deliberately
  // separate from the Speaker/PartnerProfile bio+photo a presenter/exhibitor
  // also has, which IS admin-moderated and feeds the public Experts/
  // Exhibition pages — different trust tiers, so not the same fields.
  bio?: string
  areasOfInterest?: string
  sdgs?: Sdg[]
  photoMediaId?: string
  // Distinct from the account's login `email` — a directory viewer sees this
  // (if showEmail), not necessarily the address used to sign in.
  profileEmail?: string
  linkedinUrl?: string
  showInDirectory: boolean
  showWhatsapp: boolean
  showEmail: boolean
  visibilityScope: VisibilityScope
  systemRole: SystemRole
  // Present only when systemRole was granted by completing an admin invite
  // (see Invite below) — lets the Firestore rule cross-check the granted
  // role against what a super admin actually approved, instead of trusting
  // the client's self-reported value at signup.
  inviteId?: string
  // Set once at sign-up — the account-creation button doubles as consent to
  // the data-use disclaimer (project-docs meeting notes 2026-07-31).
  consentAcceptedAt?: string
  createdAt: string
}

export interface Symposium {
  id: string
  year: number
  name: string
  startDate: string
  endDate: string
  registrationDeadline: string
  confirmationDeadline: string
  mealEditDeadline: string
  // Capacity — face-to-face always has a fixed venue cap; online can either
  // defer to the platform's own limit (Zoom/Teams) or be given one too.
  // Missing/undefined reads as "no cap configured yet" (unlimited).
  maxPhysicalAttendees?: number
  onlineCapacityMode?: 'platform' | 'fixed'
  maxOnlineAttendees?: number
  // Counters mutated only inside the confirm/switch transactions in
  // registrations.ts — never hand-edited. Missing reads as 0.
  confirmedPhysicalCount?: number
  confirmedOnlineCount?: number
}

export type AttendanceMode = 'online' | 'face_to_face' | 'mixed'

// Public Participant is the automatic default for every sign-up (always
// online) — organisers upgrade specific people to the other roles from the
// admin side (project-docs meeting notes 2026-07-31). Super Admin/Admin/
// Content Manager are SystemRole, not this — a participation role is what
// someone IS at the symposium, not what they can administer.
export type ParticipationRole =
  | 'public_participant'
  | 'invited_participant'
  | 'exhibitor'
  | 'facilitator'
  | 'presenter'
  | 'vip'

// 'withdrawn' is self-initiated (an approved online participant deciding not
// to attend after all) — distinct from 'rejected', which is an organiser
// decision.
export type RegistrationStatus = 'pending_approval' | 'approved' | 'rejected' | 'withdrawn'

// Capacity/waitlist state, independent of RegistrationStatus (approval) —
// see project-docs discussion: registration approval answers "is this a
// legitimate attendee", confirmationStatus answers "is there a seat".
// attendanceMode always reflects the mode currently being targeted (which
// mode confirmationStatus refers to); 'mixed' is deliberately uncapped
// (ambiguous which pool it draws from) and confirms immediately.
// Only meaningful for invited (in-person) participants — a default online
// public_participant registration is created already 'confirmed' since
// there's no per-seat confirmation ceremony for online attendance, just an
// optional withdraw. Organisers moving someone to invited_participant resets
// this to 'unconfirmed' so the existing confirm+meal-preference flow applies.
export type ConfirmationStatus = 'unconfirmed' | 'waitlisted' | 'offered' | 'confirmed'

// Per-day choice within a multi-day symposium — informational only, doesn't
// feed capacity/waitlisting (that stays keyed off the single attendanceMode
// above, which is what the seat-counting transactions in registrations.ts
// actually enforce). Keyed by date string ('YYYY-MM-DD', same format as
// Symposium.startDate/endDate and Session.day) so the set of days is always
// derived from the symposium's own date range rather than hardcoded
// "Day 1"/"Day 2" — see src/lib/symposiumDays.ts.
export type AttendanceDayChoice = 'face_to_face' | 'online' | 'none'

export interface Registration {
  id: string
  userId: string
  symposiumId: string
  attendanceMode: AttendanceMode
  participationRole: ParticipationRole
  status: RegistrationStatus
  confirmationStatus: ConfirmationStatus
  waitlistedAt?: string
  offerExpiresAt?: string
  // Set only while switching modes: the mode they still actually hold a
  // seat under (attendanceMode has already moved to the requested target,
  // confirmationStatus is 'waitlisted'/'offered' for it) — so a switch into
  // a full mode never forfeits the seat they already had. Cleared, and that
  // seat released, once the switch completes or is cancelled.
  previousConfirmedMode?: AttendanceMode
  confirmedAt?: string
  mealPreference?: string
  attendanceDays?: Record<string, AttendanceDayChoice>
  // Present only when this registration was created by completing an
  // organiser-sent invite (see Invite below) — lets the Firestore create
  // rule cross-check the role/mode against what the organiser actually
  // approved, instead of trusting the client's self-reported values.
  inviteId?: string
  approvedBy?: string
  approvedAt?: string
  registrationAmountPaid?: number
  accommodationPaid?: number
  mealAmount?: number
  transportAmount?: number
  accommodationAddress?: string
  createdAt: string
  updatedAt: string
}

// A super-admin-initiated invite for someone who can't self-register (VIPs,
// invited experts, or a new organiser/content manager account) —
// passwordless: the admin fills in the profile/role up front, sends a
// sign-in link, and the invitee's own first sign-in completes the
// User/Registration creation (project-docs meeting notes 2026-07-31, "let's
// use the passwordless-link approach"). 'status' tracks whether that
// completion has happened yet. A single invite can grant a systemRole, an
// attendee registration, or both — an invited organiser might also be
// attending in person, for instance.
export interface Invite {
  id: string
  email: string
  salutation?: Salutation
  name: string
  surname: string
  organization?: string
  jobTitle?: string
  sector?: Sector
  gender?: Gender
  ageGroup?: AgeGroup
  disability?: Disability
  whatsappNumber?: string
  // Admin capability to grant on completion — omitted/undefined for a plain
  // attendee invite (e.g. a VIP with no admin access).
  systemRole?: Exclude<SystemRole, null>
  // Whether completing this invite should also create a symposium
  // Registration. participationRole/attendanceMode only matter when true.
  registerAsAttendee: boolean
  participationRole?: ParticipationRole
  attendanceMode?: AttendanceMode
  status: 'pending' | 'consumed'
  invitedBy: string
  createdAt: string
  consumedAt?: string
}

export interface ExhibitorProfile {
  id: string
  registrationId: string
  companyName: string
  boothOptionId: string
  sponsorshipTierId: string
}

export interface BoothOption {
  id: string
  symposiumId: string
  label: string
  description?: string
}

export interface SponsorshipTier {
  id: string
  symposiumId: string
  label: string
  description?: string
}

export type AbstractStatus = 'pending' | 'accepted' | 'declined'

export interface AbstractSubmission {
  id: string
  userId: string
  symposiumId: string
  affiliation?: string
  track: string
  title: string
  abstractText: string
  status: AbstractStatus
  reviewedBy?: string
  decidedAt?: string
  linkedRegistrationId?: string
  createdAt: string
}

export interface ThematicCommunity {
  id: string
  symposiumId: string
  label: string
  description?: string
}

export interface UserCommunityOptIn {
  id: string
  userId: string
  communityId: string
  symposiumId: string
}

export interface Session {
  id: string
  symposiumId: string
  title: string
  description?: string
  speakerRegistrationId?: string
  startTime: string
  endTime: string
  roomOrTrack?: string
  joinLink?: string
  day: string
}

export type CheckInMethod = 'scan' | 'online_join'

export interface CheckIn {
  id: string
  userId: string
  symposiumId: string
  day: string
  method: CheckInMethod
  sessionId?: string
  recordedBy?: string
  recordedAt: string
}

export type PromptType = 'multiple_choice' | 'rating' | 'open_text'

export interface Prompt {
  id: string
  symposiumId: string
  sessionId?: string
  type: PromptType
  questionText: string
  options?: string[]
  isAnonymous: boolean
  showLiveResults: boolean
  createdBy: string
  active: boolean
  createdAt: string
}

export interface PromptResponse {
  id: string
  promptId: string
  userId?: string
  responseValue: string
  submittedAt: string
}

export type SessionQuestionStatus = 'pending' | 'approved' | 'rejected'

export interface SessionQuestion {
  id: string
  sessionId: string
  userId: string
  submittedText: string
  displayText: string
  status: SessionQuestionStatus
  moderatedBy?: string
  moderatedAt?: string
  submittedAt: string
}

export type PageType = 'freeform' | 'data_backed' | 'curated' | 'dedicated'
export type SectionLayout = 'grid' | 'feature_rows'

export interface Page {
  id: string
  slug: string
  title: string
  type: PageType
}

export interface Section {
  id: string
  pageId: string
  order: number
  layout: SectionLayout
}

export interface Item {
  id: string
  sectionId: string
  order: number
  imageId?: string
  // When set, the card thumbnail and detail page show this video instead of
  // imageId — see src/lib/youtube.ts for URL parsing.
  youtubeUrl?: string
  title: string
  bodyShort?: string
  bodyFull?: string
  gallery?: string[]
  attachments?: string[]
  relatedLinks?: { label: string; url: string }[]
  externalLink?: string
  detailPageSlug?: string
  tag?: string
}

export interface Hero {
  id: string
  pageId: string
  imageId?: string
  focalPoint?: { x: number; y: number }
  eyebrowText?: string
  headline?: string
  subtext?: string
  // Symposiums run across multiple days — a single date wasn't enough.
  eventStartDate?: string
  eventEndDate?: string
  cta1Label?: string
  cta1Link?: string
  cta2Label?: string
  cta2Link?: string
}

export interface MediaAsset {
  id: string
  fileUrl: string
  // Storage object path, kept alongside fileUrl so deletion doesn't need to
  // reverse-engineer a path from the download URL. Optional because assets
  // uploaded before this field existed don't have it — deleteMediaAsset
  // falls back to parsing fileUrl for those.
  storagePath?: string
  type: 'image' | 'document'
  altText?: string
  uploadedBy: string
  uploadedAt: string
}

export interface KnowledgeBaseDocument {
  id: string
  mediaAssetId: string
  title: string
  category?: string
  uploadedBy: string
  uploadedAt: string
}

// Public-safe speaker profile — deliberately NOT derived by exposing raw
// Registration documents to public reads, since a presenter's Registration
// also carries payment amounts, accommodation address, and meal preference.
// Admin curates this directly for now; auto-populating it when a presenter
// registration is confirmed is a natural Phase 5/6 enhancement that writes
// INTO this collection rather than exposing Registration itself.
// Presenters and facilitators submit the same shape and share this one
// collection, showing together on the combined "Experts" page — this field
// is what badges each card Speaker vs Facilitator.
export type SpeakerRole = 'presenter' | 'facilitator'

export interface Speaker {
  id: string
  // Set when the presenter/facilitator submitted this themselves from their
  // account (project-docs meeting notes 2026-07-31: presenters can submit
  // their own bio/image/presentation); admin-added historical speakers may
  // omit it.
  userId?: string
  role: SpeakerRole
  name: string
  title?: string
  bio?: string
  photoMediaId?: string
  presentationMediaId?: string
  sessionId?: string
  order: number
  visible: boolean
}

// Per Stacey Bailie's 2026-08-04 email clarifying the brief: "Partners" is
// not divided by role — it's simply every organisation a participant
// represents (name, logo, website), since one org can be represented by
// several participants in different roles. So this only distinguishes *how*
// a profile was collected, not how it's displayed:
//  - 'exhibitor': the exhibitor's own submission (their card on the
//    Exhibition page — org name heading, their contactName + website below).
//  - 'partner': an organisation linked from a presenter's or facilitator's
//    submission ("Experts" — personal Speaker profile — also upserts one of
//    these for their org). Admins can add either category directly too.
// The public Partners page itself ignores this distinction entirely and
// lists every visible profile together, alphabetically.
export type PartnerCategory = 'exhibitor' | 'partner'

export interface PartnerProfile {
  id: string
  userId?: string
  category: PartnerCategory
  name: string
  // Exhibitor-only: the submitting person's own name, shown at the bottom
  // of their Exhibition-page card (which is otherwise organisation-first,
  // unlike a Speaker card which is person-first).
  contactName?: string
  blurb?: string
  logoMediaId?: string
  imageMediaId?: string
  websiteUrl?: string
  order: number
  visible: boolean
}

// Home's structure is intentionally fixed (Hero -> Intro -> Explore teasers ->
// Closing CTA) rather than the flexible Section/Item system every other
// freeform page gets — Content Manager edits the content within each block
// but can't add/remove blocks, change layout, or reorder. One doc per pageId,
// upserted the same way Hero is.
export interface HomeExploreCard {
  title: string
  body?: string
  imageId?: string
  link: string
}

export interface HomeContent {
  id: string
  pageId: string
  introEyebrow?: string
  introHeading?: string
  introBody?: string
  introImageId?: string
  exploreEyebrow?: string
  exploreHeading?: string
  exploreSubtext?: string
  exploreCards: HomeExploreCard[]
  ctaEyebrow?: string
  ctaHeading?: string
  ctaSubtext?: string
  ctaButtonLabel?: string
  ctaButtonLink?: string
}

// Backs the dedicated FAQ template (an accordion of admin-authored pairs) —
// deliberately outside the Page/Section/Item system since a Q&A list isn't a
// card layout. See GERS_Functional_Requirements.docx §2.2.
export interface FaqItem {
  id: string
  question: string
  answer: string
  order: number
}
