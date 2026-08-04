import { useState, useEffect } from 'react'
import { api } from '@/config/api'
import { Card, Col, Row, Typography, Spin, Button, Tag } from 'antd'
import { ShoppingOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/utils/format'

const { Title, Paragraph } = Typography
const { Meta } = Card

const Home = () => {
  const [allProducts, setAllProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodData, catData] = await Promise.all([
          api.get('/products?featured=true'),
          api.get('/categories'),
        ])
        setAllProducts((Array.isArray(prodData) ? prodData : []).sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0)))
        setCategories((Array.isArray(catData) ? catData : []).filter(c => !c.isDeleted).sort((a, b) => a.name.localeCompare(b.name)))
      } catch {
        setAllProducts([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredProducts = selectedCategory
    ? allProducts.filter(p => p.category === selectedCategory)
    : allProducts

  const displayProducts = filteredProducts.slice(0, 8)

  return (
    <>
      <section className="hero-section">
        <div className="container text-center text-white py-5">
          <h1 style={{ fontSize: '3rem', fontWeight: 700, color: '#fff' }}>Welcome to Bismillah General Store</h1>
          <p style={{ color: '#a8dadc', fontSize: '1.2rem' }}>
            Your one-stop shop for quality groceries and everyday essentials at affordable prices.
          </p>
          <button className="btn btn-light btn-lg mt-3" onClick={() => navigate('/shop')}>
            <ShoppingOutlined /> Start Shopping
          </button>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container py-5">
          <Title level={2} className="text-center mb-4 text-primary">Shop by Category</Title>
          <Row gutter={[20, 20]} justify="center">
            {categories.map(cat => (
              <Col xs={12} sm={8} md={6} lg={4} key={cat._id}>
                <div
                  className="category-card"
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card
                    hoverable
                    style={{
                      textAlign: 'center',
                      border: selectedCategory === cat.name ? '2px solid #1d3557' : '2px solid transparent',
                      boxShadow: selectedCategory === cat.name ? '0 4px 12px rgba(29,53,87,0.2)' : 'none',
                    }}
                  >
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto 8px' }} />
                    ) : (
                      <div className="category-icon">{cat.icon || '📦'}</div>
                    )}
                    <Meta title={cat.name} />
                  </Card>
                </div>
              </Col>
            ))}
          </Row>
        </section>
      )}

      <section className="container py-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <Title level={2} className="text-primary" style={{ margin: 0 }}>
            {selectedCategory ? `${selectedCategory}` : 'Featured Products'}
          </Title>
          {selectedCategory && (
            <Tag
              closable
              onClose={(e) => { e.preventDefault(); setSelectedCategory(null) }}
              color="blue"
              style={{ fontSize: 14, padding: '4px 12px' }}
            >
              Clear Filter
            </Tag>
          )}
        </div>
        {loading ? (
          <div className="text-center py-5"><Spin size="large" /></div>
        ) : displayProducts.length === 0 ? (
          <Paragraph className="text-center">
            {selectedCategory ? `No featured products in "${selectedCategory}" category.` : 'No products yet. Check back soon!'}
          </Paragraph>
        ) : (
          <Row gutter={[16, 16]}>
            {displayProducts.map(product => (
              <Col xs={24} sm={12} md={6} key={product._id}>
                <div className="product-card" onClick={() => navigate(`/shop/${product._id}`)}>
                  <Card
                    hoverable
                    cover={
                      <img alt={product.name} src={product.images?.[0] || 'https://placehold.co/300x220?text=No+Image'} />
                    }
                  >
                    <Meta title={product.name} description={`Rs ${formatCurrency(product.price)} / ${product.unit || 'pcs'}`} />
                  </Card>
                </div>
              </Col>
            ))}
          </Row>
        )}
        {selectedCategory && displayProducts.length > 0 && (
          <div className="text-center mt-4">
            <Button type="link" onClick={() => navigate(`/shop?category=${selectedCategory}`)}>
              View all {selectedCategory} products →
            </Button>
          </div>
        )}
      </section>
    </>
  )
}

export default Home
