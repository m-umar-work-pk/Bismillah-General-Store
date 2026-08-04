import { Button, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/Auth'

const { Title, Paragraph } = Typography
const { Item } = Form

const initialState = { email: '', password: '' }

const Login = () => {
  const [state, setState] = useState(initialState)
  const [isProcessing, setIsProcessing] = useState(false)
  const navigate = useNavigate()
  const { handleLogin } = useAuth()

  const handleChange = (e) => {
    setState({ ...state, [e.target.name]: e.target.value })
  }

  const handleLoginSubmit = async () => {
    const { email, password } = state
    if (!email) { window.toastify('Please enter your email', 'error'); return }
    if (!password) { window.toastify('Please enter your password', 'error'); return }

    setIsProcessing(true)
    try {
      await handleLogin(email, password)
      window.toastify('Login successful', 'success')
      navigate('/')
    } catch (err) {
      window.toastify(err.message || 'Login failed. Please try again.', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className='auth'>
      <div className="container">
        <div className="card p-4 mx-auto shadow">
          <Title level={1} className='text-center'>Login</Title>
          <Paragraph className='text-center'>
            Don't have an account? <Link className='text-decoration-none' to="/auth/register">Register</Link>
          </Paragraph>
          <Form layout='vertical'>
            <Item label="Email" required>
              <Input type="email" size='large' placeholder='Enter your email' name='email' onChange={handleChange} />
            </Item>
            <Item label="Password" required>
              <Input.Password size='large' placeholder='Enter your password' name='password' onChange={handleChange} />
            </Item>
            <Button type='primary' size='large' htmlType='submit' block loading={isProcessing} onClick={handleLoginSubmit}>
              Login
            </Button>
          </Form>
        </div>
      </div>
    </main>
  )
}

export default Login
