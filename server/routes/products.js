import { Router } from 'express'
import Product from '../models/Product.js'
import cloudinary from '../config/cloudinary.js'
import { protect, adminOnly } from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { featured, all } = req.query
    let filter = { isDeleted: { $ne: true } }
    if (featured === 'true') filter.featured = true
    if (all === 'true') filter = {}

    const products = await Product.find(filter).sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body }
    if (data.price) data.price = Number(data.price)
    if (data.costPrice) data.costPrice = Number(data.costPrice)
    if (data.stock !== undefined) data.stock = Number(data.stock)
    if (data.position !== undefined) data.position = Number(data.position)
    if (data.featured !== undefined) data.featured = data.featured === 'true' || data.featured === true

    if (req.file) {
      const b64 = req.file.buffer.toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`
      const result = await cloudinary.uploader.upload(dataURI, { folder: 'products', resource_type: 'auto' })
      data.images = [result.secure_url]
    }

    if (typeof data.images === 'string') {
      data.images = [data.images]
    }

    const product = await Product.create(data)
    res.status(201).json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/bulk/permanent', protect, adminOnly, async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: true })
    for (const product of products) {
      if (product.images?.[0]) {
        try {
          const parts = product.images[0].split('/')
          const idx = parts.indexOf('upload')
          if (idx !== -1) {
            const publicId = parts.slice(idx + 1).join('/').replace(/\.[^.]+$/, '')
            await cloudinary.uploader.destroy(publicId)
          }
        } catch {}
      }
    }
    await Product.deleteMany({ isDeleted: true })
    res.json({ message: 'All deleted products permanently removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/bulk/restore', protect, adminOnly, async (req, res) => {
  try {
    await Product.updateMany({ isDeleted: true }, { isDeleted: false, deletedAt: null, deletedBy: '' })
    res.json({ message: 'All deleted products restored' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const update = { ...req.body }
    if (update.price) update.price = Number(update.price)
    if (update.costPrice) update.costPrice = Number(update.costPrice)
    if (update.stock !== undefined) update.stock = Number(update.stock)
    if (update.position !== undefined) update.position = Number(update.position)
    if (update.featured !== undefined) update.featured = update.featured === 'true' || update.featured === true

    if (req.file) {
      const b64 = req.file.buffer.toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`
      const result = await cloudinary.uploader.upload(dataURI, { folder: 'products', resource_type: 'auto' })
      update.images = [result.secure_url]
    }

    if (typeof update.images === 'string') {
      update.images = [update.images]
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: req.user.fullName || req.user.email || req.user.uid || 'Unknown',
    }, { new: true })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json({ message: 'Product soft deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/restore', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: '',
    }, { new: true })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/permanent', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ error: 'Product not found' })
    if (product.images?.[0]) {
      try {
        const parts = product.images[0].split('/')
        const idx = parts.indexOf('upload')
        if (idx !== -1) {
          const publicId = parts.slice(idx + 1).join('/').replace(/\.[^.]+$/, '')
          await cloudinary.uploader.destroy(publicId)
        }
      } catch {}
    }
    res.json({ message: 'Product permanently deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/stock', protect, adminOnly, async (req, res) => {
  try {
    const { stock } = req.body
    const product = await Product.findByIdAndUpdate(req.params.id, { stock: Number(stock) }, { new: true })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/featured-order', protect, adminOnly, async (req, res) => {
  try {
    const { featuredOrder } = req.body
    const product = await Product.findByIdAndUpdate(req.params.id, { featuredOrder: Number(featuredOrder) }, { new: true })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
