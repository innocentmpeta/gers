import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { orderBy, listWhere, createDoc, removeDoc } from './crud'
import { storage } from '../firebase'
import type { KnowledgeBaseDocument } from '../../types/models'

const col = 'knowledgeBaseDocuments'

export async function listKnowledgeBaseDocuments(): Promise<KnowledgeBaseDocument[]> {
  return listWhere<KnowledgeBaseDocument>(col, [orderBy('uploadedAt', 'desc')])
}

export async function uploadKnowledgeBaseDocument(
  file: File,
  title: string,
  category: string | undefined,
  uploadedBy: string
): Promise<KnowledgeBaseDocument> {
  const path = `knowledge-base/${crypto.randomUUID()}-${file.name}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  const fileUrl = await getDownloadURL(storageRef)
  const uploadedAt = new Date().toISOString()

  // The underlying file is also recorded as a MediaAsset so storage stays
  // consistent, even though knowledgeBaseDocuments is the collection that
  // actually gates read access (admin-only — see firestore.rules).
  const mediaAssetId = await createDoc('mediaAssets', {
    fileUrl,
    type: 'document',
    altText: file.name,
    uploadedBy,
    uploadedAt,
  })

  const data: Omit<KnowledgeBaseDocument, 'id'> = {
    mediaAssetId,
    title,
    category,
    uploadedBy,
    uploadedAt,
  }
  const id = await createDoc<KnowledgeBaseDocument>(col, data)
  return { id, ...data }
}

export async function deleteKnowledgeBaseDocument(id: string): Promise<void> {
  await removeDoc(col, id)
}
