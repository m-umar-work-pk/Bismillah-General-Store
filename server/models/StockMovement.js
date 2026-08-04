import mongoose from 'mongoose'

const stockMovementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, default: '' },
  type: { type: String, enum: ['in', 'out', 'adjustment'], default: 'adjustment' },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, default: 0 },
  newStock: { type: Number, default: 0 },
  note: { type: String, default: '' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })

stockMovementSchema.index({ createdAt: -1 })
stockMovementSchema.index({ productId: 1 })

export default mongoose.model('StockMovement', stockMovementSchema)
