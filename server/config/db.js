import dns from 'dns'
import mongoose from 'mongoose'

dns.setServers(['192.168.20.1'])

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection
    }
    const uri = process.env.MONGODB_URI
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    })
    console.log(`MongoDB connected: ${conn.connection.host}`)
    return conn.connection
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    throw err
  }
}

export default connectDB
