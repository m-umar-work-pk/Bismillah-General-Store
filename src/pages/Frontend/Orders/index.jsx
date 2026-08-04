import { useState, useEffect } from 'react'
import { useAuth } from '@/context/Auth'
import { api } from '@/config/api'
import { Card, Col, Empty, Row, Spin, Tag, Typography, Popconfirm } from 'antd'
import { ShoppingOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatCurrency } from '@/utils/format'

const { Title, Text } = Typography

const statusColors = {
  pending: 'orange', confirmed: 'blue', shipped: 'purple',
  delivered: 'green', cancelled: 'red'
}

const Orders = () => {
  const { user, isAuth } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuth) { navigate('/auth/login'); return }
    const fetchOrders = async () => {
      try {
        const data = await api.get('/orders')
        setOrders(data)
      } catch {
        setOrders([])
        window.toastify?.('Failed to load orders', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user, isAuth, navigate])

  const handleCancelOrder = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}`, { status: 'cancelled' })
      setOrders(prev => prev.map(o => (o._id || o.id) === orderId ? { ...o, status: 'cancelled' } : o))
      window.toastify?.('Order cancelled. Stock has been restored.', 'success')
    } catch {
      window.toastify?.('Failed to cancel order', 'error')
    }
  }

  if (loading) return <main className="container py-5 text-center"><Spin size="large" /></main>

  return (
    <main className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <ShoppingOutlined style={{ fontSize: 28, color: '#1d3557' }} />
        <Title level={2} style={{ margin: 0 }}>My Orders</Title>
      </div>
      {orders.length === 0 ? (
        <Card>
          <Empty description="No orders yet">
            <button className="btn btn-primary" onClick={() => navigate('/shop')}>Start Shopping</button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[20, 20]} justify="center">
          {orders.map(order => (
            <Col xs={24} sm={22} md={18} lg={14} key={order._id || order.id}>
              <Card
                style={{
                  borderRadius: 0,
                  border: '2px solid #1d3557',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                styles={{ body: { padding: '32px 36px' } }}
              >
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <Title level={3} style={{ margin: 0, color: '#1d3557', fontFamily: 'inherit' }}>Bismillah General Store</Title>
                  <Text type="secondary" style={{ fontFamily: 'inherit', fontSize: 13 }}>Invoice / Receipt</Text>
                </div>

                <div style={{ borderTop: '2px dashed #ccc', borderBottom: '2px dashed #ccc', padding: '12px 0', marginBottom: 16 }}>
                  <Row justify="space-between">
                    <Col>
                      <Text style={{ fontFamily: 'inherit', fontSize: 13 }}>Bill No: BILL-{(order._id || order.id).slice(-8).toUpperCase()}</Text>
                    </Col>
                    <Col>
                      <Tag color={statusColors[order.status]} style={{ fontFamily: 'inherit', borderRadius: 0, fontSize: 11 }}>
                        {order.status.toUpperCase()}
                      </Tag>
                    </Col>
                  </Row>
                  <Row justify="space-between" style={{ marginTop: 4 }}>
                    <Text style={{ fontFamily: 'inherit', fontSize: 13 }}>Date: {formatDate(order.createdAt)}</Text>
                    <Text style={{ fontFamily: 'inherit', fontSize: 13 }}>Items: {order.items?.length || 0}</Text>
                  </Row>
                </div>

                <div style={{ marginBottom: 16, fontSize: 13 }}>
                  <Text style={{ fontFamily: 'inherit' }}><strong>Customer:</strong> {order.shipping?.fullName || order.userEmail || 'N/A'}</Text><br />
                  <Text style={{ fontFamily: 'inherit' }}><strong>Address:</strong> {order.shipping?.address}, {order.shipping?.city}</Text><br />
                  <Text style={{ fontFamily: 'inherit' }}><strong>Phone:</strong> {order.shipping?.phone || 'N/A'}</Text>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                  <thead>
                    <tr style={{ borderTop: '1px solid #333', borderBottom: '1px solid #333' }}>
                      <th style={{ padding: '6px 4px', textAlign: 'left', fontFamily: 'inherit' }}>#</th>
                      <th style={{ padding: '6px 4px', textAlign: 'left', fontFamily: 'inherit' }}>Item</th>
                      <th style={{ padding: '6px 4px', textAlign: 'center', fontFamily: 'inherit' }}>Qty</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right', fontFamily: 'inherit' }}>Price</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right', fontFamily: 'inherit' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, i) => (
                      <tr key={item.id || i} style={{ borderBottom: '1px dotted #ddd' }}>
                        <td style={{ padding: '6px 4px', fontFamily: 'inherit' }}>{i + 1}</td>
                        <td style={{ padding: '6px 4px', fontFamily: 'inherit' }}>{item.name}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontFamily: 'inherit' }}>{item.quantity} {item.unit || 'pcs'}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'right', fontFamily: 'inherit' }}>Rs {formatCurrency(item.price)}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'right', fontFamily: 'inherit' }}>Rs {formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderTop: '2px dashed #ccc', paddingTop: 12, textAlign: 'right' }}>
                  <Text style={{ fontFamily: 'inherit', fontSize: 18, fontWeight: 'bold', color: '#2a9d8f' }}>
                    Grand Total: Rs {formatCurrency(order.total)}
                  </Text>
                </div>

                <div style={{ textAlign: 'center', marginTop: 24, borderTop: '2px dashed #ccc', paddingTop: 16 }}>
                  <Text type="secondary" style={{ fontFamily: 'inherit', fontSize: 12, display: 'block', marginBottom: 12 }}>
                    Thank you for shopping at Bismillah General Store!
                  </Text>
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <Popconfirm
                      title="Cancel this order?"
                      description="Stock will be restored for all items."
                      onConfirm={() => handleCancelOrder(order._id || order.id)}
                      okText="Cancel Order"
                      cancelText="Keep Order"
                      okButtonProps={{ danger: true }}
                    >
                      <button style={{ background: 'none', border: '1px solid #ff4d4f', color: '#ff4d4f', padding: '4px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                        <DeleteOutlined /> Cancel Order
                      </button>
                    </Popconfirm>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </main>
  )
}

export default Orders
