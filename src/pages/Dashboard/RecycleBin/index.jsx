import { useState, useEffect, useRef } from 'react'
import { api } from '@/config/api'
import { Button, Card, Col, Form, Image, Modal, Popconfirm, Row, Table, Tag, Typography, Space, Tabs, Badge, Empty, Upload, Input, InputNumber, Select } from 'antd'
import { DeleteOutlined, ReloadOutlined, ShoppingCartOutlined, UserOutlined, AppstoreOutlined, ClearOutlined, CheckSquareOutlined } from '@ant-design/icons'
import { formatCurrency, formatDate } from '@/utils/format'

const { Title } = Typography
const { Item } = Form

const RecycleBin = () => {
  const [activeTab, setActiveTab] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState({ products: true, categories: true, orders: true, users: true })
  const [bulkLoading, setBulkLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const previewUrlRef = useRef(null)

  const fetchAll = async () => {
    setLoading(prev => ({ ...prev, products: true, categories: true, orders: true, users: true }))
    try {
      const [prodData, catData, orderData, userData] = await Promise.all([
        api.get('/products?all=true'),
        api.get('/categories?all=true'),
        api.get('/orders?all=true'),
        api.get('/users?all=true'),
      ])
      const allProd = Array.isArray(prodData) ? prodData : []
      const allCat = Array.isArray(catData) ? catData : []
      const allOrd = Array.isArray(orderData) ? orderData : []
      const allUsr = Array.isArray(userData) ? userData : []

      setProducts(allProd.filter(i => i.isDeleted === true).map(d => ({ ...d, type: 'product' })))
      setCategories(allCat.filter(i => i.isDeleted === true).map(d => ({ ...d, type: 'category' })))
      setOrders(allOrd.filter(i => i.isDeleted === true).map(d => ({ ...d, type: 'order' })))
      setUsers(allUsr.filter(i => i.isDeleted === true).map(d => ({ ...d, type: 'user' })))

      setActiveTab(prev => {
        if (prev) return prev
        if (allProd.filter(i => i.isDeleted).length > 0) return 'products'
        if (allCat.filter(i => i.isDeleted).length > 0) return 'categories'
        if (allOrd.filter(i => i.isDeleted).length > 0) return 'orders'
        if (allUsr.filter(i => i.isDeleted).length > 0) return 'users'
        return 'products'
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading({ products: false, categories: false, orders: false, users: false })
    }
  }

  useEffect(() => { fetchAll() }, [])

  const typeRoutes = { product: 'products', category: 'categories', order: 'orders', user: 'users' }

  const handleRestore = async (type, id) => {
    try {
      const route = typeRoutes[type] || `${type}s`
      await api.put(`/${route}/${id}/restore`)
      window.toastify(`${type} restored`, 'success')
      fetchAll()
    } catch (err) {
      window.toastify(err?.message || 'Failed to restore', 'error')
    }
  }

  const handleForceDelete = async (type, id) => {
    try {
      const route = typeRoutes[type] || `${type}s`
      await api.delete(`/${route}/${id}/permanent`)
      window.toastify(`${type} permanently deleted`, 'success')
      fetchAll()
    } catch (err) {
      window.toastify(err?.message || 'Failed to delete', 'error')
    }
  }

  const handleRestoreAll = async (type) => {
    try {
      const route = typeRoutes[type] || `${type}s`
      await api.put(`/${route}/bulk/restore`)
      window.toastify(`All ${type}s restored`, 'success')
      fetchAll()
    } catch (err) {
      window.toastify(err?.message || 'Failed to restore', 'error')
    }
  }

  const handleDeleteAll = async (type) => {
    try {
      const route = typeRoutes[type] || `${type}s`
      await api.delete(`/${route}/bulk/permanent`)
      window.toastify(`All ${type}s permanently deleted`, 'success')
      fetchAll()
    } catch (err) {
      window.toastify(err?.message || 'Failed to delete', 'error')
    }
  }

  const handleEmptyAll = async () => {
    setBulkLoading(true)
    try {
      await Promise.all([
        products.length > 0 && api.delete('/products/bulk/permanent'),
        categories.length > 0 && api.delete('/categories/bulk/permanent'),
        orders.length > 0 && api.delete('/orders/bulk/permanent'),
        users.length > 0 && api.delete('/users/bulk/permanent'),
      ].filter(Boolean))
      window.toastify('Recycle Bin emptied', 'success')
      fetchAll()
    } catch (err) {
      window.toastify(err?.message || 'Failed to empty recycle bin', 'error')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleRestoreSelected = async () => {
    if (selectedRowKeys.length === 0) return
    try {
      const route = typeRoutes[activeTab] || `${activeTab}s`
      await Promise.all(selectedRowKeys.map(id => api.put(`/${route}/${id}/restore`)))
      window.toastify(`${selectedRowKeys.length} items restored`, 'success')
      setSelectedRowKeys([])
      fetchAll()
    } catch (err) {
      window.toastify(err?.message || 'Failed to restore', 'error')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) return
    try {
      const route = typeRoutes[activeTab] || `${activeTab}s`
      await Promise.all(selectedRowKeys.map(id => api.delete(`/${route}/${id}/permanent`)))
      window.toastify(`${selectedRowKeys.length} items permanently deleted`, 'success')
      setSelectedRowKeys([])
      fetchAll()
    } catch (err) {
      window.toastify(err?.message || 'Failed to delete', 'error')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    form.setFieldsValue(item)
    setImagePreview(item.images?.[0] || item.image || null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!editingItem) return
    try {
      const values = await form.validateFields()
      setUploading(true)
      const route = typeRoutes[editingItem.type] || `${editingItem.type}s`

      if (imageFile) {
        const formData = new FormData()
        if (editingItem.type === 'product') {
          formData.append('name', values.name)
          formData.append('category', values.category || '')
          formData.append('price', values.price || 0)
          formData.append('costPrice', values.costPrice || 0)
          formData.append('stock', values.stock || 0)
          formData.append('unit', values.unit || 'pcs')
          formData.append('image', imageFile)
        } else if (editingItem.type === 'category') {
          formData.append('name', values.name)
          formData.append('slug', values.slug || '')
          formData.append('icon', values.icon || '')
          formData.append('image', imageFile)
        } else {
          formData.append('name', values.name || values.fullName || '')
          formData.append('image', imageFile)
        }
        await api.put(`/${route}/${editingItem._id}`, formData, true)
      } else {
        const update = {}
        if (editingItem.type === 'product') {
          update.name = values.name
          update.category = values.category
          update.price = values.price
          update.costPrice = values.costPrice
          update.stock = values.stock
          update.unit = values.unit
        } else if (editingItem.type === 'category') {
          update.name = values.name
          update.slug = values.slug
          update.icon = values.icon
        } else if (editingItem.type === 'order') {
          update.status = values.status
        } else {
          update.fullName = values.fullName
          update.email = values.email
        }
        await api.put(`/${route}/${editingItem._id}`, update)
      }

      await api.put(`/${route}/${editingItem._id}/restore`)
      window.toastify(`${editingItem.type} restored and updated`, 'success')
      setModalOpen(false)
      setEditingItem(null)
      setImageFile(null)
      setImagePreview(null)
      form.resetFields()
      fetchAll()
    } catch (err) {
      window.toastify(err?.message || 'Failed to save', 'error')
    } finally {
      setUploading(false)
    }
  }

  const onImageChange = (info) => {
    if (info.file.status === 'uploading') return
    const file = info.file.originFileObj
    setImageFile(file)
    if (file) {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      const url = URL.createObjectURL(file)
      previewUrlRef.current = url
      setImagePreview(url)
    }
  }

  const totalDeleted = products.length + categories.length + orders.length + users.length

  const renderTable = (type, data, isLoading) => {
    const columns = getColumns(type)
    if (data.length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No deleted ${type}s`} />
    }
    return (
      <Table
        dataSource={data}
        columns={columns}
        rowKey="_id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `${total} items` }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />
    )
  }

  const getColumns = (type) => {
    const typeLabels = { product: 'Product', category: 'Category', order: 'Order', user: 'User' }
    const baseColumns = [
      { title: 'Atom Type', key: 'atomType', render: () => <Tag color="blue">{typeLabels[type] || type}</Tag> },
      {
        title: 'Deleted By', key: 'deletedBy',
        render: (_, record) => {
          const by = record.deletedBy
          if (!by) return <span style={{ color: '#999' }}>System</span>
          return <span style={{ fontWeight: 500 }}>{by}</span>
        },
      },
      { title: 'Deleted At', dataIndex: 'deletedAt', key: 'deletedAt', render: (v) => v ? formatDate(v) : '-' },
      {
        title: 'Actions', key: 'actions',
        render: (_, record) => (
          <Space>
            <Button icon={<ReloadOutlined />} type="primary" size="small" onClick={() => handleRestore(type, record._id)}>Restore</Button>
            <Popconfirm title="Permanently delete this item?" onConfirm={() => handleForceDelete(type, record._id)}>
              <Button icon={<DeleteOutlined />} danger size="small">Delete</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ]

    if (type === 'product') {
      return [
        { title: 'Image', dataIndex: 'images', render: (imgs) => <Image width={50} src={imgs?.[0] || 'https://placehold.co/50'} /> },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Category', dataIndex: 'category', key: 'category', render: (v) => <Tag>{v}</Tag> },
        { title: 'Price', dataIndex: 'price', key: 'price', render: (v, r) => `Rs ${formatCurrency(v)} / ${r.unit || 'pcs'}` },
        { title: 'Stock', dataIndex: 'stock', key: 'stock', render: (v) => v ?? '-' },
        { title: 'Position', dataIndex: 'position', key: 'position', render: (v) => v ?? 0 },
        ...baseColumns,
      ]
    }
    if (type === 'category') {
      return [
        { title: 'Image', dataIndex: 'image', render: (img) => <Image width={50} src={img || 'https://placehold.co/50'} /> },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Slug', dataIndex: 'slug', key: 'slug' },
        ...baseColumns,
      ]
    }
    if (type === 'order') {
      return [
        { title: 'Customer', key: 'customer', render: (_, r) => r.shipping?.fullName || r.userEmail || 'N/A' },
        { title: 'Items', dataIndex: 'items', key: 'items', render: (items) => items?.length || 0 },
        { title: 'Total', dataIndex: 'total', key: 'total', render: (v) => `Rs ${formatCurrency(v)}` },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'delivered' ? 'green' : s === 'cancelled' ? 'red' : 'orange'}>{s}</Tag> },
        ...baseColumns,
      ]
    }
    if (type === 'user') {
      return [
        { title: 'Name', dataIndex: 'fullName', key: 'fullName', render: (name) => name || '—' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Role', dataIndex: 'role', key: 'role', render: (role) => <Tag color={role === 'admin' ? 'red' : 'blue'}>{role}</Tag> },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'active' ? 'green' : 'red'}>{status || 'active'}</Tag> },
        ...baseColumns,
      ]
    }
    return baseColumns
  }

  const getTabLabel = (icon, label, count) => (
    <span>{icon} {label} {count > 0 && <Badge count={count} style={{ marginLeft: 6 }} />}</span>
  )

  const tabCounts = {
    products: products.length,
    categories: categories.length,
    orders: orders.length,
    users: users.length,
  }

  const getEditModalFields = () => {
    if (!editingItem) return null
    if (editingItem.type === 'product') {
      return (
        <>
          <Item label="Name" name="name" rules={[{ required: true }]}><Input /></Item>
          <Item label="Category" name="category"><Input /></Item>
          <Row gutter={16}>
            <Col span={12}><Item label="Price" name="price"><InputNumber min={0} step={0.01} precision={3} prefix="Rs" style={{ width: '100%' }} /></Item></Col>
            <Col span={12}><Item label="Cost Price" name="costPrice"><InputNumber min={0} step={0.01} precision={3} prefix="Rs" style={{ width: '100%' }} /></Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Item label="Stock" name="stock"><InputNumber min={0} step={0.01} precision={3} style={{ width: '100%' }} /></Item></Col>
            <Col span={12}><Item label="Unit" name="unit"><Select options={[{ value: 'pcs', label: 'pcs' }, { value: 'KG', label: 'KG' }, { value: 'L', label: 'L' }]} /></Item></Col>
          </Row>
        </>
      )
    }
    if (editingItem.type === 'category') {
      return (
        <>
          <Item label="Name" name="name" rules={[{ required: true }]}><Input /></Item>
          <Item label="Slug" name="slug" rules={[{ required: true }]}><Input /></Item>
          <Item label="Icon" name="icon"><Input placeholder="Emoji icon" /></Item>
        </>
      )
    }
    if (editingItem.type === 'order') {
      return (
        <Item label="Status" name="status">
          <Select options={[
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'shipped', label: 'Shipped' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'cancelled', label: 'Cancelled' },
          ]} />
        </Item>
      )
    }
    if (editingItem.type === 'user') {
      return (
        <>
          <Item label="Full Name" name="fullName" rules={[{ required: true }]}><Input /></Item>
          <Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}><Input /></Item>
        </>
      )
    }
    return null
  }

  const getModalTitle = () => {
    if (!editingItem) return 'Edit & Restore'
    const type = editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)
    return `Edit & Restore ${type}`
  }

  return (
    <>
      <Row justify="space-between" align="middle" className="mb-3">
        <Col><Title level={3}>Recycle Bin</Title></Col>
        <Col>
          <Space wrap>
            <Badge count={totalDeleted} color="red">
              <span style={{ marginRight: 12 }}>Total Deleted Items</span>
            </Badge>
            {totalDeleted > 0 && (
              <Popconfirm
                title="Permanently delete ALL items from recycle bin?"
                description="This cannot be undone. All images will be removed from Cloudinary."
                onConfirm={handleEmptyAll}
                okText="Empty All"
                okType="danger"
              >
                <Button icon={<ClearOutlined />} danger loading={bulkLoading}>Empty Recycle Bin</Button>
              </Popconfirm>
            )}
          </Space>
        </Col>
      </Row>
      <Card>
        {activeTab && (
          <Tabs
            activeKey={activeTab}
            onChange={(key) => { setActiveTab(key); setSelectedRowKeys([]) }}
            size="large"
            style={{ marginBottom: 0 }}
            items={[
              {
                key: 'products',
                label: getTabLabel(<ShoppingCartOutlined />, 'Products', tabCounts.products),
                children: (
                  <>
                    {products.length > 0 && (
                      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Popconfirm title={`Restore all ${products.length} products?`} onConfirm={() => handleRestoreAll('product')}>
                          <Button icon={<ReloadOutlined />}>Restore All</Button>
                        </Popconfirm>
                        <Popconfirm title={`Permanently delete all ${products.length} products?`} onConfirm={() => handleDeleteAll('product')}>
                          <Button icon={<DeleteOutlined />} danger>Delete All</Button>
                        </Popconfirm>
                        {selectedRowKeys.length > 0 && (
                          <>
                            <span style={{ color: '#1890ff', fontWeight: 500, marginLeft: 8 }}>{selectedRowKeys.length} selected</span>
                            <Button icon={<CheckSquareOutlined />} type="primary" onClick={handleRestoreSelected}>Restore Selected</Button>
                            <Button icon={<DeleteOutlined />} danger onClick={handleDeleteSelected}>Delete Selected</Button>
                          </>
                        )}
                      </div>
                    )}
                    {renderTable('product', products, loading.products)}
                  </>
                ),
              },
              {
                key: 'categories',
                label: getTabLabel(<AppstoreOutlined />, 'Categories', tabCounts.categories),
                children: (
                  <>
                    {categories.length > 0 && (
                      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Popconfirm title={`Restore all ${categories.length} categories?`} onConfirm={() => handleRestoreAll('category')}>
                          <Button icon={<ReloadOutlined />}>Restore All</Button>
                        </Popconfirm>
                        <Popconfirm title={`Permanently delete all ${categories.length} categories?`} onConfirm={() => handleDeleteAll('category')}>
                          <Button icon={<DeleteOutlined />} danger>Delete All</Button>
                        </Popconfirm>
                        {selectedRowKeys.length > 0 && (
                          <>
                            <span style={{ color: '#1890ff', fontWeight: 500, marginLeft: 8 }}>{selectedRowKeys.length} selected</span>
                            <Button icon={<CheckSquareOutlined />} type="primary" onClick={handleRestoreSelected}>Restore Selected</Button>
                            <Button icon={<DeleteOutlined />} danger onClick={handleDeleteSelected}>Delete Selected</Button>
                          </>
                        )}
                      </div>
                    )}
                    {renderTable('category', categories, loading.categories)}
                  </>
                ),
              },
              {
                key: 'orders',
                label: getTabLabel(<ShoppingCartOutlined />, 'Orders', tabCounts.orders),
                children: (
                  <>
                    {orders.length > 0 && (
                      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Popconfirm title={`Restore all ${orders.length} orders?`} onConfirm={() => handleRestoreAll('order')}>
                          <Button icon={<ReloadOutlined />}>Restore All</Button>
                        </Popconfirm>
                        <Popconfirm title={`Permanently delete all ${orders.length} orders?`} onConfirm={() => handleDeleteAll('order')}>
                          <Button icon={<DeleteOutlined />} danger>Delete All</Button>
                        </Popconfirm>
                        {selectedRowKeys.length > 0 && (
                          <>
                            <span style={{ color: '#1890ff', fontWeight: 500, marginLeft: 8 }}>{selectedRowKeys.length} selected</span>
                            <Button icon={<CheckSquareOutlined />} type="primary" onClick={handleRestoreSelected}>Restore Selected</Button>
                            <Button icon={<DeleteOutlined />} danger onClick={handleDeleteSelected}>Delete Selected</Button>
                          </>
                        )}
                      </div>
                    )}
                    {renderTable('order', orders, loading.orders)}
                  </>
                ),
              },
              {
                key: 'users',
                label: getTabLabel(<UserOutlined />, 'Users', tabCounts.users),
                children: (
                  <>
                    {users.length > 0 && (
                      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Popconfirm title={`Restore all ${users.length} users?`} onConfirm={() => handleRestoreAll('user')}>
                          <Button icon={<ReloadOutlined />}>Restore All</Button>
                        </Popconfirm>
                        <Popconfirm title={`Permanently delete all ${users.length} users?`} onConfirm={() => handleDeleteAll('user')}>
                          <Button icon={<DeleteOutlined />} danger>Delete All</Button>
                        </Popconfirm>
                        {selectedRowKeys.length > 0 && (
                          <>
                            <span style={{ color: '#1890ff', fontWeight: 500, marginLeft: 8 }}>{selectedRowKeys.length} selected</span>
                            <Button icon={<CheckSquareOutlined />} type="primary" onClick={handleRestoreSelected}>Restore Selected</Button>
                            <Button icon={<DeleteOutlined />} danger onClick={handleDeleteSelected}>Delete Selected</Button>
                          </>
                        )}
                      </div>
                    )}
                    {renderTable('user', users, loading.users)}
                  </>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        title={getModalTitle()}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditingItem(null); setImagePreview(null); setImageFile(null); form.resetFields() }}
        confirmLoading={uploading}
        width={Math.min(700, window.innerWidth - 48)}
        style={{ maxWidth: 'calc(100vw - 48px)' }}
      >
        <Form form={form} layout="vertical">
          {getEditModalFields()}
          <Item label="Image">
            <Upload
              accept="image/*"
              showUploadList={false}
              listType="picture"
              onChange={onImageChange}
            >
              <Button>{imagePreview ? 'Change Image' : 'Upload Image'}</Button>
            </Upload>
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

export default RecycleBin
