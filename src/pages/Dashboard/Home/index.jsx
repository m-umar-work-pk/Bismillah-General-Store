import { useState, useEffect } from 'react'
import { api } from '@/config/api'
import { formatCurrency } from '@/utils/format'
import { Card, Col, Row, Statistic, Typography, Alert, Tabs, Table, Tag } from 'antd'
import {
  ShoppingOutlined, ShoppingCartOutlined, UserOutlined,
  AppstoreOutlined, DollarOutlined, WarningOutlined,
  FileTextOutlined, RiseOutlined, BarChartOutlined, LineChartOutlined,
  PieChartOutlined, StockOutlined, TrophyOutlined, DownOutlined
} from '@ant-design/icons'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, ArcElement,
  Title as ChartTitle, Tooltip, Legend, PointElement
} from 'chart.js'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, ArcElement,
  ChartTitle, Tooltip, Legend, PointElement
)

const { Title } = Typography

const DashboardHome = () => {
  const [stats, setStats] = useState({
    products: 0, orders: 0, users: 0, categories: 0,
    totalRevenue: 0, totalProfit: 0, totalStockProfit: 0,
    pendingOrders: 0, deliveredOrders: 0,
    lowStockItems: 0,
  })
  const [monthlyData, setMonthlyData] = useState({
    months: [], revenue: [], orders: [], profit: [],
    topProducts: [], allProducts: [],
    dailyRevenue: [], dailyOrders: [], dailyProfit: [],
    dailyLabels: [],
    topBuyers: [],
    highSellingItems: [],
    lowSellingItems: [],
  })
  const [loadingCharts, setLoadingCharts] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/dashboard/stats')
        if (data) {
          setStats({
            products: data.totalProducts || data.products || 0,
            orders: data.totalOrders || data.orders || 0,
            users: data.totalUsers || data.users || 0,
            categories: data.totalCategories || data.categories || 0,
            totalRevenue: data.totalRevenue || 0,
            totalProfit: data.totalProfit || 0,
            totalStockProfit: data.totalStockProfit || 0,
            pendingOrders: data.pendingOrders || 0,
            deliveredOrders: data.deliveredOrders || 0,
            lowStockItems: data.lowStockItems || 0,
          })
        }
      } catch {
        // ignore
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const fetchMonthlyData = async () => {
      setLoadingCharts(true)
      try {
        const data = await api.get('/dashboard/chart-data')
        if (data) {
          const topProds = (data.topProducts || []).map(p => {
            if (Array.isArray(p)) {
              const name = p[0]
              const revenue = p[1]
              const demandEntry = (data.demandProducts || []).find(d => Array.isArray(d) ? d[0] === name : d.name === name)
              const quantity = demandEntry ? (Array.isArray(demandEntry) ? demandEntry[1] : demandEntry.quantity) : 0
              return { name, revenue, quantity }
            }
            return p
          })

          const dailyLabels = data.dailyLabels || []
          const dailyRevenue = data.dailyRevenue || []
          const dailyOrders = data.dailyOrders || []
          const dailyProfit = data.dailyProfit || []

          setMonthlyData({
            months: data.months || [],
            revenue: data.monthlyRevenue || data.revenue || [],
            orders: data.monthlyOrders || data.orders || [],
            profit: data.monthlyProfit || data.profit || [],
            topProducts: topProds,
            allProducts: (data.allProducts || []).map(p => Array.isArray(p) ? { name: p[0], revenue: p[1] } : p),
            dailyLabels,
            dailyRevenue,
            dailyOrders,
            dailyProfit,
            topBuyers: data.topBuyers || [],
            highSellingItems: data.highSellingItems || [],
            lowSellingItems: data.lowSellingItems || [],
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingCharts(false)
      }
    }
    fetchMonthlyData()
  }, [])

  const chartColors = {
    primary: '#1d3557',
    secondary: '#2a9d8f',
    accent: '#e9c46a',
    danger: '#e76f51',
    info: '#457b9d',
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: v => `Rs ${formatCurrency(v)}` } }
    }
  }

  const lineChartOptionsCount = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: v => `Rs ${formatCurrency(v)}` } }
    }
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  }

  const dailyRevenueData = {
    labels: monthlyData.dailyLabels,
    datasets: [{
      label: 'Daily Revenue (Rs)',
      data: monthlyData.dailyRevenue,
      borderColor: chartColors.secondary,
      backgroundColor: 'rgba(42, 157, 143, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
    }],
  }

  const dailyOrdersData = {
    labels: monthlyData.dailyLabels,
    datasets: [{
      label: 'Daily Orders',
      data: monthlyData.dailyOrders,
      borderColor: chartColors.primary,
      backgroundColor: 'rgba(29, 53, 87, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
    }],
  }

  const dailyProfitData = {
    labels: monthlyData.dailyLabels,
    datasets: [{
      label: 'Daily Profit (Rs)',
      data: monthlyData.dailyProfit,
      borderColor: chartColors.accent,
      backgroundColor: 'rgba(233, 196, 106, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
    }],
  }

  const monthlyRevenueData = {
    labels: monthlyData.months,
    datasets: [{
      label: 'Revenue (Rs)',
      data: monthlyData.revenue,
      borderColor: chartColors.secondary,
      backgroundColor: 'rgba(42, 157, 143, 0.15)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 7,
    }],
  }

  const monthlyOrdersData = {
    labels: monthlyData.months,
    datasets: [{
      label: 'Orders',
      data: monthlyData.orders,
      borderColor: chartColors.primary,
      backgroundColor: 'rgba(29, 53, 87, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 7,
    }],
  }

  const monthlyProfitData = {
    labels: monthlyData.months,
    datasets: [{
      label: 'Profit (Rs)',
      data: monthlyData.profit,
      borderColor: chartColors.danger,
      backgroundColor: 'rgba(231, 111, 81, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 7,
    }],
  }

  const topProductsBarData = {
    labels: (monthlyData.topProducts || []).map(p => p.name),
    datasets: [{
      label: 'Revenue (Rs)',
      data: (monthlyData.topProducts || []).map(p => p.revenue),
      backgroundColor: [chartColors.secondary, chartColors.accent, chartColors.danger, chartColors.primary, chartColors.info],
      borderRadius: 6,
    }],
  }

  const productDemandData = {
    labels: (monthlyData.topProducts || []).map(p => p.name),
    datasets: [{
      label: 'Quantity Sold',
      data: (monthlyData.topProducts || []).map(p => p.quantity),
      backgroundColor: chartColors.secondary,
      borderRadius: 6,
    }],
  }

  const allProductsData = {
    labels: (monthlyData.allProducts || []).map(p => p.name),
    datasets: [{
      label: 'Revenue (Rs)',
      data: (monthlyData.allProducts || []).map(p => p.revenue),
      backgroundColor: chartColors.secondary,
      borderRadius: 6,
    }],
  }

  const topBuyersColumns = [
    {
      title: '#',
      key: 'rank',
      width: 50,
      render: (_, __, index) => (
        <span style={{ fontWeight: 700, color: index < 3 ? '#f39c12' : '#666' }}>
          {index < 3 ? <TrophyOutlined style={{ marginRight: 4 }} /> : ''}{index + 1}
        </span>
      ),
    },
    { title: 'Customer', dataIndex: 'userName', key: 'userName', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: 'Email', dataIndex: 'userEmail', key: 'userEmail', render: (v) => <span style={{ color: '#666' }}>{v}</span> },
    { title: 'Orders', dataIndex: 'totalOrders', key: 'totalOrders', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: 'Items', dataIndex: 'totalItems', key: 'totalItems', render: (v) => <Tag color="green">{v}</Tag> },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (v) => <span style={{ fontWeight: 700, color: '#2a9d8f' }}>Rs {formatCurrency(v)}</span>,
    },
  ]

  const highSellingColumns = [
    {
      title: '#',
      key: 'rank',
      width: 50,
      render: (_, __, index) => (
        <span style={{ fontWeight: 700, color: index < 3 ? '#27ae60' : '#666' }}>
          {index < 3 ? <RiseOutlined style={{ marginRight: 4, color: '#27ae60' }} /> : ''}{index + 1}
        </span>
      ),
    },
    { title: 'Product', dataIndex: 'name', key: 'name', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: 'Qty Sold', dataIndex: 'quantity', key: 'quantity', render: (v) => <Tag color="green">{v}</Tag> },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (v) => <span style={{ fontWeight: 600, color: '#2a9d8f' }}>Rs {formatCurrency(v)}</span>,
    },
  ]

  const lowSellingColumns = [
    {
      title: '#',
      key: 'rank',
      width: 50,
      render: (_, __, index) => (
        <span style={{ fontWeight: 700, color: index < 3 ? '#e74c3c' : '#666' }}>
          {index < 3 ? <DownOutlined style={{ marginRight: 4, color: '#e74c3c' }} /> : ''}{index + 1}
        </span>
      ),
    },
    { title: 'Product', dataIndex: 'name', key: 'name', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: 'Qty Sold', dataIndex: 'quantity', key: 'quantity', render: (v) => <Tag color="orange">{v}</Tag> },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (v) => <span style={{ fontWeight: 600, color: '#e67e22' }}>Rs {formatCurrency(v)}</span>,
    },
  ]

  return (
    <>
      <Title level={3}>Dashboard</Title>

      {stats.lowStockItems > 0 && (
        <Alert
          message={`${stats.lowStockItems} product(s) have low stock (≤5 items). Go to Stock management.`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          className="mb-3 animate-fade-in-up"
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Products" value={stats.products} prefix={<ShoppingOutlined />} styles={{ content: { color: chartColors.primary } }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Total Orders" value={stats.orders} prefix={<ShoppingCartOutlined />} styles={{ content: { color: chartColors.secondary } }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Pending Orders" value={stats.pendingOrders} prefix={<ShoppingCartOutlined />} styles={{ content: { color: chartColors.danger } }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Delivered Orders" value={stats.deliveredOrders} prefix={<RiseOutlined />} styles={{ content: { color: chartColors.secondary } }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Total Revenue" value={`Rs ${formatCurrency(stats.totalRevenue)}`} prefix={<DollarOutlined />} styles={{ content: { color: chartColors.secondary } }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Total Profit (Orders)" value={`Rs ${formatCurrency(stats.totalProfit)}`} prefix={<RiseOutlined />} styles={{ content: { color: chartColors.primary } }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Stock Profit (Unsold)" value={`Rs ${formatCurrency(stats.totalStockProfit)}`} prefix={<StockOutlined />} styles={{ content: { color: chartColors.info } }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Low Stock Items" value={stats.lowStockItems} prefix={<WarningOutlined />} styles={{ content: { color: stats.lowStockItems > 0 ? chartColors.danger : chartColors.secondary } }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Users" value={stats.users} prefix={<UserOutlined />} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Categories" value={stats.categories} prefix={<AppstoreOutlined />} styles={{ content: { color: chartColors.accent } }} /></Card></Col>
      </Row>

      <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>Detailed Analytics</Title>

      <Row gutter={[16, 16]} className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {/* Daily Revenue Line Chart */}
        <Col xs={24} lg={12}>
          <Card title={<span><LineChartOutlined style={{ marginRight: 8 }} /> Daily Revenue</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <div style={{ height: 280 }}>
                <Line data={dailyRevenueData} options={lineChartOptions} />
              </div>
            )}
          </Card>
        </Col>

        {/* Daily Orders Line Chart */}
        <Col xs={24} lg={12}>
          <Card title={<span><LineChartOutlined style={{ marginRight: 8 }} /> Daily Orders</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <div style={{ height: 280 }}>
                <Line data={dailyOrdersData} options={lineChartOptionsCount} />
              </div>
            )}
          </Card>
        </Col>

        {/* Daily Profit Line Chart */}
        <Col xs={24} lg={12}>
          <Card title={<span><LineChartOutlined style={{ marginRight: 8 }} /> Daily Profit</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <div style={{ height: 280 }}>
                <Line data={dailyProfitData} options={lineChartOptions} />
              </div>
            )}
          </Card>
        </Col>

        {/* Monthly Revenue Line Chart */}
        <Col xs={24} lg={12}>
          <Card title={<span><LineChartOutlined style={{ marginRight: 8 }} /> Monthly Revenue</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <div style={{ height: 280 }}>
                <Line data={monthlyRevenueData} options={lineChartOptions} />
              </div>
            )}
          </Card>
        </Col>

        {/* Monthly Orders Line Chart */}
        <Col xs={24} lg={12}>
          <Card title={<span><LineChartOutlined style={{ marginRight: 8 }} /> Monthly Orders</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <div style={{ height: 280 }}>
                <Line data={monthlyOrdersData} options={lineChartOptionsCount} />
              </div>
            )}
          </Card>
        </Col>

        {/* Monthly Profit Line Chart */}
        <Col xs={24} lg={12}>
          <Card title={<span><LineChartOutlined style={{ marginRight: 8 }} /> Monthly Profit</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <div style={{ height: 280 }}>
                <Line data={monthlyProfitData} options={lineChartOptions} />
              </div>
            )}
          </Card>
        </Col>

        {/* Top Products Revenue Bar */}
        <Col xs={24} lg={12}>
          <Card title={<span><BarChartOutlined style={{ marginRight: 8 }} /> Top 5 Products by Revenue</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <div style={{ height: 280 }}>
                <Bar data={topProductsBarData} options={barChartOptions} />
              </div>
            )}
          </Card>
        </Col>

        {/* Product Demand Bar */}
        <Col xs={24} lg={12}>
          <Card title={<span><BarChartOutlined style={{ marginRight: 8 }} /> Product Demand (Quantity Sold)</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <div style={{ height: 280 }}>
                <Bar data={productDemandData} options={{ ...barChartOptions, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
              </div>
            )}
          </Card>
        </Col>

        {/* Revenue Share Doughnut */}
        <Col xs={24} lg={8}>
          <Card title={<span><PieChartOutlined style={{ marginRight: 8 }} /> Revenue Share by Top Products</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <div style={{ height: 300 }}>
                <Doughnut
                  data={{
                    labels: (monthlyData.topProducts || []).map(p => p.name),
                    datasets: [{
                      data: (monthlyData.topProducts || []).map(p => p.revenue),
                      backgroundColor: [chartColors.secondary, chartColors.accent, chartColors.danger, chartColors.primary, chartColors.info],
                      borderWidth: 2,
                      borderColor: '#fff',
                    }],
                  }}
                  options={pieChartOptions}
                />
              </div>
            )}
          </Card>
        </Col>

        {/* All Products Selling Rate */}
        <Col xs={24} lg={16}>
          <Card title={<span><BarChartOutlined style={{ marginRight: 8 }} /> All Products Selling Rate</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <div style={{ height: Math.max(300, (monthlyData.allProducts || []).length * 36) }}>
                <Bar data={allProductsData} options={{ ...barChartOptions, indexAxis: 'y', plugins: { legend: { display: false } } }} />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Top Buyers Section */}
      <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
        <TrophyOutlined style={{ marginRight: 8, color: '#f39c12' }} />
        Top Buyers
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title={<span><UserOutlined style={{ marginRight: 8 }} /> Customers Who Spent Most</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <Table
                dataSource={monthlyData.topBuyers}
                columns={topBuyersColumns}
                rowKey="userId"
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Items Sales Rate Section */}
      <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
        <BarChartOutlined style={{ marginRight: 8, color: '#2a9d8f' }} />
        Items Sales Rate
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={<span><RiseOutlined style={{ marginRight: 8, color: '#27ae60' }} /> High Selling Items</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <Table
                dataSource={monthlyData.highSellingItems}
                columns={highSellingColumns}
                rowKey="name"
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span><DownOutlined style={{ marginRight: 8, color: '#e74c3c' }} /> Low Selling Items</span>}>
            {loadingCharts ? <div className="text-center py-4"><div className="spinner-border" /></div> : (
              <Table
                dataSource={monthlyData.lowSellingItems}
                columns={lowSellingColumns}
                rowKey="name"
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default DashboardHome
