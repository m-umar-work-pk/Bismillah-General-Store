import { Router } from 'express'
import ContactMessage from '../models/ContactMessage.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required' })
    }
    const msg = await ContactMessage.create({ name, email, subject: subject || '', message })
    res.status(201).json({ success: true, message: 'Message sent to Liaqat Engineering Project', id: msg._id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const messages = await ContactMessage.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 })
    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/read', protect, adminOnly, async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { read: true }, { new: true })
    if (!msg) return res.status(404).json({ error: 'Message not found' })
    res.json(msg)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, {
      isDeleted: true, deletedAt: Date.now()
    }, { new: true })
    if (!msg) return res.status(404).json({ error: 'Message not found' })
    res.json({ message: 'Message deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
