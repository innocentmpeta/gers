import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { orderBy, listWhere, getById, createDoc, removeDoc } from './crud'
import { storage } from '../firebase'
import type { MediaAsset } from '../../types/models'

const col = 'mediaAssets'

export async function listMedia(): Promise<MediaAsset[]> {
  const assets = await listWhere<MediaAsset>(col, [orderBy('uploadedAt', 'desc')])
  return assets
}

export async function getMediaAsset(id: string): Promise<MediaAsset | null> {
  return getById<MediaAsset>(col, id)
}

export async function uploadMediaAsset(file: File, uploadedBy: string): Promise<MediaAsset> {
  const type: MediaAsset['type'] = file.type.startsWith('image/') ? 'image' : 'document'
  const storagePath = `media/${crypto.randomUUID()}-${file.name}`
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, file)
  const fileUrl = await getDownloadURL(storageRef)

  const data: Omit<MediaAsset, 'id'> = {
    fileUrl,
    storagePath,
    type,
    altText: file.name,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
  }
  const id = await createDoc<MediaAsset>(col, data)
  return { id, ...data }
}

// Derives the Storage object path from a Firebase download URL for assets
// uploaded before storagePath existed on the doc — the path segment between
// "/o/" and "?" is URL-encoded.
function storagePathFromUrl(fileUrl: string): string | null {
  const match = fileUrl.match(/\/o\/([^?]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

// Admin-only (enforced by firestore.rules/storage.rules) — deletes both the
// Storage object and the Firestore doc. The Storage delete is best-effort:
// a missing object (already gone, or a pre-storagePath asset whose path
// couldn't be derived) shouldn't block removing the Firestore record.
export async function deleteMediaAsset(asset: MediaAsset): Promise<void> {
  const path = asset.storagePath ?? storagePathFromUrl(asset.fileUrl)
  if (path) {
    try {
      await deleteObject(ref(storage, path))
    } catch {
      // object already gone, or path guess was wrong — proceed to remove the doc regardless
    }
  }
  await removeDoc(col, asset.id)
}
