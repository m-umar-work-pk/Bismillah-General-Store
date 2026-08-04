import { useState, useEffect, useRef } from 'react'
import { api } from '@/config/api'
import { Button, Card, Col, Form, Image, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { formatCurrency, formatDate } from '@/utils/format'

const { Title } = Typography
const { Item } = Form

const ProductRecycleBin = () => {
  const [products, setProducts] = useState([])
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
      const all = await api.get('/products?all=true')
      setProducts(all.filter(p => p.isDeleted === true))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openEdit = (product) => {
    setEditingProduct(product)
    form.setFieldsValue({ ...product, featured: product.featured || false })
    setImageFile(null)
    setImagePreview(product.images?.[0] || null)
    setModalOpen(true)
  }

  const handleRestore = async (id) => {
    await api.put(`/products/${id}/restore`)
    window.toastify('Product restored', 'success')
    fetchData()
  }

  const handlePermanentDelete = async (id) => {
    await api.delete(`/products/${id}/permanent`)
    window.toastify('Product permanently deleted', 'success')
    fetchData()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setUploading(true)
      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('category', values.category || '')
      formData.append('unit', values.unit || 'pcs')
      formData.append('price', Number(values.price))
      formData.append('costPrice', Number(values.costPrice || 0))
      formData.append('stock', Number(values.stock))
      formData.append('featured', values.featured || false)
      formData.append('description', values.description || '')
      if (imageFile) formData.append('image', imageFile)

      await api.put(`/products/${editingProduct._id}`, formData, true)
      window.toastify('Product restored and updated', 'success')
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
    { title: 'Cost Price', dataIndex: 'costPrice', key: 'costPrice', render: (v) => v ? `Rs ${formatCurrency(v)}` : '-' },
    { title: 'Stock', dataIndex: 'stock', key: 'stock', render: (v) => v ?? '-' },
    { title: 'Featured', dataIndex: 'featured', key: 'featured', render: (v) => <Tag color={v ? 'gold' : 'default'}>{v ? 'Yes' : 'No'}</Tag> },
    { title: 'Deleted At', dataIndex: 'deletedAt', key: 'deletedAt', render: (v) => v ? formatDate(v) : '-' },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<ReloadOutlined />} type="primary" onClick={() => handleRestore(record._id)}>Restore</Button>
          <Popconfirm title="Permanently delete?" onConfirm={() => handlePermanentDelete(record._id)}>
            <Button icon={<DeleteOutlined />} danger>Delete Forever</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Row justify="space-between" align="middle" className="mb-3">
        <Col><Title level={3}>Product Recycle Bin</Title></Col>
      </Row>
      <Card>
        <Table dataSource={products} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 'max-content' }} />
      </Card>

      <Modal
        title="Edit & Restore Product"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditingProduct(null); setImagePreview(null); setImageFile(null); form.resetFields() }}
        confirmLoading={uploading}
        width={Math.min(600, window.innerWidth - 48)}
        style={{ maxWidth: 'calc(100vw - 48px)' }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Item label="Name" name="name" rules={[{ required: true }]}><Input /></Item>
            </Col>
            <Col xs={24} sm={12}>
              <Item label="Category" name="category"><Input /></Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Item label="Sale Price" name="price" rules={[{ required: true }]}><InputNumber min={0} step={0.01} precision={3} prefix="Rs" style={{ width: '100%' }} /></Item>
            </Col>
            <Col xs={24} sm={8}>
              <Item label="Cost Price" name="costPrice"><InputNumber min={0} step={0.01} precision={3} prefix="Rs" style={{ width: '100%' }} /></Item>
            </Col>
            <Col xs={24} sm={8}>
              <Item label="Stock" name="stock"><InputNumber min={0} step={0.01} precision={3} style={{ width: '100%' }} /></Item>
            </Col>
          </Row>
          <Item label="Description" name="description"><Input.TextArea rows={3} /></Item>
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
            {imagePreview && <div style={{ marginTop: 8 }}><Image width={120} src={imagePreview} /></div>}
          </Item>
        </Form>
      </Modal>
    </>
  )
}

export default ProductRecycleBin
