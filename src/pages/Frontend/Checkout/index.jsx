import { useState, useEffect } from 'react'
import { useAuth } from '@/context/Auth'
import { useCart } from '@/context/Cart'
import { api } from '@/config/api'
import { Button, Col, Form, Input, Row, Typography, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/utils/format'

const { Title, Text } = Typography
const { Item } = Form

const Checkout = () => {
  const { user } = useAuth()
  const { cart, cartTotal, clearCart } = useCart()
  const [state, setState] = useState({ fullName: '', phone: '', address: '', city: '', zip: '' })
  const [isProcessing, setIsProcessing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      setState(prev => ({ ...prev, fullName: prev.fullName || user.fullName || '' }))
    }
  }, [user])

  useEffect(() => {
    if (!user) { navigate('/auth/login'); return }
    if (cart.length === 0) { navigate('/cart'); return }
  }, [user, cart, navigate])

  const handleChange = (e) => {
    setState({ ...state, [e.target.name]: e.target.value })
  }

  const handlePlaceOrder = async () => {
    const { fullName, phone, address, city, zip } = state
    if (!fullName || !phone || !address || !city) {
      window.toastify('Please fill in all required fields', 'error')
      return
    }

    setIsProcessing(true)
    try {
      await api.post('/orders', {
        items: cart.map(item => ({
          id: item._id || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit || 'pcs',
          category: item.category || '',
          images: item.images || [],
        })),
        total: cartTotal,
        shipping: { fullName, phone, address, city, zip },
      })
      clearCart()
      window.toastify('Order placed successfully!', 'success')
      navigate('/orders')
    } catch {
      window.toastify('Failed to place order. Please try again.', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="container py-5">
      <Row justify="space-between" align="middle" className="mb-4">
        <Col><Title level={2}>Checkout</Title></Col>
      </Row>
      <Row gutter={[32, 32]}>
        <Col xs={24} lg={14}>
          <div className="p-4 border rounded-3">
            <Title level={4}>Shipping Information</Title>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Item label="Full Name" required>
                    <Input name="fullName" size="large" placeholder="John Doe" defaultValue={user?.fullName || ''} onChange={handleChange} />
                  </Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Item label="Phone" required>
                    <Input name="phone" size="large" placeholder="+1 234 567 8900" onChange={handleChange} />
                  </Item>
                </Col>
              </Row>
              <Item label="Address" required>
                <Input name="address" size="large" placeholder="123 Main St" onChange={handleChange} />
              </Item>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Item label="City" required>
                    <Input name="city" size="large" placeholder="New York" onChange={handleChange} />
                  </Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Item label="ZIP Code">
                    <Input name="zip" size="large" placeholder="10001" onChange={handleChange} />
                  </Item>
                </Col>
              </Row>
            </Form>
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <div className="p-4 border rounded-3" style={{ background: '#fff', fontFamily: "'Courier New', Courier, monospace" }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Title level={3} style={{ margin: 0, color: '#1d3557', fontFamily: 'inherit' }}>Bismillah General Store</Title>
              <Text type="secondary" style={{ fontFamily: 'inherit', fontSize: 13 }}>Invoice / Receipt</Text>
            </div>

            <div style={{ borderTop: '2px dashed #ccc', borderBottom: '2px dashed #ccc', padding: '12px 0', marginBottom: 16 }}>
              <Row justify="space-between">
                <Col>
                  <Text style={{ fontFamily: 'inherit', fontSize: 13 }}>Bill No: BILL-{Date.now().toString().slice(-8).toUpperCase()}</Text>
                </Col>
                <Col>
                  <Tag color="orange" style={{ fontFamily: 'inherit', borderRadius: 0, fontSize: 11 }}>PENDING</Tag>
                </Col>
              </Row>
              <Row justify="space-between" style={{ marginTop: 4 }}>
                <Text style={{ fontFamily: 'inherit', fontSize: 13 }}>Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')} {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</Text>
                <Text style={{ fontFamily: 'inherit', fontSize: 13 }}>Items: {cart.length}</Text>
              </Row>
            </div>

            <div style={{ marginBottom: 16, fontSize: 13 }}>
              <Text style={{ fontFamily: 'inherit' }}><strong>Customer:</strong> {state.fullName || user?.fullName || 'N/A'}</Text><br />
              <Text style={{ fontFamily: 'inherit' }}><strong>Address:</strong> {state.address}, {state.city}</Text><br />
              <Text style={{ fontFamily: 'inherit' }}><strong>Phone:</strong> {state.phone || 'N/A'}</Text>
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
                {cart.map((item, i) => (
                  <tr key={item._id || i} style={{ borderBottom: '1px dotted #ddd' }}>
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
                Grand Total: Rs {formatCurrency(cartTotal)}
              </Text>
            </div>

            <div style={{ textAlign: 'center', marginTop: 24, borderTop: '2px dashed #ccc', paddingTop: 16 }}>
              <Text type="secondary" style={{ fontFamily: 'inherit', fontSize: 12, display: 'block', marginBottom: 12 }}>
                Thank you for shopping at Bismillah General Store!
              </Text>
              <Button
                type="primary"
                size="large"
                block
                loading={isProcessing}
                onClick={handlePlaceOrder}
                style={{ background: '#1d3557', borderColor: '#1d3557', fontFamily: 'inherit', width: '100%' }}
              >
                Place Order
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </main>
  )
}

export default Checkout
