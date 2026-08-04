import { useState, useEffect, useRef } from 'react'
import { api } from '@/config/api'
import { Button, Card, Col, Form, Image, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography, Popconfirm, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/utils/format'
import { useAuth } from '@/context/Auth'

const { Title } = Typography
const { Item } = Form
const { TextArea } = Input

const Products = () => {
  const navigate = useNavigate()
  const { userRole } = useAuth()
  const isAdmin = userRole === 'admin'
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form] = Form.useForm()
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const previewUrlRef = useRef(null)

  const fetchData = async () => {
    try {
      const [prodData, catData] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ])
      setProducts(Array.isArray(prodData) ? prodData : [])
      setCategories(Array.isArray(catData) ? catData : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  const openCreate = () => {
    setEditingProduct(null)
    form.resetFields()
    form.setFieldValue('featured', false)
    setImageFile(null)
    setImagePreview(null)
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditingProduct(product)
    form.setFieldsValue({
      ...product,
      featured: product.featured || false
    })
    setImageFile(null)
    setImagePreview(product.images?.[0] || null)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`)
      window.toastify('Product moved to Recycle Bin', 'success')
      fetchData()
    } catch (err) {
      window.toastify(err.message || 'Failed to delete', 'error')
    }
  }

  const handleRestore = async (id) => {
    try {
      await api.put(`/products/${id}/restore`)
      window.toastify('Product restored', 'success')
      fetchData()
    } catch (err) {
      window.toastify(err.message || 'Failed to restore', 'error')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setUploading(true)

      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('category', values.category)
      formData.append('unit', values.unit || (values.category === 'groceries' ? 'KG' : 'pcs'))
      formData.append('price', Number(values.price))
      formData.append('costPrice', Number(values.costPrice || 0))
      formData.append('stock', Number(values.stock))
      formData.append('featured', values.featured || false)
      formData.append('description', values.description || '')
      if (imageFile) {
        formData.append('image', imageFile)
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData, true)
        window.toastify('Product updated', 'success')
      } else {
        await api.post('/products', formData, true)
        window.toastify('Product created', 'success')
      }

      setModalOpen(false)
      fetchData()
    } catch (err) {
      window.toastify(err?.message || 'Failed to save product', 'error')
    } finally {
      setUploading(false)
    }
  }

  const columns = [
    { title: 'Image', dataIndex: 'images', render: (imgs) => <Image width={60} src={imgs?.[0] || 'https://placehold.co/60'} /> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (v) => <Tag>{v}</Tag> },
    { title: 'Sale Price', dataIndex: 'price', key: 'price', render: (v, r) => `Rs ${formatCurrency(v)} / ${r.unit || 'pcs'}` },
    {
      title: 'Cost Price', dataIndex: 'costPrice', key: 'costPrice',
      render: (v) => v ? `Rs ${formatCurrency(v)}` : '-',
    },
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
      title: 'Stock', dataIndex: 'stock', key: 'stock', render: (v) => v ?? '-',
    },
    {
      title: 'Featured', dataIndex: 'featured', key: 'featured',
      render: (v) => <Tag color={v ? 'gold' : 'default'}>{v ? '⭐ Yes' : 'No'}</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => {
        if (!isAdmin) return null
        if (record.isDeleted) {
          return (
            <Space>
              <Popconfirm title="Restore this product?" onConfirm={() => handleRestore(record._id)}>
                <Button icon={<ReloadOutlined />} type="primary">Restore</Button>
              </Popconfirm>
            </Space>
          )
        }
        return (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
            <Popconfirm title="Move to Recycle Bin?" onConfirm={() => handleDelete(record._id)}>
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <>
      <Row justify="space-between" align="middle" className="mb-3">
        <Col><Title level={3}>Products</Title></Col>
        <Col>
          <Space>
            {isAdmin && <Button icon={<ReloadOutlined />} onClick={() => navigate('/dashboard/recycle-bin')}>Recycle Bin</Button>}
            {isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Product</Button>}
          </Space>
        </Col>
      </Row>
      <Card>
        <Table dataSource={products} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 'max-content' }} />
      </Card>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setImagePreview(null); setImageFile(null) }}
        confirmLoading={uploading}
        width={Math.min(600, window.innerWidth - 48)}
        style={{ maxWidth: 'calc(100vw - 48px)' }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Item label="Name" name="name" rules={[{ required: true }]}>
                <Input />
              </Item>
            </Col>
            <Col xs={24} sm={12}>
              <Item label="Category" name="category" rules={[{ required: true }]}>
                <Select
                  options={categories.map(c => ({ value: c.slug || c.name, label: c.name }))}
                  placeholder="Select category"
                  onChange={(val) => {
                    if (!editingProduct) form.setFieldValue('unit', val === 'groceries' ? 'KG' : 'pcs')
                  }}
                />
              </Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Item label="Sale Price" name="price" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.01} precision={3} prefix="Rs" style={{ width: '100%' }} />
              </Item>
            </Col>
            <Col xs={24} sm={8}>
              <Item label="Cost Price" name="costPrice" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.01} precision={3} prefix="Rs" style={{ width: '100%' }} />
              </Item>
            </Col>
            <Col xs={24} sm={8}>
              <Item label="Unit" name="unit">
                <Select
                  options={[
                    { value: 'pcs', label: 'pcs' },
                    { value: 'KG', label: 'KG' },
                    { value: 'L', label: 'L' },
                    { value: 'dozen', label: 'dozen' },
                    { value: 'pack', label: 'pack' },
                  ]}
                />
              </Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Item label="Stock" name="stock" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.01} precision={3} style={{ width: '100%' }} />
              </Item>
            </Col>
            <Col xs={24} sm={8}>
              <Item label="Featured" name="featured" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Item>
            </Col>
          </Row>
          <Item label="Description" name="description">
            <TextArea rows={3} />
          </Item>
          <Item label="Image">
            <Input type="file" accept="image/*" onChange={e => {
              const file = e.target.files[0]
              setImageFile(file)
              if (file) {
                if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
                const url = URL.createObjectURL(file)
                previewUrlRef.current = url
                setImagePreview(url)
              }
            }} />
            {imagePreview && (
              <div style={{ marginTop: 8 }}>
                <Image width={120} src={imagePreview} />
              </div>
            )}
          </Item>
        </Form>
      </Modal>
    </>
  )
}

export default Products