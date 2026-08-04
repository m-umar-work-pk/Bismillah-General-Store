import { useState, useEffect, useRef } from 'react'
import { api } from '@/config/api'
import { useAuth } from '@/context/Auth'
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography, Avatar } from 'antd'
import { UserOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined, EyeOutlined, EyeInvisibleOutlined, CameraOutlined } from '@ant-design/icons'
import { formatDate } from '@/utils/format'

const { Title, Text } = Typography
const { Item } = Form
const { Option } = Select
const { Password } = Input

const Users = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showPassword, setShowPassword] = useState({})
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [form] = Form.useForm()
  const fileInputRef = useRef(null)

  const fetchUsers = async () => {
    try {
      const data = await api.get('/users')
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      window.toastify('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const openEdit = (record) => {
    setEditingUser(record)
    form.setFieldsValue({
      fullName: record.fullName || '',
      email: record.email || '',
      role: record.role || 'customer',
      status: record.status || 'active',
      phone: record.phone || '',
    })
    setAvatarFile(null)
    setAvatarPreview(record.avatar || null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const formData = new FormData()
      formData.append('fullName', values.fullName)
      formData.append('email', values.email)
      formData.append('role', values.role)
      formData.append('status', values.status)
      if (values.phone) formData.append('phone', values.phone)
      if (values.password) formData.append('password', values.password)
      if (avatarFile) formData.append('avatar', avatarFile)

      await api.put(`/users/${editingUser._id}`, formData, true)
      window.toastify('User updated', 'success')
      setModalOpen(false)
      fetchUsers()
    } catch (err) {
      window.toastify(err?.message || 'Failed to update user', 'error')
    }
  }

  const handleDelete = async (userId) => {
    if (userId === user.uid) {
      window.toastify('Cannot delete yourself', 'error')
      return
    }
    try {
      await api.delete(`/users/${userId}`)
      setUsers(prev => prev.filter(u => u._id !== userId))
      window.toastify('User deleted', 'success')
    } catch {
      window.toastify('Failed to delete user', 'error')
    }
  }

  const handleBlockToggle = async (userId, currentStatus) => {
    if (userId === user.uid) {
      window.toastify('Cannot change your own status', 'error')
      return
    }
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active'
    try {
      await api.put(`/users/${userId}/block`)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: newStatus } : u))
      window.toastify(`User ${newStatus === 'active' ? 'unblocked' : 'blocked'}`, 'success')
    } catch {
      window.toastify('Failed to update status', 'error')
    }
  }

  const columns = [
    {
      title: 'Avatar',
      key: 'avatar',
      render: (_, record) => (
        record.avatar ? (
          <Avatar src={record.avatar} size={40} />
        ) : (
          <Avatar size={40} style={{ backgroundColor: '#1d3557' }}>
            {(record.fullName || 'U').charAt(0).toUpperCase()}
          </Avatar>
        )
      ),
    },
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name, record) => (
        <Text style={{ fontWeight: 500 }}>{name || '—'}</Text>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '—',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>{role}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Active' : 'Blocked'}
        </Tag>
      ),
    },
    {
      title: 'Password',
      key: 'password',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={showPassword[record._id] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setShowPassword(prev => ({ ...prev, [record._id]: !prev[record._id] }))}
          >
            {showPassword[record._id] ? '(hidden)' : '••••••'}
          </Button>
        </Space>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (ts) => formatDate(ts),
    },
{
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Block/Unblock this user?"
            description={record.status === 'active' ? 'User will be blocked and cannot login' : 'User will be unblocked'}
            onConfirm={() => handleBlockToggle(record._id, record.status || 'active')}
            okText={record.status === 'active' ? 'Block' : 'Unblock'}
            cancelText="Cancel"
            okButtonProps={{ danger: record.status === 'active' }}
            disabled={record.role === 'admin'}
          >
            <Button
              icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
              danger={record.status === 'active'}
              disabled={record.role === 'admin'}
            >
              {record.status === 'active' ? 'Block' : 'Unblock'}
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete this user?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            disabled={record.role === 'admin'}
          >
            <Button danger icon={<DeleteOutlined />} disabled={record.role === 'admin'}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Title level={3}><UserOutlined /> Users Management</Title>
      <Table
        dataSource={users}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title="Edit User"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); form.resetFields(); setAvatarFile(null); setAvatarPreview(null) }}
        width={500}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <div className="text-center mb-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 80, height: 80, borderRadius: '50%', border: '2px dashed #d9d9d9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', margin: '0 auto',
                background: avatarPreview ? 'transparent' : '#fafafa',
              }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <CameraOutlined style={{ fontSize: 24, color: '#999' }} />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setAvatarFile(file)
                  setAvatarPreview(URL.createObjectURL(file))
                }
              }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Click to change photo</Text>
          </div>
          <Item label="Full Name" name="fullName" rules={[{ required: true }]}>
            <Input />
          </Item>
          <Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Item>
          <Item label="Phone" name="phone">
            <Input placeholder="Optional" />
          </Item>
          <Item label="Role" name="role" rules={[{ required: true }]}>
            <Select options={[
              { value: 'customer', label: 'Customer' },
              { value: 'admin', label: 'Admin' },
            ]} />
          </Item>
          <Item label="Status" name="status" rules={[{ required: true }]}>
            <Select options={[
              { value: 'active', label: 'Active' },
              { value: 'blocked', label: 'Blocked' },
            ]} />
          </Item>
          <Item label="New Password" name="password" rules={[{ min: 6, message: 'Min 6 characters' }]}>
            <Password placeholder="Leave blank to keep current" />
          </Item>
        </Form>
      </Modal>
    </>
  )
}

export default Users