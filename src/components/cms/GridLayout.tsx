import ItemLink from './ItemLink'
import type { Item, MediaAsset } from '../../types/models'

export default function GridLayout({ items, mediaMap }: { items: Item[]; mediaMap: Record<string, MediaAsset> }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const image = item.imageId ? mediaMap[item.imageId] : undefined
        return (
          <ItemLink
            key={item.id}
            item={item}
            className="group flex flex-col overflow-hidden rounded-lg border border-sand-200 bg-white transition-shadow hover:shadow-md"
          >
            <div className="aspect-[4/3] bg-sand-100">
              {image && <img src={image.fileUrl} alt={image.altText} className="h-full w-full object-cover" />}
            </div>
            <div className="flex flex-1 flex-col p-4">
              {item.tag && (
                <span className="mb-1 text-xs uppercase tracking-wide text-ochre-600">{item.tag}</span>
              )}
              <h3 className="text-lg text-teal-900 group-hover:underline">{item.title}</h3>
              {item.bodyShort && <p className="mt-1 text-sm text-slate-500">{item.bodyShort}</p>}
            </div>
          </ItemLink>
        )
      })}
    </div>
  )
}
