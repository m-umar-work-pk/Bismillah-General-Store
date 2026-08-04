import mongoose from 'mongoose'

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, default: '' },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Number, default: null },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })

contactMessageSchema.index({ createdAt: -1 })
contactMessageSchema.index({ read: 1 })

export default mongoose.model('ContactMessage', contactMessageSchema)
