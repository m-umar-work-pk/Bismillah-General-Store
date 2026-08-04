import { Col, Row, Typography } from "antd"
import { Link } from "react-router-dom"

const { Paragraph, Title } = Typography

const Copyright = () => {
  const year = new Date().getFullYear()
  return (
    <footer className="store-footer">
      <div className="container">
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={8}>
            <Title level={4} style={{ color: "#fff" }}>Bismillah General Store</Title>
            <Paragraph style={{ color: "#a8dadc" }}>
              Your one-stop shop for fresh groceries and everyday essentials. Quality products at affordable prices.
            </Paragraph>
          </Col>
          <Col xs={12} sm={8}>
            <Title level={5} style={{ color: "#fff" }}>Quick Links</Title>
            <div><Link to="/">Home</Link></div>
            <div><Link to="/shop">Shop</Link></div>
            <div><Link to="/about">About Us</Link></div>
            <div><Link to="/contact">Contact</Link></div>
          </Col>
          <Col xs={12} sm={8}>
            <Title level={5} style={{ color: "#fff" }}>Customer Service</Title>
            <div><Link to="/cart">Cart</Link></div>
            <div><Link to="/orders">My Orders</Link></div>
            <div><Link to="/contact">Support</Link></div>
          </Col>
        </Row>
        <hr style={{ borderColor: "#457b9d" }} />
        <Paragraph className="text-center pb-3 mb-0" style={{ color: "#a8dadc" }}>
          &copy; {year} Bismillah General Store. All rights reserved.
        </Paragraph>
      </div>
    </footer>
  )
}

export default Copyright
