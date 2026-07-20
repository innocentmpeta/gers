import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getItemByDetailSlug } from '../../../lib/firestore/items'
import { getMediaAsset } from '../../../lib/firestore/media'
import type { Item, MediaAsset } from '../../../types/models'

export default function ItemDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [item, setItem] = useState<Item | null>(null)
  const [heroImage, setHeroImage] = useState<MediaAsset | null>(null)
  const [gallery, setGallery] = useState<MediaAsset[]>([])
  const [attachments, setAttachments] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getItemByDetailSlug(slug).then(async (found) => {
      setItem(found)
      if (found) {
        const [hero, galleryAssets, attachmentAssets] = await Promise.all([
          found.imageId ? getMediaAsset(found.imageId) : Promise.resolve(null),
          Promise.all((found.gallery ?? []).map((id) => getMediaAsset(id))),
          Promise.all((found.attachments ?? []).map((id) => getMediaAsset(id))),
        ])
        setHeroImage(hero)
        setGallery(galleryAssets.filter((a): a is MediaAsset => !!a))
        setAttachments(attachmentAssets.filter((a): a is MediaAsset => !!a))
      }
      setLoading(false)
    })
  }, [slug])

  if (loading) return null
  if (!item) {
    return <div className="mx-auto max-w-3xl px-6 py-24 text-slate-400">Not found.</div>
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {item.tag && <p className="text-sm uppercase tracking-wide text-ochre-600">{item.tag}</p>}
      <h1 className="mt-2 text-4xl">{item.title}</h1>

      {heroImage && (
        <img src={heroImage.fileUrl} alt={heroImage.altText} className="mt-6 w-full rounded-lg object-cover" />
      )}

      {item.bodyFull && <p className="mt-6 whitespace-pre-line text-slate-700">{item.bodyFull}</p>}

      {gallery.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((asset) => (
            <img key={asset.id} src={asset.fileUrl} alt={asset.altText} className="aspect-square rounded object-cover" />
          ))}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg text-teal-900">Attachments</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {attachments.map((asset) => (
              <li key={asset.id}>
                <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="text-teal-800 underline">
                  {asset.altText}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.relatedLinks && item.relatedLinks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg text-teal-900">Related links</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {item.relatedLinks.map((link, i) => (
              <li key={i}>
                <a href={link.url} target="_blank" rel="noreferrer" className="text-teal-800 underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
