import type { SystemRole } from './models'

// Mirrors the role matrix in project-docs/GERS_Functional_Requirements.docx (§9).
export type Capability =
  | 'cms'
  | 'promptsAndModeration'
  | 'registrations'
  | 'logistics'
  | 'dashboard'
  | 'export'
  | 'accountManagement'

const ROLE_CAPABILITIES: Record<Exclude<SystemRole, null>, Capability[]> = {
  super_admin: [
    'cms',
    'promptsAndModeration',
    'registrations',
    'logistics',
    'dashboard',
    'export',
    'accountManagement',
  ],
  organiser: ['promptsAndModeration', 'registrations', 'logistics', 'dashboard', 'export'],
  content_manager: ['cms', 'promptsAndModeration'],
}

export function can(role: SystemRole, capability: Capability): boolean {
  if (!role) return false
  return ROLE_CAPABILITIES[role].includes(capability)
}
