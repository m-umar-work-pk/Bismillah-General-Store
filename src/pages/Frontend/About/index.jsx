import { Typography, Row, Col } from 'antd'
import { ShopOutlined, SafetyOutlined, StarOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

const About = () => {
  return (
    <main className="container py-5">
      <Title level={2} className="text-center text-primary mb-4">About Bismillah General Store</Title>
      <Row gutter={[32, 32]} className="mb-5">
        <Col span={24}>
          <Paragraph style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            Welcome to Bismillah General Store — your trusted online marketplace for quality groceries and everyday products.
            We're committed to providing our customers with the best shopping experience, offering a
            wide range of products from fresh produce and household essentials to daily necessities.
          </Paragraph>
        </Col>
      </Row>
      <Row gutter={[24, 24]}>
        {[
          { icon: <ShopOutlined style={{ fontSize: 40, color: '#1d3557' }} />, title: 'Wide Selection', desc: 'Thousands of products across multiple categories to meet all your daily needs.' },
          { icon: <SafetyOutlined style={{ fontSize: 40, color: '#1d3557' }} />, title: 'Quality Guaranteed', desc: 'We ensure all our products meet high quality standards before they reach you.' },
          { icon: <StarOutlined style={{ fontSize: 40, color: '#1d3557' }} />, title: 'Customer First', desc: 'Your satisfaction is our top priority. We\'re here to help with any questions or concerns.' },
        ].map((item, i) => (
          <Col xs={24} md={8} key={i}>
            <div className="text-center p-4 border rounded-3" style={{ height: '100%' }}>
              <div className="mb-3">{item.icon}</div>
              <Title level={4}>{item.title}</Title>
              <Paragraph>{item.desc}</Paragraph>
            </div>
          </Col>
        ))}
      </Row>
    </main>
  )
}

export default About
