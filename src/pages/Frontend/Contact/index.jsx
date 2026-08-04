import { Button, Col, Form, Input, Row, Typography } from 'antd'
import { useState } from 'react'
import { MailOutlined, PhoneOutlined, EnvironmentOutlined, SendOutlined } from '@ant-design/icons'
import { api } from '@/config/api'

const { Title, Paragraph, Text } = Typography
const { Item } = Form
const { TextArea } = Input

const Contact = () => {
  const [state, setState] = useState({ name: '', email: '', subject: '', message: '' })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleChange = (e) => {
    setState({ ...state, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    const { name, email, subject, message } = state
    if (!name.trim()) { window.toastify('Please enter your name', 'error'); return }
    if (!email.trim()) { window.toastify('Please enter your email', 'error'); return }
    if (!message.trim()) { window.toastify('Please enter your message', 'error'); return }

    setIsProcessing(true)
    try {
      await api.post('/contact', { name, email, subject, message })
      window.toastify('Message sent to Liaqat Engineering Project!', 'success')
      setState({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      window.toastify(err.message || 'Failed to send message', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="container py-5">
      <Title level={2} className="text-center text-primary mb-2">Contact Us</Title>
      <Paragraph className="text-center mb-5" style={{ fontSize: '1.1rem', color: '#666' }}>
        Bismillah General Store  by <Text strong style={{ color: '#1d3557' }}>Muhammad Umar</Text>
      </Paragraph>
      <Row gutter={[32, 32]}>
        <Col xs={24} md={12}>
          <div className="p-4 border rounded-3 mb-3">
            <Title level={4}><MailOutlined /> Email</Title>
            <Paragraph>m.umar.work.pk@gmail.com</Paragraph>
          </div>
          <div className="p-4 border rounded-3 mb-3">
            <Title level={4}><PhoneOutlined /> Phone</Title>
            <Paragraph>+92 (329) 025-5056</Paragraph>
            <Paragraph>+92 (324) 960-4956</Paragraph>
            <Paragraph>+92 (305) 663-3525</Paragraph>
          </div>
          <div className="p-4 border rounded-3">
            <Title level={4}><EnvironmentOutlined /> Address</Title>
            <Paragraph>203 RB Manawala, Faisalabad, Punjab, Pakistan</Paragraph>
          </div>
          <div className="p-4 border rounded-3 mt-3" style={{ background: '#f0f7ff' }}>
            <Title level={5} style={{ color: '#1d3557' }}>Bismillah General Store</Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              This contact form sends your message directly to the Bismillah General Store team. We typically respond within 24 hours.
            </Paragraph>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div className="p-4 border rounded-3">
            <Title level={4}>Send us a Message</Title>
            <Paragraph type="secondary">Your message will be sent to Bismillah General Store</Paragraph>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Item label="Name" required>
                    <Input size="large" placeholder="Your name" name="name" value={state.name} onChange={handleChange} />
                  </Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Item label="Email" required>
                    <Input size="large" placeholder="Your email" name="email" value={state.email} onChange={handleChange} />
                  </Item>
                </Col>
              </Row>
              <Item label="Subject">
                <Input size="large" placeholder="Subject" name="subject" value={state.subject} onChange={handleChange} />
              </Item>
              <Item label="Message" required>
                <TextArea rows={4} size="large" placeholder="Write your message here..." name="message" value={state.message} onChange={handleChange} />
              </Item>
              <Button type="primary" size="large" block icon={<SendOutlined />} loading={isProcessing} onClick={handleSubmit}>
                Send Message
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </main>
  )
}

export default Contact
