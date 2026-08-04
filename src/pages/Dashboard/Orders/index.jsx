import { useState, useEffect, useRef } from 'react'
import { api } from '@/config/api'
import { Button, Card, Modal, Popconfirm, Select, Table, Tag, Typography, Space } from 'antd'
import { DeleteOutlined, PrinterOutlined } from '@ant-design/icons'
import { formatDate, formatDateTime, formatCurrency } from '@/utils/format'

const { Title, Text } = Typography

const statusColors = {
  pending: 'orange',
  confirmed: 'blue',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'red'
}

const calcItemProfit = (item) => {
  if (item.costPrice != null) return (item.price - item.costPrice) * item.quantity
  return null
}

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailModal, setDetailModal] = useState(null)
  const printRef = useRef()

  const generateBillNumber = (id) => `BILL-${id.slice(-8).toUpperCase()}`

  const calcOrderProfit = (items) => {
    return items?.reduce((sum, item) => {
      const p = calcItemProfit(item)
      return sum + (p || 0)
    }, 0) || 0
  }

  const fetchOrders = async () => {
    try {
      const data = await api.get('/orders?all=true')
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  const handleStatusChange = async (orderId, newStatus) => {
    await api.put(`/orders/${orderId}`, { status: newStatus })
    window.toastify('Order status updated', 'success')
    fetchOrders()
  }

  const handleDeleteOrder = async (orderId) => {
    try {
      await api.delete(`/orders/${orderId}`)
      setOrders(prev => prev.filter(o => o._id !== orderId))
      window.toastify?.('Order moved to Recycle Bin. Stock restored.', 'success')
    } catch {
      window.toastify?.('Failed to delete order', 'error')
    }
  }

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank')
    const doc = win.document
    doc.write('<!DOCTYPE html>')
    doc.write('<html><head><title>' + generateBillNumber(detailModal._id) + '</title>')
    doc.write('<style>')
    doc.write('body{font-family:Arial,sans-serif;padding:40px;max-width:780px;margin:auto}')
    doc.write('h1{text-align:center;color:#1d3557;margin-bottom:4px}')
    doc.write('.subtitle{text-align:center;color:#666;margin-bottom:30px}')
    doc.write('table{width:100%;border-collapse:collapse;margin:20px 0}')
    doc.write('th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #ddd}')
    doc.write('th{background:#1d3557;color:#fff}')
    doc.write('.footer{text-align:center;margin-top:40px;color:#999;font-size:.85rem;border-top:1px solid #ddd;padding-top:20px}')
    doc.write('</style></head><body>')
    doc.write(content.innerHTML)
    doc.write('<div class="footer">Thank you for shopping at Bismillah General Store!</div>')
    doc.write('<scr' + 'ipt>window.print();window.close();</scr' + 'ipt>')
    doc.write('</body></html>')
    doc.close()
  }

  const columns = [
    { title: 'Order ID', dataIndex: '_id', key: '_id', render: (id) => `#${id.slice(-8)}` },
    {
      title: 'Customer', key: 'customer',
      render: (_, r) => r.shipping?.fullName || r.userEmail || 'N/A',
    },
    { title: 'Items', dataIndex: 'items', key: 'items', render: (items) => items?.length || 0 },
    {
      title: 'Total', dataIndex: 'total', key: 'total',
      render: (v) => `Rs ${formatCurrency(v)}`,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          onChange={(val) => handleStatusChange(record._id, val)}
          style={{ width: 130 }}
          options={['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => ({
            value: s,
            label: <Tag color={statusColors[s]} style={{ margin: 0 }}>{s}</Tag>,
          }))}
        />
      ),
    },
    {
      title: 'Date', dataIndex: 'createdAt', key: 'createdAt',
      render: (v) => formatDate(v),
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => setDetailModal(record)}>View Details</Button>
          <Popconfirm
            title="Delete this order?"
            description="Stock will be restored for all items."
            onConfirm={() => handleDeleteOrder(record._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} disabled={record.status === 'delivered'}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Title level={3}>Orders</Title>
      <Card>
        <Table dataSource={orders} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 'max-content' }} />
      </Card>

      <Modal
        title={`Bill - ${detailModal ? generateBillNumber(detailModal._id) : ''}`}
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print Bill
          </Button>
        }
        width={Math.min(700, window.innerWidth - 48)}
        style={{ maxWidth: 'calc(100vw - 48px)' }}
      >
        {detailModal && (
          <div ref={printRef}>
            <h1 style={{ textAlign: 'center', color: '#1d3557', marginBottom: 4 }}>Bismillah General Store</h1>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>Invoice / Bill</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <Text strong>Bill No:</Text> {generateBillNumber(detailModal._id)}<br />
                <Text strong>Date:</Text> {formatDateTime(detailModal.createdAt)}<br />
                <Text strong>Status:</Text>{' '}
                <Tag color={statusColors[detailModal.status]}>{detailModal.status}</Tag>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text strong>Customer:</Text> {detailModal.shipping?.fullName || 'N/A'}<br />
                <Text strong>Email:</Text> {detailModal.userEmail || 'N/A'}<br />
                <Text strong>Phone:</Text> {detailModal.shipping?.phone || 'N/A'}<br />
                <Text strong>Address:</Text> {detailModal.shipping?.address}, {detailModal.shipping?.city || 'N/A'}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
                <thead>
                  <tr style={{ background: '#1d3557', color: '#fff' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModal.items?.map((item, i) => {
                    const profit = calcItemProfit(item)
                    return (
                      <tr key={i}>
                        <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                        <td style={{ padding: '10px 12px' }}>{item.name}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.quantity} {item.unit || 'pcs'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>Rs {formatCurrency(item.price)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>Rs {formatCurrency(item.price * item.quantity)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: profit >= 0 ? '#2a9d8f' : '#e76f51' }}>
                          {profit != null ? `Rs ${formatCurrency(profit)}` : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginTop: 16 }}>
              <div>
                Total Profit: <span style={{ color: '#2a9d8f' }}>Rs {formatCurrency(calcOrderProfit(detailModal.items))}</span>
              </div>
              <div>
                Grand Total: <span style={{ color: '#2a9d8f' }}>Rs {formatCurrency(detailModal.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default Orders