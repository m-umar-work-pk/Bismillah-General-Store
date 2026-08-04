import { Router } from 'express'
import { Chat, Message } from '../models/Chat.js'
import { protect, adminOnly } from '../middleware/auth.js'
import cloudinary from '../config/cloudinary.js'
import upload from '../middleware/upload.js'

const router = Router()

router.get('/', protect, async (req, res) => {
  try {
    let filter = { isDeleted: { $ne: true } }
    if (req.user.role === 'customer') {
      filter.userId = req.user.uid
      filter.status = 'active'
    }
    const chats = await Chat.find(filter).sort({ updatedAt: -1 })
    res.json(chats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', protect, async (req, res) => {
  try {
    const { userId, userEmail, userName } = req.body

    const blockedChat = await Chat.findOne({ userId, status: 'blocked', isDeleted: { $ne: true } })
    if (blockedChat) {
      return res.status(403).json({ error: 'blocked' })
    }

    let chat = await Chat.findOne({ userId, status: 'active', isDeleted: { $ne: true } })
    if (!chat) {
      chat = await Chat.create({ userId, userEmail, userName: userName || userEmail })
    }
    res.json(chat)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
    if (!chat || chat.isDeleted) return res.status(404).json({ error: 'Chat not found' })
    if (req.user.role === 'customer' && chat.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' })
    }
    res.json(chat)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/messages', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    if (req.user.role === 'customer' && chat.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' })
    }
    const messages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 })
    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/messages', protect, upload.single('file'), async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    if (chat.status === 'blocked' && req.user.role === 'customer') {
      return res.status(403).json({ error: 'blocked' })
    }
    if (chat.status === 'closed' && req.user.role === 'customer') {
      return res.status(400).json({ error: 'Chat is closed' })
    }

    let text = ''
    if (req.body && req.body.text) {
      text = typeof req.body.text === 'string' ? req.body.text : ''
    }

    const messageType = (req.body && req.body.messageType) || 'text'
    let fileUrl = ''
    let fileName = ''
    let fileSize = 0
    let msgType = messageType

    if (req.file) {
      const b64 = req.file.buffer.toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'chat-files',
        resource_type: 'auto',
      })
      fileUrl = result.secure_url
      fileName = req.file.originalname
      fileSize = req.file.size

      if (req.file.mimetype.startsWith('image/')) msgType = 'image'
      else if (req.file.mimetype.startsWith('audio/')) msgType = 'audio'
      else if (req.file.mimetype.startsWith('video/')) msgType = 'video'
      else if (req.file.mimetype === 'application/pdf') msgType = 'pdf'
    }

    if (!text.trim() && !fileUrl) {
      return res.status(400).json({ error: 'Message text or file required' })
    }

    const message = await Message.create({
      chatId: req.params.id,
      senderId: req.user.uid,
      senderName: req.user.fullName,
      senderRole: req.user.role,
      text: text.trim(),
      messageType: msgType,
      fileUrl,
      fileName,
      fileSize,
    })

    const lastText = text.trim() || (msgType === 'image' ? 'Image' : msgType === 'audio' ? 'Audio' : msgType === 'video' ? 'Video' : msgType === 'pdf' ? 'Document' : '')
    chat.lastMessage = { text: lastText, senderName: req.user.fullName, createdAt: message.createdAt }
    if (req.user.role !== 'admin') {
      chat.unreadCount = (chat.unreadCount || 0) + 1
    }
    chat.updatedAt = Date.now()
    await chat.save()

    res.status(201).json(message)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/text', protect, async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'Message text required' })

    const chat = await Chat.findById(req.params.id)
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    if (chat.status === 'blocked' && req.user.role === 'customer') {
      return res.status(403).json({ error: 'blocked' })
    }
    if (chat.status === 'closed' && req.user.role === 'customer') {
      return res.status(400).json({ error: 'Chat is closed' })
    }

    const message = await Message.create({
      chatId: req.params.id,
      senderId: req.user.uid,
      senderName: req.user.fullName,
      senderRole: req.user.role,
      text: text.trim(),
      messageType: 'text',
    })

    chat.lastMessage = { text: text.trim(), senderName: req.user.fullName, createdAt: message.createdAt }
    if (req.user.role !== 'admin') {
      chat.unreadCount = (chat.unreadCount || 0) + 1
    }
    chat.updatedAt = Date.now()
    await chat.save()

    res.status(201).json(message)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/read', protect, async (req, res) => {
  try {
    await Message.updateMany(
      { chatId: req.params.id, senderId: { $ne: req.user.uid }, read: false },
      { read: true }
    )
    const chat = await Chat.findById(req.params.id)
    if (chat) {
      chat.unreadCount = 0
      await chat.save()
    }
    res.json({ message: 'done' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/block', protect, adminOnly, async (req, res) => {
  try {
    const chat = await Chat.findByIdAndUpdate(req.params.id, {
      status: 'blocked',
      blockedBy: req.user.uid,
      blockedAt: new Date(),
    }, { new: true })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    res.json(chat)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/unblock', protect, adminOnly, async (req, res) => {
  try {
    const chat = await Chat.findByIdAndUpdate(req.params.id, {
      status: 'active',
      blockedBy: '',
      blockedAt: null,
    }, { new: true })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    res.json(chat)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/close', protect, adminOnly, async (req, res) => {
  try {
    const status = (req.body && req.body.status) || 'closed'
    const chat = await Chat.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    res.json(chat)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const chat = await Chat.findByIdAndDelete(req.params.id)
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    await Message.deleteMany({ chatId: req.params.id })
    res.json({ message: 'Chat deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
