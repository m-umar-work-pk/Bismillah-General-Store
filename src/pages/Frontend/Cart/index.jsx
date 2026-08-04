import { useCart } from '@/context/Cart'
import { Button, Col, InputNumber, Row, Typography, Divider, Empty } from 'antd'
import { DeleteOutlined, ShoppingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/utils/format'

const { Title, Text } = Typography

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart()
  const navigate = useNavigate()

  if (cart.length === 0) {
    return (
      <main className="empty-cart">
        <Empty
          image={<ShoppingOutlined style={{ fontSize: 80, color: '#ccc' }} />}
          description={<Title level={4}>Your cart is empty</Title>}
        >
          <Button type="primary" size="large" onClick={() => navigate('/shop')}>Start Shopping</Button>
        </Empty>
      </main>
    )
  }

  return (
    <main className="container py-5">
      <Title level={2}>Shopping Cart ({cartCount} items)</Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {cart.map(item => (
            <div key={item._id} className="mb-3 p-3 border rounded-3">
              <Row gutter={[16, 16]} align="middle">
                <Col xs={6} sm={4}>
                  <img className="cart-item-img" src={item.images?.[0] || 'https://placehold.co/80x80?text=N'} alt={item.name} />
                </Col>
                <Col xs={10} sm={10}>
                  <Text strong style={{ fontSize: '1rem' }}>{item.name}</Text>
                  <div style={{ color: '#2a9d8f', fontWeight: 600 }}>Rs {formatCurrency(item.price)} / {item.unit || 'pcs'}</div>
                </Col>
                <Col xs={4} sm={5}>
                  <InputNumber min={0.1} step={item.unit === 'KG' ? 0.1 : 1} max={item.stock || 99} value={item.quantity} onChange={v => updateQuantity(item._id, v)} />
                </Col>
                <Col xs={4} sm={3} className="text-end">
                  <Text strong>Rs {formatCurrency(item.price * item.quantity)}</Text>
                </Col>
                <Col xs={2} sm={2} className="text-end">
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeFromCart(item._id)} />
                </Col>
              </Row>
            </div>
          ))}
        </Col>
        <Col xs={24} lg={8}>
          <div className="p-4 border rounded-3" style={{ position: 'sticky', top: 24 }}>
            <Title level={4}>Order Summary</Title>
            <Divider />
            <Row justify="space-between" className="mb-2">
              <Text>Subtotal ({cartCount} items)</Text>
              <Text strong>Rs {formatCurrency(cartTotal)}</Text>
            </Row>
            <Row justify="space-between" className="mb-3">
              <Text>Shipping</Text>
              <Text strong>Calculated at checkout</Text>
            </Row>
            <Divider />
            <Row justify="space-between" className="mb-4">
              <Text strong style={{ fontSize: '1.1rem' }}>Total</Text>
              <Text strong style={{ fontSize: '1.1rem', color: '#2a9d8f' }}>Rs {formatCurrency(cartTotal)}</Text>
            </Row>
            <Button type="primary" size="large" block onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </Button>
            <Button size="large" block className="mt-2" onClick={() => navigate('/shop')}>
              Continue Shopping
            </Button>
          </div>
        </Col>
      </Row>
    </main>
  )
}

export default Cart
