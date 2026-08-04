import { useState, useEffect } from 'react'
import { api } from '@/config/api'
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography, Alert } from 'antd'
import { PlusOutlined, WarningOutlined, MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { formatCurrency, formatDateTime } from '@/utils/format'

const { Title, Text } = Typography
const { Item } = Form
const { Option } = Select

const Stock = () => {
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [adjustType, setAdjustType] = useState('add')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [adjustQty, setAdjustQty] = useState(1)
  const [adjustNote, setAdjustNote] = useState('')
  const [showOutOfStock, setShowOutOfStock] = useState(false)

  const remainingProducts = products.filter(p => (p.stock ?? 0) > 0)
  const visibleProducts = showOutOfStock ? products : remainingProducts

  const fetchData = async () => {
    try {
      const data = await api.get('/stock')
      setProducts(Array.isArray(data.products) ? data.products : [])
      setMovements(Array.isArray(data.movements) ? data.movements : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  const handleAdjust = async () => {
    if (!selectedProduct || !adjustQty || adjustQty <= 0) {
      window.toastify('Select a product and valid quantity', 'error')
      return
    }

    const product = products.find(p => p._id === selectedProduct)
    if (!product) return

    const currentStock = product.stock || 0
    const newStock = adjustType === 'add' ? currentStock + adjustQty : currentStock - adjustQty

    if (newStock < 0) {
      window.toastify('Not enough stock to remove', 'error')
      return
    }

    try {
      await api.put(`/stock/${product._id}`, {
        stock: newStock,
        type: adjustType,
        quantity: adjustQty,
        note: adjustNote || (adjustType === 'add' ? 'Stock added' : 'Stock removed'),
      })

      window.toastify(`Stock ${adjustType === 'add' ? 'added' : 'removed'} successfully`, 'success')
      setModalOpen(false)
      setAdjustQty(1)
      setAdjustNote('')
      fetchData()
    } catch {
      window.toastify('Failed to update stock', 'error')
    }
  }

  const lowStockProducts = products.filter(p => (p.stock ?? 0) <= 5)
  const outOfStock = products.filter(p => (p.stock ?? 0) === 0)

  const columns = [
    { title: 'Product', dataIndex: 'name', key: 'name' },
    {
      title: 'Current Stock', dataIndex: 'stock', key: 'stock',
      render: (stock) => {
        const s = stock ?? 0
        if (s === 0) return <Tag color="red">Unavailable</Tag>
        if (s <= 5) return <Tag color="orange">{s}</Tag>
        return <Tag color="green">{s}</Tag>
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, r) => {
        const s = r.stock ?? 0
        if (s === 0) return <Tag color="red">Out of Stock</Tag>
        if (s <= 5) return <Tag color="orange">Low Stock</Tag>
        return <Tag color="green">In Stock</Tag>
      },
    },
    { title: 'Sale Price', dataIndex: 'price', key: 'price', render: (v, r) => `Rs ${formatCurrency(v)} / ${r.unit || 'pcs'}` },
    { title: 'Cost Price', dataIndex: 'costPrice', key: 'costPrice', render: (v) => v ? `Rs ${formatCurrency(v)}` : '-' },
    {
      title: 'Profit', key: 'profit',
      render: (_, r) => {
        const profit = (r.price || 0) - (r.costPrice || 0)
        const margin = r.price > 0 ? ((profit / r.price) * 100).toFixed(1) : 0
        return profit > 0
          ? <span style={{ color: '#2a9d8f' }}>Rs {formatCurrency(profit)} ({margin}%)</span>
          : <span style={{ color: '#e63946' }}>Rs {formatCurrency(profit)}</span>
      },
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Button size="small" onClick={() => { setSelectedProduct(record._id); setModalOpen(true) }}>
          Adjust Stock
        </Button>
      ),
    },
  ]

  const movementColumns = [
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (v) => formatDateTime(v) },
    { title: 'Product', dataIndex: 'productName', key: 'productName' },
    {
      title: 'Type', dataIndex: 'type', key: 'type',
      render: (type) => type === 'add'
        ? <Tag icon={<PlusCircleOutlined />} color="green">Stock In</Tag>
        : <Tag icon={<MinusCircleOutlined />} color="red">Stock Out</Tag>,
    },
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Previous', dataIndex: 'previousStock', key: 'previousStock' },
    { title: 'New Stock', dataIndex: 'newStock', key: 'newStock' },
    { title: 'Note', dataIndex: 'note', key: 'note' },
  ]

  return (
    <>
      <Title level={3}>Stock Management</Title>

      {outOfStock.length > 0 && (
        <Alert message={`${outOfStock.length} product(s) are out of stock!`} type="error" showIcon className="mb-3" />
      )}

      {lowStockProducts.length > 0 && outOfStock.length === 0 && (
        <Alert
          message={`${lowStockProducts.length} product(s) have low stock (≤5 items)`}
          type="warning" showIcon icon={<WarningOutlined />} className="mb-3"
        />
      )}

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={8}>
          <Card size="small">
            <Text type="secondary">In Stock</Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#2a9d8f' }}>{remainingProducts.length}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Text type="secondary">Low Stock</Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#e76f51' }}>{lowStockProducts.length}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Text type="secondary">Out of Stock</Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#e63946' }}>{outOfStock.length}</div>
          </Card>
        </Col>
      </Row>

      <Card
        title={`Inventory (${visibleProducts.length} products)`}
        extra={
          <Space>
            <Button size="small" type={showOutOfStock ? 'primary' : 'default'} onClick={() => setShowOutOfStock(!showOutOfStock)}>
              {showOutOfStock ? 'Showing All' : 'Hide Out of Stock'}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedProduct(null); setModalOpen(true) }}>Adjust Stock</Button>
          </Space>
        }
        className="mb-4"
      >
        <Table dataSource={visibleProducts} columns={columns} rowKey="_id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 'max-content' }} />
      </Card>

      <Card title="Stock Movement History">
        <Table dataSource={movements} columns={movementColumns} rowKey="_id" pagination={{ pageSize: 10 }} scroll={{ x: 'max-content' }} />
      </Card>

      <Modal
        title="Adjust Stock"
        open={modalOpen}
        onOk={handleAdjust}
        onCancel={() => { setModalOpen(false); setAdjustQty(1); setAdjustNote('') }}
      >
        <Form layout="vertical">
          <Item label="Product">
            <Select placeholder="Select a product" value={selectedProduct} onChange={setSelectedProduct} showSearch optionFilterProp="children">
              {products.map(p => (
                <Option key={p._id} value={p._id}>
                  {p.name} (Current: {p.stock ?? 0})
                </Option>
              ))}
            </Select>
          </Item>
          <Item label="Type">
            <Select value={adjustType} onChange={setAdjustType}>
              <Option value="add">Stock In (Add)</Option>
              <Option value="remove">Stock Out (Remove)</Option>
            </Select>
          </Item>
          <Item label="Quantity">
            <InputNumber min={0.001} step={0.01} precision={3} value={adjustQty} onChange={setAdjustQty} style={{ width: '100%' }} />
          </Item>
          <Item label="Note (optional)">
            <Input value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} placeholder="e.g. New shipment received" />
          </Item>
        </Form>
      </Modal>
    </>
  )
}

export default Stock