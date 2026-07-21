// Mirrors project-docs/GERS_Technical_Data_Model.docx.
// Firestore Timestamps are typed as `Timestamp` from 'firebase/firestore' at the
// data-access layer; here we use ISO strings / numbers for the plain domain types
// that flow through the UI, and convert at the repository boundary.

export type SystemRole = 'super_admin' | 'organiser' | 'content_manager' | null

export type VisibilityScope = 'private' | 'all_attendees' | 'same_role_only' | 'organisers_only'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  whatsappNumber?: string
  showInDirectory: boolean
  showWhatsapp: boolean
  showEmail: boolean
  visibilityScope: VisibilityScope
  systemRole: SystemRole
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
}

export type AttendanceMode = 'online' | 'face_to_face' | 'mixed'
export type ParticipationRole = 'attendee' | 'presenter' | 'exhibitor' | 'partner' | 'organiser' | 'reviewer'
export type RegistrationStatus = 'pending_approval' | 'approved' | 'rejected'

export interface Registration {
  id: string
  userId: string
  symposiumId: string
  attendanceMode: AttendanceMode
  participationRole: ParticipationRole
  status: RegistrationStatus
  confirmed: boolean
  confirmedAt?: string
  mealPreference?: string
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
  eventDate?: string
  cta1Label?: string
  cta1Link?: string
  cta2Label?: string
  cta2Link?: string
}

export interface MediaAsset {
  id: string
  fileUrl: string
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
export interface Speaker {
  id: string
  name: string
  title?: string
  bio?: string
  photoMediaId?: string
  sessionId?: string
  order: number
  visible: boolean
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
