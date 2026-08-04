import { Router } from 'express'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, async (req, res) => {
  try {
    const { all } = req.query
    let filter = {}
    if (all !== 'true') filter.isDeleted = { $ne: true }

    if (req.user.role === 'customer') {
      filter.userId = req.user.uid
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (req.user.role === 'customer' && order.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' })
    }
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', protect, async (req, res) => {
  try {
    const { items, total, shipping } = req.body
    if (!items || !items.length) return res.status(400).json({ error: 'No items' })

    for (const item of items) {
      const product = await Product.findById(item.id || item._id)
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.name || item.id}` })
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}` })
      }
    }

    for (const item of items) {
      const product = await Product.findById(item.id || item._id)
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity)
        await product.save()
      }
    }

    const order = await Order.create({
      userId: req.user.uid,
      userEmail: req.user.email,
      items,
      total,
      status: 'pending',
      shipping,
    })

    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/bulk/permanent', protect, adminOnly, async (req, res) => {
  try {
    await Order.deleteMany({ isDeleted: true })
    res.json({ message: 'All deleted orders permanently removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/bulk/restore', protect, adminOnly, async (req, res) => {
  try {
    await Order.updateMany({ isDeleted: true }, { isDeleted: false, deletedAt: null, deletedBy: '' })
    res.json({ message: 'All deleted orders restored' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', protect, async (req, res) => {
  try {
    const { status } = req.body
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })

    if (req.user.role === 'customer') {
      if (status === 'cancelled') {
        if (order.status === 'delivered' || order.status === 'cancelled') {
          return res.status(400).json({ error: 'Cannot cancel this order' })
        }
        for (const item of order.items || []) {
          const product = await Product.findById(item.id || item._id)
          if (product) {
            product.stock += item.quantity
            await product.save()
          }
        }
        order.status = 'cancelled'
      } else {
        return res.status(403).json({ error: 'Customers can only cancel orders' })
      }
    } else {
      if (status === 'cancelled' && order.status !== 'cancelled') {
        for (const item of order.items || []) {
          const product = await Product.findById(item.id || item._id)
          if (product) {
            product.stock += item.quantity
            await product.save()
          }
        }
      }
      order.status = status
    }

    await order.save()
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })

    if (order.status !== 'cancelled') {
      for (const item of order.items || []) {
        const product = await Product.findById(item.id || item._id)
        if (product) {
          product.stock += item.quantity
          await product.save()
        }
      }
    }

    order.isDeleted = true
    order.deletedAt = Date.now()
    order.deletedBy = req.user.fullName || req.user.email || req.user.uid
    await order.save()

    res.json({ message: 'Order soft deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/restore', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: '',
    }, { new: true })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/permanent', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json({ message: 'Order permanently deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
