import { useState, useEffect, useRef } from 'react'
import { api } from '@/config/api'
import { useAuth } from '@/context/Auth'
import { Button, Card, Col, Form, Image, Input, Modal, Popconfirm, Row, Table, Typography } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons'
import { formatDate } from '@/utils/format'

const { Title } = Typography
const { Item } = Form

const Categories = () => {
  const { userRole } = useAuth()
  const isAdmin = userRole === 'admin'
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form] = Form.useForm()
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const previewUrlRef = useRef(null)

  const fetchCategories = async () => {
    try {
      const data = await api.get('/categories')
      const all = Array.isArray(data) ? data : []
      setCategories(all.filter(c => !c.isDeleted))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  const openCreate = () => {
    setEditingCategory(null)
    form.resetFields()
    setImageFile(null)
    setImagePreview(null)
    setModalOpen(true)
  }

  const openEdit = (category) => {
    setEditingCategory(category)
    form.setFieldsValue({
      name: category.name,
      slug: category.slug,
      icon: category.icon,
    })
    setImageFile(null)
    setImagePreview(category.image || null)
    setModalOpen(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImageFile(file)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setImagePreview(url)
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`)
      window.toastify('Category moved to Recycle Bin', 'success')
      fetchCategories()
    } catch (err) {
      window.toastify(err.message || 'Failed to delete', 'error')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setUploading(true)

      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('slug', values.slug || values.name.toLowerCase().replace(/\s+/g, '-'))
      formData.append('icon', values.icon || '📦')
      if (imageFile) {
        formData.append('image', imageFile)
      }

      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, formData, true)
        window.toastify('Category updated', 'success')
      } else {
        await api.post('/categories', formData, true)
        window.toastify('Category created', 'success')
      }

      setModalOpen(false)
      form.resetFields()
      setImageFile(null)
      setImagePreview(null)
      fetchCategories()
    } catch (err) {
      window.toastify(err?.message || 'Failed to save category', 'error')
    } finally {
      setUploading(false)
    }
  }

  const columns = [
    { title: 'Image', dataIndex: 'image', key: 'image', render: (img) => <Image width={60} src={img || 'https://placehold.co/60'} /> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug' },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (v) => formatDate(v) },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
      ),
    },
    {
      title: '', key: 'delete',
      render: (_, record) => (
        isAdmin ? (
          <Popconfirm title="Delete this category?" onConfirm={() => handleDelete(record._id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        ) : null
      ),
    },
  ]

  return (
    <>
      <Row justify="space-between" align="middle" className="mb-3">
        <Col><Title level={3}>Categories</Title></Col>
        <Col>{isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Category</Button>}</Col>
      </Row>
      <Card>
        <Table dataSource={categories} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 'max-content' }} />
      </Card>

      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setImagePreview(null); setImageFile(null); form.resetFields() }}
        confirmLoading={uploading}
        width={Math.min(500, window.innerWidth - 48)}
        style={{ maxWidth: 'calc(100vw - 48px)' }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Item label="Category Name" name="name" rules={[{ required: true, message: 'Please enter a category name' }]}>
                <Input placeholder="e.g. Groceries" />
              </Item>
            </Col>
            <Col xs={24} sm={12}>
              <Item label="Slug (URL)" name="slug">
                <Input placeholder="auto-generated from name" />
              </Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Item label="Icon (Emoji)" name="icon">
                <Input placeholder="🛒" maxLength={2} />
              </Item>
            </Col>
            <Col xs={24} sm={12}>
              <Item label="Image">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>
              </Item>
            </Col>
          </Row>
          {imagePreview && (
            <div style={{ marginTop: 8 }}>
              <Image width={120} src={imagePreview} />
            </div>
          )}
        </Form>
      </Modal>
    </>
  )
}

export default Categories
