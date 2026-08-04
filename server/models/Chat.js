import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, default: '' },
  userName: { type: String, default: '' },
  status: { type: String, enum: ['active', 'closed', 'blocked'], default: 'active' },
  blockedBy: { type: String, default: '' },
  blockedAt: { type: Date, default: null },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  lastMessage: { type: mongoose.Schema.Types.Mixed, default: null },
  unreadCount: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, default: '' },
  senderRole: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  text: { type: String, default: '' },
  messageType: { type: String, enum: ['text', 'image', 'audio', 'video', 'pdf'], default: 'text' },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  read: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })

chatSchema.index({ userId: 1, status: 1 })
chatSchema.index({ updatedAt: -1 })
messageSchema.index({ chatId: 1, createdAt: 1 })

export const Chat = mongoose.model('Chat', chatSchema)
export const Message = mongoose.model('Message', messageSchema)
