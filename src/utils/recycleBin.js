import { api } from '@/config/api'

export const moveToRecycleBin = async (collectionName, itemId) => {
  await api.put(`/${collectionName}/${itemId}`)
  return { success: true, message: 'Moved to recycle bin' }
}

export const restoreFromRecycleBin = async (collectionName, itemId) => {
  await api.put(`/${collectionName}/${itemId}/restore`)
  return { success: true, message: 'Restored successfully' }
}

export const permanentlyDelete = async (collectionName, itemId) => {
  await api.delete(`/${collectionName}/${itemId}/permanent`)
  return { success: true, message: 'Permanently deleted' }
}

export const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return { success: true }
  try {
    const parts = imageUrl.split('/')
    const idx = parts.indexOf('upload')
    if (idx !== -1) {
      const publicId = parts.slice(idx + 1).join('/').replace(/\.[^.]+$/, '')
      await api.delete(`/upload/${encodeURIComponent(publicId)}`)
    }
  } catch {
    // ignore
  }
  return { success: true }
}

export const batchRestore = async (items) => {
  for (const item of items) {
    await api.put(`/${item.collectionName}/${item.itemId}/restore`)
  }
  return { success: true, message: 'Items restored successfully' }
}

export const batchPermanentDelete = async (items) => {
  for (const item of items) {
    await api.delete(`/${item.collectionName}/${item.itemId}/permanent`)
  }
  return { success: true, message: 'Items deleted permanently' }
}
