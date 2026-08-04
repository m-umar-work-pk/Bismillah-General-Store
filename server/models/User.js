import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Number, default: null },
  deletedBy: { type: String, default: '' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })

userSchema.index({ isDeleted: 1, deletedAt: -1 })

export default mongoose.model('User', userSchema)
