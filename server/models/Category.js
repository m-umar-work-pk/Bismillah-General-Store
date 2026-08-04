import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  icon: { type: String, default: '' },
  image: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Number, default: null },
  deletedBy: { type: String, default: '' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })

categorySchema.index({ isDeleted: 1, deletedAt: -1 })
categorySchema.index({ slug: 1 }, { unique: true })

export default mongoose.model('Category', categorySchema)
