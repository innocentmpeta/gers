import { useEffect, useState } from 'react'
import GridLayout from './GridLayout'
import FeatureRowsLayout from './FeatureRowsLayout'
import { listItemsForSection } from '../../lib/firestore/items'
import { getMediaAsset } from '../../lib/firestore/media'
import type { Item, MediaAsset, Section } from '../../types/models'

export default function SectionRenderer({ section }: { section: Section }) {
  const [items, setItems] = useState<Item[]>([])
  const [mediaMap, setMediaMap] = useState<Record<string, MediaAsset>>({})

  useEffect(() => {
    listItemsForSection(section.id).then(async (fetched) => {
      setItems(fetched)
      const imageIds = [...new Set(fetched.map((i) => i.imageId).filter((id): id is string => !!id))]
      const assets = await Promise.all(imageIds.map((id) => getMediaAsset(id)))
      const map: Record<string, MediaAsset> = {}
      assets.forEach((a) => {
        if (a) map[a.id] = a
      })
      setMediaMap(map)
    })
  }, [section.id])

  if (items.length === 0) return null

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {section.layout === 'grid' ? (
        <GridLayout items={items} mediaMap={mediaMap} />
      ) : (
        <FeatureRowsLayout items={items} mediaMap={mediaMap} />
      )}
    </div>
  )
}
