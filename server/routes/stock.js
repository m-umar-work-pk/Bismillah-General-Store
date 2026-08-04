import { Router } from 'express'
import Product from '../models/Product.js'
import StockMovement from '../models/StockMovement.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const [products, movements] = await Promise.all([
      Product.find({ isDeleted: { $ne: true } }).sort({ name: 1 }),
      StockMovement.find().sort({ createdAt: -1 }).limit(50),
    ])
    res.json({ products, movements })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { stock, note, type } = req.body
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Product not found' })

    const previousStock = product.stock
    product.stock = Number(stock)
    await product.save()

    const typeMap = { add: 'in', remove: 'out' }
    const movementType = typeMap[type] || type || 'adjustment'

    await StockMovement.create({
      productId: product._id,
      productName: product.name,
      type: movementType,
      quantity: Math.abs(Number(stock) - previousStock),
      previousStock,
      newStock: product.stock,
      note: note || '',
    })

    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
