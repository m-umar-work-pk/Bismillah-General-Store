import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import categoryRoutes from './routes/categories.js'
import orderRoutes from './routes/orders.js'
import userRoutes from './routes/users.js'
import dashboardRoutes from './routes/dashboard.js'
import stockRoutes from './routes/stock.js'
import chatRoutes from './routes/chat.js'
import uploadRoutes from './routes/upload.js'
import contactRoutes from './routes/contact.js'

const app = express()
const server = createServer(app)

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000']

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
})

app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST', 'PUT', 'DELETE'] }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/stock', stockRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/contact', contactRoutes)

app.get('/', (req, res) => res.json({ name: 'Bismillah General Store API', status: 'ok' }))
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))

io.on('connection', (socket) => {
  socket.on('join-chat', (chatId) => {
    if (chatId) socket.join(chatId)
  })
  socket.on('send-message', (data) => {
    if (data?.chatId) io.to(data.chatId).emit('new-message', data)
  })
  socket.on('mark-read', (chatId) => {
    if (chatId) io.to(chatId).emit('messages-read', chatId)
  })
  socket.on('disconnect', () => {})
})

async function connectOnce() {
  try {
    if (mongoose.connection.readyState === 1) return
    await connectDB()
  } catch (err) {
    console.error('Failed to connect to DB:', err.message)
  }
}

const PORT = process.env.PORT || 5000

// Vercel serverless export
export default async function handler(req, res) {
  if (mongoose.connection.readyState !== 1) {
    await connectOnce()
  }
  return app(req, res)
}

// Local development
if (!process.env.VERCEL) {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
}

export { app, io }
