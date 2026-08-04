import { Router } from 'express'
import Category from '../models/Category.js'
import cloudinary from '../config/cloudinary.js'
import { protect, adminOnly } from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { all } = req.query
    let filter = { isDeleted: { $ne: true } }
    if (all === 'true') filter = {}

    const categories = await Category.find(filter).sort({ createdAt: -1 })
    res.json(categories)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { name, slug, icon } = req.body
    const data = { name, slug, icon: icon || '' }

    if (req.file) {
      const b64 = req.file.buffer.toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`
      const result = await cloudinary.uploader.upload(dataURI, { folder: 'categories', resource_type: 'auto' })
      data.image = result.secure_url
    }

    const category = await Category.create(data)
    res.status(201).json(category)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/bulk/permanent', protect, adminOnly, async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: true })
    for (const category of categories) {
      if (category.image) {
        try {
          const parts = category.image.split('/')
          const idx = parts.indexOf('upload')
          if (idx !== -1) {
            const publicId = parts.slice(idx + 1).join('/').replace(/\.[^.]+$/, '')
            await cloudinary.uploader.destroy(publicId)
          }
        } catch {}
      }
    }
    await Category.deleteMany({ isDeleted: true })
    res.json({ message: 'All deleted categories permanently removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/bulk/restore', protect, adminOnly, async (req, res) => {
  try {
    await Category.updateMany({ isDeleted: true }, { isDeleted: false, deletedAt: null, deletedBy: '' })
    res.json({ message: 'All deleted categories restored' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const update = { ...req.body }

    if (req.file) {
      const b64 = req.file.buffer.toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`
      const result = await cloudinary.uploader.upload(dataURI, { folder: 'categories', resource_type: 'auto' })
      update.image = result.secure_url
    }

    const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!category) return res.status(404).json({ error: 'Category not found' })
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: req.user.fullName || req.user.email || req.user.uid,
    }, { new: true })
    if (!category) return res.status(404).json({ error: 'Category not found' })
    res.json({ message: 'Category soft deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/restore', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: '',
    }, { new: true })
    if (!category) return res.status(404).json({ error: 'Category not found' })
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/permanent', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) return res.status(404).json({ error: 'Category not found' })
    if (category.image) {
      try {
        const parts = category.image.split('/')
        const idx = parts.indexOf('upload')
        if (idx !== -1) {
          const publicId = parts.slice(idx + 1).join('/').replace(/\.[^.]+$/, '')
          await cloudinary.uploader.destroy(publicId)
        }
      } catch {}
    }
    res.json({ message: 'Category permanently deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
