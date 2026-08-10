// Registry of the custom GERS icon set (source vectors: project-docs/logo-design/gers-icons.ai,
// exported here as single-color alpha PNGs in public/icons/). Kept as an
// explicit whitelist — GersIcon and the RichText <icon:name> token both use
// it to reject unknown names rather than pointing a mask at an arbitrary path.
export const ICON_NAMES = [
  'biodigester',
  'book',
  'briefcase',
  'circular-economy',
  'dam',
  'eye',
  'flower',
  'industry',
  'ladybug',
  'leaf',
  'microscope',
  'raindrop',
  'rounded-leaf',
  'snail',
  'solar',
  'sprout',
  'squirrel',
  'streetlight',
  'sun',
  'table',
  'turtle',
  'wind',
  'windmill',
] as const

export type IconName = (typeof ICON_NAMES)[number]

export function isIconName(value: string): value is IconName {
  return (ICON_NAMES as readonly string[]).includes(value)
}
