import clsx from 'clsx'
import ItemLink from './ItemLink'
import type { Item, MediaAsset } from '../../types/models'

export default function FeatureRowsLayout({ items, mediaMap }: { items: Item[]; mediaMap: Record<string, MediaAsset> }) {
  return (
    <div className="flex flex-col gap-14">
      {items.map((item, idx) => {
        const image = item.imageId ? mediaMap[item.imageId] : undefined
        const reversed = idx % 2 === 1
        return (
          <ItemLink
            key={item.id}
            item={item}
            className={clsx('flex flex-col items-center gap-8 md:flex-row', reversed && 'md:flex-row-reverse')}
          >
            <div className="aspect-[4/3] w-full flex-1 overflow-hidden rounded-lg bg-sand-100">
              {image && <img src={image.fileUrl} alt={image.altText} className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1">
              {item.tag && (
                <span className="text-xs uppercase tracking-wide text-ochre-600">{item.tag}</span>
              )}
              <h3 className="mt-1 text-2xl text-teal-900">{item.title}</h3>
              {item.bodyShort && <p className="mt-3 text-slate-600">{item.bodyShort}</p>}
            </div>
          </ItemLink>
        )
      })}
    </div>
  )
}
