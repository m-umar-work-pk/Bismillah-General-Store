import { Router } from 'express'
import cloudinary from '../config/cloudinary.js'
import upload from '../middleware/upload.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf']

router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file' })

    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'File type not allowed. Use JPG, PNG, GIF, WebP, SVG, or PDF.' })
    }

    const b64 = req.file.buffer.toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${b64}`
    const folder = (req.body.folder || 'uploads').replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\.{2}/g, '')

    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: 'auto',
    })

    res.json({ url: result.secure_url, public_id: result.public_id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:publicId', protect, adminOnly, async (req, res) => {
  try {
    const { publicId } = req.params
    await cloudinary.uploader.destroy(publicId)
    res.json({ message: 'Image deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
