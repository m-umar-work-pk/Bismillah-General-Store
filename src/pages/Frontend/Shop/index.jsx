import { useState, useEffect } from 'react'
import { api } from '@/config/api'
import { Card, Col, Input, Row, Select, Spin, Typography } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatCurrency } from '@/utils/format'

const { Title, Paragraph } = Typography
const { Meta } = Card
const { Search } = Input

const Shop = () => {
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const navigate = useNavigate()

  const categoryFilter = searchParams.get('category')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.get('/products')
        setProducts(data)
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    let result = [...products]

    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter)
    }

    if (searchTerm) {
      result = result.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price)
    else result.sort((a, b) => {
      const pa = a.position || 0
      const pb = b.position || 0
      if (pa !== pb) return pa - pb
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const db2 = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return db2 - da
    })

    setFiltered(result) // eslint-disable-line react-hooks/set-state-in-effect
  }, [products, categoryFilter, searchTerm, sortBy])

  return (
    <main className="container py-5">
      <Title level={2} className="text-primary">
        {categoryFilter ? `Category: ${categoryFilter}` : 'All Products'}
      </Title>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={8}>
          <Search placeholder="Search products..." onChange={e => setSearchTerm(e.target.value)} allowClear />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: '100%' }}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'price-asc', label: 'Price: Low to High' },
              { value: 'price-desc', label: 'Price: High to Low' },
            ]}
          />
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5"><Spin size="large" /></div>
      ) : filtered.length === 0 ? (
        <Paragraph className="text-center">No products found.</Paragraph>
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map(product => (
            <Col xs={24} sm={12} md={6} key={product._id}>
              <div className="product-card" onClick={() => { if (product.stock > 0) navigate(`/shop/${product._id}`) }}>
                <Card
                  hoverable
                  cover={
                    <div style={{ position: 'relative', width: '100%', background: '#f5f5f5', aspectRatio: '4/3' }}>
                      <img alt={product.name} src={product.images?.[0] || 'https://placehold.co/300x220?text=No+Image'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {product.stock <= 0 && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
                        }}>
                          <span style={{
                            color: '#fff', fontSize: 18, fontWeight: 'bold',
                            border: '2px solid #fff', padding: '6px 18px', borderRadius: 4,
                          }}>Out of Stock</span>
                        </div>
                      )}
                    </div>
                  }
                >
                  <Meta
                    title={product.name}
                    description={
                      <>
                        <div style={{ fontWeight: 600, color: '#2a9d8f', fontSize: '1.1rem' }}>
                          Rs {formatCurrency(product.price)} / {product.unit || 'pcs'}
                        </div>
                        {product.category && (
                          <div style={{ fontSize: '0.85rem', color: '#999', marginTop: 4 }}>
                            {product.category}
                          </div>
                        )}
                      </>
                    }
                  />
                </Card>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </main>
  )
}

export default Shop
