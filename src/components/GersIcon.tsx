import clsx from 'clsx'
import { isIconName, type IconName } from './icons'

// Icons are single-color silhouette PNGs with an alpha channel, used as a
// CSS mask rather than an <img> so they pick up `currentColor` like a
// webfont icon (e.g. FontAwesome) — no font-build pipeline needed since the
// alpha channel alone is enough for a mask.
export default function GersIcon({ name, className }: { name: IconName; className?: string }) {
  if (!isIconName(name)) return null
  const url = `/icons/${name}.png`
  return (
    <span
      role="img"
      aria-label={name.replace(/-/g, ' ')}
      className={clsx('inline-block bg-current', className)}
      style={{
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  )
}
