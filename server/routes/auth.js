import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { signToken, protect, adminOnly } from '../middleware/auth.js'
import upload from '../middleware/upload.js'
import cloudinary from '../config/cloudinary.js'

const router = Router()

router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email and password required' })
    }

    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ error: 'Email already registered' })

    const adminExists = await User.findOne({ role: 'admin', isDeleted: false })
    const role = adminExists ? 'customer' : 'admin'

    const hashedPassword = await bcrypt.hash(password, 10)
    const uid = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    let avatar = ''
    if (req.file) {
      const b64 = req.file.buffer.toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`
      const result = await cloudinary.uploader.upload(dataURI, { folder: 'avatars', resource_type: 'auto' })
      avatar = result.secure_url
    }

    const user = await User.create({
      uid,
      fullName,
      email,
      password: hashedPassword,
      phone: phone || '',
      avatar,
      role,
      status: 'active',
    })

    const token = signToken(uid, role)
    res.status(201).json({
      token,
      user: { uid: user.uid, fullName: user.fullName, email: user.email, role: user.role, status: user.status, phone: user.phone, avatar: user.avatar || '' },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await User.findOne({ email, isDeleted: false })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    if (user.status === 'blocked') return res.status(403).json({ error: 'Account blocked. Contact admin.' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken(user.uid, user.role)
    res.json({
      token,
      user: { uid: user.uid, fullName: user.fullName, email: user.email, role: user.role, status: user.status, phone: user.phone, avatar: user.avatar || '' },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user })
})

router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' })
    }
    const user = await User.findOne({ uid: req.user.uid })
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' })
    }

    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) return res.status(400).json({ error: 'Current password incorrect' })

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    res.json({ message: 'Password updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
