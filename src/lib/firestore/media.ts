import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { orderBy, listWhere, getById, createDoc } from './crud'
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
  const path = `media/${crypto.randomUUID()}-${file.name}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  const fileUrl = await getDownloadURL(storageRef)

  const data: Omit<MediaAsset, 'id'> = {
    fileUrl,
    type,
    altText: file.name,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
  }
  const id = await createDoc<MediaAsset>(col, data)
  return { id, ...data }
}
