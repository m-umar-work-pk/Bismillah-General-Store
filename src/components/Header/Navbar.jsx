import { useState } from 'react'
import { useAuth } from '@/context/Auth'
import { useCart } from '@/context/Cart'
import { Badge, Button, Space, Drawer, Avatar } from 'antd'
import { ShoppingCartOutlined, UserOutlined, OrderedListOutlined, MenuOutlined, CloseOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'

const Navbar = () => {
  const { isAuth, user, userRole, handleLogout } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const userAvatar = user?.avatar ? (
    <Avatar src={user.avatar} size={32} style={{ marginRight: 8, cursor: 'pointer' }} />
  ) : (
    <Avatar src="https://admissions.comsats.edu.pk/content/images/icoperson.jpg" size={32} style={{ marginRight: 8, cursor: 'pointer' }} />
  )

  return (
    <nav className="navbar navbar-expand-lg bg-primary navbar-dark">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">Bismillah General Store</Link>
        <button className="navbar-toggler" type="button" onClick={() => setDrawerOpen(true)}>
          <MenuOutlined style={{ fontSize: 20 }} />
        </button>
        <div className="d-lg-none ms-auto me-2" style={{ zIndex: 1030 }}>
          <Badge count={cartCount} showZero={false} offset={[-5, 5]}>
            <Button type="default" icon={<ShoppingCartOutlined />} size="large" onClick={() => navigate('/cart')} className="px-2">
              Cart
            </Button>
          </Badge>
        </div>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/shop">Shop</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/about">About</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/contact">Contact</Link></li>
          </ul>
          <Space>
            <Badge count={cartCount} showZero={false} offset={[-5, 5]} className="d-none d-lg-inline-flex">
              <Button type="default" icon={<ShoppingCartOutlined />} size="large" onClick={() => navigate('/cart')}>
                Cart
              </Button>
            </Badge>
            {isAuth ? (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontWeight: 500, cursor: 'pointer' }} onClick={() => userRole === 'admin' ? navigate('/dashboard') : navigate('/orders')}>
                  {userAvatar}
                  <span className="d-none d-lg-inline">{user?.fullName || 'User'}</span>
                </span>
                {userRole === 'admin' ? (
                  <Button  size="large" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </Button>
                ) : (
                  <Button icon={<OrderedListOutlined />} size="large" onClick={() => navigate('/orders')}>
                    My Orders
                  </Button>
                )}
                <Button type="primary" danger size="large" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Button type="primary" className="bg-success" size="large" onClick={() => navigate('/auth/login')}>Login</Button>
                <Button type="primary" danger size="large" onClick={() => navigate('/auth/register')}>Register</Button>
              </>
            )}
          </Space>
        </div>
      </div>
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        size="default"
      >
        <ul className="navbar-nav flex-column w-100">
          <li className="nav-item"><Link className="nav-link fw-bold" to="/" onClick={() => setDrawerOpen(false)}>Home</Link></li>
          <li className="nav-item"><Link className="nav-link fw-bold" to="/shop" onClick={() => setDrawerOpen(false)}>Shop</Link></li>
          <li className="nav-item"><Link className="nav-link fw-bold" to="/about" onClick={() => setDrawerOpen(false)}>About</Link></li>
          <li className="nav-item"><Link className="nav-link fw-bold" to="/contact" onClick={() => setDrawerOpen(false)}>Contact</Link></li>
          <li className="nav-item">
            <Badge count={cartCount} showZero={false}>
              <Button block icon={<ShoppingCartOutlined />} onClick={() => { navigate('/cart'); setDrawerOpen(false); }}>
                Cart ({cartCount || 0})
              </Button>
            </Badge>
          </li>
          {isAuth ? (
            <>
              <li className="nav-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                {userAvatar}
                <span style={{ fontWeight: 600, color: '#1d3557' }}>{user?.fullName || 'User'}</span>
              </li>
              {userRole === 'admin' ? (
                <li className="nav-item"><Button block icon={<UserOutlined />} onClick={() => { navigate('/dashboard'); setDrawerOpen(false); }}>Dashboard</Button></li>
              ) : (
                <li className="nav-item"><Button block icon={<OrderedListOutlined />} onClick={() => { navigate('/orders'); setDrawerOpen(false); }}>My Orders</Button></li>
              )}
              <li className="nav-item"><Button block type="primary" danger onClick={handleLogout}>Logout</Button></li>
            </>
          ) : (
            <>
              <li className="nav-item"><Button block type="primary" className="bg-success" onClick={() => { navigate('/auth/login'); setDrawerOpen(false); }}>Login</Button></li>
              <li className="nav-item"><Button block type="primary" danger onClick={() => { navigate('/auth/register'); setDrawerOpen(false); }}>Register</Button></li>
            </>
          )}
        </ul>
      </Drawer>
    </nav>
  )
}

export default Navbar
