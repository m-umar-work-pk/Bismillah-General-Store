import { Button, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const { Title, Paragraph } = Typography
const { Item } = Form

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = async () => {
    if (!window.isEmailVaild(email)) { window.toastify('Please enter a valid email', 'error'); return }
    setIsProcessing(true)
    try {
      // Password reset is handled via backend in MongoDB setup
      setSent(true)
      window.toastify('Please contact admin to reset your password', 'info')
    } catch {
      window.toastify('Failed to send reset email', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className='auth'>
      <div className="container">
        <div className="card p-4 mx-auto shadow">
          <Title level={1} className='text-center'>Reset Password</Title>
          {!sent ? (
            <>
              <Paragraph className='text-center'>
                Enter your email and we'll help you reset your password.
              </Paragraph>
              <Form layout='vertical'>
                <Item label="Email" required>
                  <Input type="email" size='large' placeholder='Enter your email' value={email} onChange={e => setEmail(e.target.value)} />
                </Item>
                <Button type='primary' size='large' htmlType='submit' block loading={isProcessing} onClick={handleReset}>
                  Send Reset Link
                </Button>
              </Form>
            </>
          ) : (
            <Paragraph className='text-center'>
              Please contact admin to reset your password. <Link to="/auth/login">Back to Login</Link>
            </Paragraph>
          )}
          <Paragraph className='text-center mt-3'>
            <Link to="/auth/login">Back to Login</Link>
          </Paragraph>
        </div>
      </div>
    </main>
  )
}

export default ForgotPassword
