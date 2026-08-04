import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, default: '' },
  items: [{ type: mongoose.Schema.Types.Mixed }],
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  shipping: {
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    zip: { type: String, default: '' },
  },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Number, default: null },
  deletedBy: { type: String, default: '' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })

orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ isDeleted: 1, deletedAt: -1 })
orderSchema.index({ status: 1 })
orderSchema.index({ createdAt: -1 })

export default mongoose.model('Order', orderSchema)
