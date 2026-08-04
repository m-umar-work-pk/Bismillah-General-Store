import { useState, useEffect, useMemo } from 'react'
import { api } from '@/config/api'
import { Button, Card, Col, Modal, Row, Statistic, Table, Typography, DatePicker, Space, Tag } from 'antd'
import { DollarOutlined, EyeOutlined, RiseOutlined, ArrowUpOutlined, ClockCircleOutlined, FilterOutlined } from '@ant-design/icons'
import { formatDate, formatCurrency } from '@/utils/format'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const statusColors = {
  pending: 'orange', confirmed: 'blue', shipped: 'purple',
  delivered: 'green', cancelled: 'red',
}

const Sales = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(null)
  const [billModal, setBillModal] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.get('/orders?all=true')
        setOrders(Array.isArray(data) ? data : [])
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const filtered = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return orders
    const start = new Date(dateRange[0]).getTime()
    const end = new Date(dateRange[1]).setHours(23, 59, 59, 999)
    return orders.filter(o => {
      const t = new Date(o.createdAt).getTime()
      return t >= start && t <= end
    })
  }, [orders, dateRange])

  const totalRevenue = filtered.reduce((sum, o) => sum + (o.status === 'cancelled' ? 0 : (o.total || 0)), 0)
  const totalProfit = filtered.reduce((sum, o) => {
    if (o.status === 'cancelled') return sum
    const items = o.items || []
    return sum + items.reduce((s, item) => {
      if (item.costPrice == null) return s
      return s + (item.price - item.costPrice) * item.quantity
    }, 0)
  }, 0)
  const cancelledOrders = filtered.filter(o => o.status === 'cancelled').length
  const activeOrders = filtered.filter(o => o.status !== 'cancelled').length
  const avgOrderValue = activeOrders > 0 ? totalRevenue / activeOrders : 0
  const totalItemsSold = filtered.reduce((sum, o) => {
    if (o.status === 'cancelled') return sum
    return sum + (o.items || []).reduce((s, item) => s + item.quantity, 0)
  }, 0)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime()

  const dailyRevenue = orders
    .filter(o => o.status !== 'cancelled' && new Date(o.createdAt).getTime() >= todayStart)
    .reduce((sum, o) => sum + (o.total || 0), 0)

  const recentRevenue = orders
    .filter(o => o.status !== 'cancelled' && new Date(o.createdAt).getTime() >= weekAgo)
    .reduce((sum, o) => sum + (o.total || 0), 0)

  const columns = [
    { title: 'Order ID', dataIndex: '_id', key: '_id', render: (id) => `#${id.slice(-8)}` },
    {
      title: 'Customer', key: 'customer',
      render: (_, r) => r.shipping?.fullName || r.userEmail || 'N/A',
    },
    { title: 'Items', dataIndex: 'items', key: 'items', render: (items) => items?.length || 0 },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: 'Revenue', dataIndex: 'total', key: 'total',
      render: (v) => <span style={{ color: '#2a9d8f', fontWeight: 600 }}>Rs {formatCurrency(v)}</span>,
    },
    {
      title: 'Profit', key: 'profit',
      render: (_, r) => {
        const profit = r.items?.reduce((s, item) => {
          if (item.costPrice == null) return s
          return s + (item.price - item.costPrice) * item.quantity
        }, 0) || 0
        return <span style={{ color: profit >= 0 ? '#2a9d8f' : '#e76f51', fontWeight: 600 }}>Rs {formatCurrency(profit)}</span>
      },
    },
    {
      title: 'Date', dataIndex: 'createdAt', key: 'createdAt',
      render: (v) => formatDate(v),
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Button icon={<EyeOutlined />} size="small" onClick={() => setBillModal(record)}>Bill</Button>
      ),
    },
  ]

  const monthlyData = useMemo(() => {
    return filtered.reduce((acc, o) => {
      if (!o.createdAt) return acc
      const d = new Date(o.createdAt)
      const month = d.toLocaleString('default', { month: 'short' }) + '-' + d.getFullYear()
      acc[month] = (acc[month] || 0) + (o.total || 0)
      return acc
    }, {})
  }, [filtered])

  const clearFilter = () => setDateRange(null)

  return (
    <>
      <Title level={3}>Sales Records</Title>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} sm={6}>
          <Card><Statistic title="Total Revenue" value={`Rs ${formatCurrency(totalRevenue)}`} prefix={<DollarOutlined />} valueStyle={{ color: '#2a9d8f' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="Total Profit" value={`Rs ${formatCurrency(totalProfit)}`} prefix={<RiseOutlined />} valueStyle={{ color: '#1d3557' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="Daily Revenue" value={`Rs ${formatCurrency(dailyRevenue)}`} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#2a9d8f' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="Recent Revenue (7d)" value={`Rs ${formatCurrency(recentRevenue)}`} prefix={<ArrowUpOutlined />} valueStyle={{ color: '#e76f51' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="Total Orders" value={filtered.length} prefix={<RiseOutlined />} valueStyle={{ color: '#1d3557' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="Active Orders" value={activeOrders} valueStyle={{ color: '#2a9d8f' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="Cancelled" value={cancelledOrders} valueStyle={{ color: '#e76f51' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="Items Sold" value={totalItemsSold} valueStyle={{ color: '#1d3557' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="Avg Order Value" value={`Rs ${formatCurrency(avgOrderValue)}`} prefix={<ArrowUpOutlined />} valueStyle={{ color: '#e76f51' }} /></Card>
        </Col>
      </Row>

      <Card title="Monthly Revenue" className="mb-4">
        <Row gutter={[12, 12]}>
          {Object.entries(monthlyData).map(([month, revenue]) => (
            <Col xs={12} sm={8} md={4} key={month}>
              <div className="p-3 border rounded-3 text-center">
                <Text type="secondary">{month}</Text>
                <div style={{ fontWeight: 600, color: '#2a9d8f' }}>Rs {formatCurrency(revenue)}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title={dateRange ? `Sales History (Filtered: ${filtered.length} orders)` : 'Sales History'}
        extra={
          <Space>
            <RangePicker onChange={(dates) => setDateRange(dates)} />
            {dateRange && <Button icon={<FilterOutlined />} onClick={clearFilter}>Clear Filter</Button>}
          </Space>
        }
      >
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={`Bill - ${billModal ? `#${billModal._id?.slice(-8).toUpperCase()}` : ''}`}
        open={!!billModal}
        onCancel={() => setBillModal(null)}
        footer={null}
        width={Math.min(600, window.innerWidth - 48)}
        style={{ maxWidth: 'calc(100vw - 48px)' }}
      >
        {billModal && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#1d3557' }}>Bismillah General Store</h2>
              <p style={{ color: '#666' }}>Invoice / Bill</p>
            </div>
            <div><strong>Bill No:</strong> BILL-{billModal._id?.slice(-8).toUpperCase()}</div>
            <div><strong>Date:</strong> {formatDate(billModal.createdAt)}</div>
            <div><strong>Customer:</strong> {billModal.shipping?.fullName || billModal.userEmail || 'N/A'}</div>
            <div><strong>Status:</strong> <Tag color={statusColors[billModal.status]}>{billModal.status}</Tag></div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
                <thead>
                  <tr style={{ background: '#1d3557', color: '#fff' }}>
                    <th style={{ padding: 8, textAlign: 'left' }}>Item</th>
                    <th style={{ padding: 8, textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Price</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billModal.items?.map((item, i) => (
                    <tr key={i}>
                      <td style={{ padding: 8 }}>{item.name}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{item.quantity} {item.unit || 'pcs'}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>Rs {formatCurrency(item.price)}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>Rs {formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'right', marginTop: 16, fontSize: '1.2rem', fontWeight: 'bold', color: '#2a9d8f' }}>
              Total: Rs {formatCurrency(billModal.total)}
            </div>
          </>
        )}
      </Modal>
    </>
  )
}

export default Sales