import { useState, useEffect } from 'react'
import { api } from '@/config/api'
import { useCart } from '@/context/Cart'
import { Button, Col, InputNumber, Row, Spin, Typography } from 'antd'
import { ShoppingCartOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/utils/format'

const { Title, Paragraph } = Typography

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await api.get(`/products/${id}`)
        setProduct(data)
      } catch {
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  if (loading) return <main className="container py-5 text-center"><Spin size="large" /></main>
  if (!product) return <main className="container py-5 text-center"><Paragraph>Product not found.</Paragraph></main>

  return (
    <main className="container py-5">
      <Row gutter={[32, 32]}>
        <Col xs={24} md={12}>
          <img
            className="product-detail-img"
            src={product.images?.[0] || 'https://placehold.co/600x450?text=No+Image'}
            alt={product.name}
          />
        </Col>
        <Col xs={24} md={12}>
          <Title level={2}>{product.name}</Title>
          {product.category && (
            <Paragraph style={{ color: '#999' }}>{product.category}</Paragraph>
          )}
          <Title level={3} style={{ color: '#2a9d8f' }}>Rs {formatCurrency(product.price)} / {product.unit || 'pcs'}</Title>
          <Paragraph style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
            {product.description || 'No description available.'}
          </Paragraph>
          {product.stock !== undefined && (
            <Paragraph>
              {product.stock > 0
                ? <span style={{ color: '#2a9d8f' }}>In Stock ({product.stock} available)</span>
                : <span style={{ color: '#e63946' }}>Out of Stock</span>}
            </Paragraph>
          )}
          <div className="quantity-control mb-4">
            <span>Quantity:</span>
            <InputNumber min={0.1} step={product.unit === 'KG' ? 0.1 : 1} max={product.stock || 99} value={quantity} onChange={setQuantity} />
          </div>
          <Button
            type="primary"
            size="large"
            icon={<ShoppingCartOutlined />}
            onClick={() => { addToCart(product, quantity); window.toastify('Added to cart!', 'success') }}
            disabled={product.stock === 0}
          >
            Add to Cart
          </Button>
          <Button className="ms-2" size="large" onClick={() => navigate('/shop')}>
            Continue Shopping
          </Button>
        </Col>
      </Row>
    </main>
  )
}

export default ProductDetails
