import { Router } from 'express'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import Category from '../models/Category.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [products, orders, users, categories] = await Promise.all([
      Product.find({ isDeleted: { $ne: true } }),
      Order.find({ isDeleted: { $ne: true } }),
      User.find({ isDeleted: { $ne: true } }),
      Category.find({ isDeleted: { $ne: true } }),
    ])

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const sevenDaysAgo = today - 6 * 86400000

    const todayRevenue = orders
      .filter(o => o.status !== 'cancelled' && o.createdAt >= today)
      .reduce((s, o) => s + o.total, 0)

    const recentRevenue = orders
      .filter(o => o.status !== 'cancelled' && o.createdAt >= sevenDaysAgo)
      .reduce((s, o) => s + o.total, 0)

    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => s + o.total, 0)

    const totalProfit = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => {
        const orderProfit = (o.items || []).reduce((ps, item) => {
          const product = products.find(p => (p._id?.toString?.() || p.id) === (item.id || item._id))
          const costPrice = product?.costPrice || 0
          return ps + (item.price - costPrice) * item.quantity
        }, 0)
        return s + orderProfit
      }, 0)

    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length

    const totalStockProfit = products
      .filter(p => !p.isDeleted)
      .reduce((s, p) => s + ((p.price || 0) - (p.costPrice || 0)) * (p.stock || 0), 0)

    const lowStockItems = products.filter(p => (p.stock || 0) <= 5 && !p.isDeleted).length

    res.json({
      totalProducts: products.length,
      totalOrders: orders.length,
      totalUsers: users.length,
      totalCategories: categories.length,
      todayRevenue,
      recentRevenue,
      totalRevenue,
      totalProfit,
      totalStockProfit,
      lowStockItems,
      pendingOrders,
      deliveredOrders,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/chart-data', protect, adminOnly, async (req, res) => {
  try {
    const [products, orders, users] = await Promise.all([
      Product.find({ isDeleted: { $ne: true } }),
      Order.find({ isDeleted: { $ne: true } }),
      User.find({ isDeleted: { $ne: true } }),
    ])

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    const monthlyRevenue = Array(12).fill(0)
    const monthlyOrders = Array(12).fill(0)
    const monthlyProfit = Array(12).fill(0)

    orders.forEach(order => {
      if (order.status === 'cancelled') return
      const d = new Date(order.createdAt)
      const mi = d.getMonth()
      monthlyRevenue[mi] += order.total
      monthlyOrders[mi] += 1
      const orderProfit = (order.items || []).reduce((ps, item) => {
        const product = products.find(p => (p._id?.toString?.() || p.id) === (item.id || item._id))
        const costPrice = product?.costPrice || 0
        return ps + (item.price - costPrice) * item.quantity
      }, 0)
      monthlyProfit[mi] += orderProfit
    })

    const productRevenue = {}
    const productDemand = {}
    orders.filter(o => o.status !== 'cancelled').forEach(order => {
      (order.items || []).forEach(item => {
        const name = item.name || 'Unknown'
        productRevenue[name] = (productRevenue[name] || 0) + item.price * item.quantity
        productDemand[name] = (productDemand[name] || 0) + item.quantity
      })
    })

    const topProducts = Object.entries(productRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const demandProducts = Object.entries(productDemand)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const revenueShare = {}
    orders.filter(o => o.status !== 'cancelled').forEach(order => {
      (order.items || []).forEach(item => {
        const cat = item.category || 'Uncategorized'
        revenueShare[cat] = (revenueShare[cat] || 0) + item.price * item.quantity
      })
    })

    const allProducts = Object.entries(productRevenue)
      .sort((a, b) => b[1] - a[1])

    // Daily data for last 30 days
    const dailyLabels = []
    const dailyRevenue = Array(30).fill(0)
    const dailyOrders = Array(30).fill(0)
    const dailyProfit = Array(30).fill(0)

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dailyLabels.push(label)
    }

    orders.forEach(order => {
      if (order.status === 'cancelled') return
      const orderDate = new Date(order.createdAt)
      const diffDays = Math.floor((now - orderDate) / 86400000)
      if (diffDays >= 0 && diffDays < 30) {
        const idx = 29 - diffDays
        dailyRevenue[idx] += order.total
        dailyOrders[idx] += 1
        const orderProfit = (order.items || []).reduce((ps, item) => {
          const product = products.find(p => (p._id?.toString?.() || p.id) === (item.id || item._id))
          const costPrice = product?.costPrice || 0
          return ps + (item.price - costPrice) * item.quantity
        }, 0)
        dailyProfit[idx] += orderProfit
      }
    })

    // Top Buyers - Users who bought the most
    const userPurchases = {}
    orders.filter(o => o.status !== 'cancelled').forEach(order => {
      const uid = order.userId
      if (!userPurchases[uid]) {
        userPurchases[uid] = {
          userId: uid,
          userName: order.shipping?.fullName || order.userEmail || 'Unknown',
          userEmail: order.userEmail || '',
          totalSpent: 0,
          totalOrders: 0,
          totalItems: 0,
        }
      }
      userPurchases[uid].totalSpent += order.total
      userPurchases[uid].totalOrders += 1
      userPurchases[uid].totalItems += (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
    })

    const topBuyers = Object.values(userPurchases)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    // Items Sales Rate - High and Low performing items
    const itemsSalesRate = Object.entries(productDemand)
      .map(([name, quantity]) => ({
        name,
        quantity,
        revenue: productRevenue[name] || 0,
        avgPrice: quantity > 0 ? (productRevenue[name] || 0) / quantity : 0,
      }))
      .sort((a, b) => b.quantity - a.quantity)

    const highSellingItems = itemsSalesRate.slice(0, 10)
    const lowSellingItems = itemsSalesRate.slice(-10).reverse()

    res.json({
      months,
      monthlyRevenue,
      monthlyOrders,
      monthlyProfit,
      topProducts,
      demandProducts,
      revenueShare,
      allProducts,
      dailyLabels,
      dailyRevenue,
      dailyOrders,
      dailyProfit,
      topBuyers,
      highSellingItems,
      lowSellingItems,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
