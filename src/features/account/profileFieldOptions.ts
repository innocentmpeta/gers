import type { AgeGroup, Disability, Gender, Salutation, Sector } from '../../types/models'

// Shared by RegisterFlow (sign-up) and AccountProfileEditor (edit-later) so
// the two forms physically cannot drift apart in wording again — per
// organiser feedback 2026-08-12 ("changes to My profile form not yet
// executed for Registration form... please ensure forms are the same").
export const SALUTATIONS: Salutation[] = ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof', 'Other']
export const SECTORS: Sector[] = ['Academia', 'Research', 'Government', 'Enterprise', 'Civil Society', 'Other']
export const GENDERS: Gender[] = ['Female', 'Male', 'Prefer not to say']
export const AGE_GROUPS: AgeGroup[] = ['Under 35 years', '35 years and over']
export const DISABILITY_OPTIONS: Disability[] = ['Yes', 'No', 'Prefer not to say']

export const FIELD_LABELS = {
  salutation: 'Title',
  organization: 'Organization',
  jobTitle: 'Job title / role',
  disability: 'Do you consider yourself to be a person with a disability?',
  whatsapp: 'WhatsApp number',
  directoryCheckbox: 'Include me in the Community of Practice directory',
}
