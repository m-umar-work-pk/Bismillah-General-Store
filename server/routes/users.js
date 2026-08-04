import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { protect, adminOnly } from '../middleware/auth.js'
import upload from '../middleware/upload.js'
import cloudinary from '../config/cloudinary.js'

const router = Router()

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { all } = req.query
    let filter = {}
    if (all !== 'true') filter.isDeleted = { $ne: true }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', protect, adminOnly, upload.single('avatar'), async (req, res) => {
  try {
    const allowedFields = ['fullName', 'email', 'phone', 'status']
    const update = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) update[field] = req.body[field]
    }
    if (req.body.password) {
      update.password = await bcrypt.hash(req.body.password, 10)
    }

    if (req.file) {
      const b64 = req.file.buffer.toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`
      const result = await cloudinary.uploader.upload(dataURI, { folder: 'avatars', resource_type: 'auto' })
      update.avatar = result.secure_url
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/block', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot block admin' })
    user.status = user.status === 'blocked' ? 'active' : 'blocked'
    await user.save()
    res.json({ status: user.status })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/bulk/permanent', protect, adminOnly, async (req, res) => {
  try {
    await User.deleteMany({ isDeleted: true })
    res.json({ message: 'All deleted users permanently removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/bulk/restore', protect, adminOnly, async (req, res) => {
  try {
    await User.updateMany({ isDeleted: true }, { isDeleted: false, deletedAt: null, deletedBy: '' })
    res.json({ message: 'All deleted users restored' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot delete admin' })
    user.isDeleted = true
    user.deletedAt = Date.now()
    user.deletedBy = req.user.fullName || req.user.email || req.user.uid
    await user.save()
    res.json({ message: 'User soft deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/restore', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: '',
    }, { new: true }).select('-password')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/permanent', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ message: 'User permanently deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
