import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  costPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  unit: { type: String, enum: ['KG', 'pcs', 'L', 'dozen', 'pack'], default: 'pcs' },
  category: { type: String, default: '' },
  images: [{ type: String }],
  featured: { type: Boolean, default: false },
  featuredOrder: { type: Number, default: 0 },
  position: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Number, default: null },
  deletedBy: { type: String, default: '' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })

productSchema.index({ isDeleted: 1, deletedAt: -1 })
productSchema.index({ featured: 1, createdAt: -1 })
productSchema.index({ category: 1 })
productSchema.index({ name: 1 })

export default mongoose.model('Product', productSchema)
