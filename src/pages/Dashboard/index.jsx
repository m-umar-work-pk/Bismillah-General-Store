import { useState } from 'react'
import { Route, Routes, Link, useLocation } from "react-router-dom"
import { Button, Drawer, Layout, Menu } from "antd"
import {
  DashboardOutlined, ShoppingOutlined, ShoppingCartOutlined,
  AppstoreOutlined, LogoutOutlined, ShopOutlined, MenuOutlined,
  DollarOutlined, FileTextOutlined, StockOutlined, TeamOutlined,
  MessageOutlined, DeleteOutlined, ReloadOutlined, SafetyOutlined
} from "@ant-design/icons"
import Home from "./Home"
import Products from "./Products"
import Orders from "./Orders"
import Categories from "./Categories"
import Sales from "./Sales"
import Bills from "./Bills"
import Stock from "./Stock"
import Users from "./Users"
import Chat from "./Chat"
import ProductRecycleBin from "./Products/RecycleBin"
import RecycleBin from "./RecycleBin"
import NoPage from "@/components/Misc/NoPage"
import { useAuth } from "@/context/Auth"

const { Sider, Content } = Layout

const Dashboard = () => {
  const { handleLogout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const selectedKey = location.pathname === '/dashboard' || location.pathname === '/dashboard/' ? '/dashboard' : "/" + location.pathname.split("/").slice(1, 3).join("/")

  const menuItems = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
    { key: "/dashboard/products", icon: <ShoppingOutlined />, label: <Link to="/dashboard/products">Products</Link> },
    { key: "/dashboard/recycle-bin", icon: <SafetyOutlined />, label: <Link to="/dashboard/recycle-bin">Recycle Bin</Link> },
    { key: "/dashboard/stock", icon: <StockOutlined />, label: <Link to="/dashboard/stock">Stock</Link> },
    { key: "/dashboard/orders", icon: <ShoppingCartOutlined />, label: <Link to="/dashboard/orders">Orders</Link> },
    { key: "/dashboard/sales", icon: <DollarOutlined />, label: <Link to="/dashboard/sales">Sales Records</Link> },
    { key: "/dashboard/bills", icon: <FileTextOutlined />, label: <Link to="/dashboard/bills">Bill Records</Link> },
    { key: "/dashboard/chat", icon: <MessageOutlined />, label: <Link to="/dashboard/chat">Chat Support</Link> },
    { key: "/dashboard/categories", icon: <AppstoreOutlined />, label: <Link to="/dashboard/categories">Categories</Link> },
    { key: "/dashboard/users", icon: <TeamOutlined />, label: <Link to="/dashboard/users">Users</Link> },
    { type: "divider" },
    { key: "/", icon: <ShopOutlined />, label: <Link to="/">View Store</Link> },
    { key: "logout", icon: <LogoutOutlined />, label: <span onClick={handleLogout}>Logout</span> },
  ]

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        fixed="true"
        trigger={null}
      >
        <div style={{ padding: "16px", textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>
          Bismillah General Store
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
      </Sider>
      <Drawer
        title="Bismillah General Store"
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        styles={{ body: { padding: 0 } }}
        size="default"
      >
        <Menu theme="light" mode="inline" selectedKeys={[selectedKey]} items={menuItems} onClick={() => setMobileOpen(false)} />
      </Drawer>
      <Layout style={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }} className="d-lg-none">
          <Button type="text" icon={<MenuOutlined />} onClick={() => setMobileOpen(true)} style={{ fontSize: 18 }} />
          <span style={{ fontWeight: 700, fontSize: 16, marginLeft: 12 }}>Bismillah General Store</span>
        </div>
        <Content style={{ margin: 24, flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/recycle-bin" element={<ProductRecycleBin />} />
            <Route path="/recycle-bin" element={<RecycleBin />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<NoPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default Dashboard