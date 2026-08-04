import { Button, Form, Input, Typography, Image } from 'antd'
import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/Auth'
import { CameraOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { Item } = Form

const initialState = { fullName: '', email: '', password: '', confirmPassword: '' }

const Register = () => {
  const [state, setState] = useState(initialState)
  const [isProcessing, setIsProcessing] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const navigate = useNavigate()
  const { handleRegister } = useAuth()
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    setState({ ...state, [e.target.name]: e.target.value })
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      const url = URL.createObjectURL(file)
      setAvatarPreview(url)
    }
  }

  const handleRegisterSubmit = async () => {
    let { fullName, email, password, confirmPassword } = state
    fullName = fullName.trim()
    if (fullName.length < 3) { window.toastify('Full name must be at least 3 characters', 'error'); return }
    if (!window.isEmailVaild(email)) { window.toastify('Please enter a valid email', 'error'); return }
    if (password.length < 6) { window.toastify('Password must be at least 6 characters', 'error'); return }
    if (password !== confirmPassword) { window.toastify('Passwords do not match', 'error'); return }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('fullName', fullName)
      formData.append('email', email)
      formData.append('password', password)
      if (avatarFile) formData.append('avatar', avatarFile)

      const res = await handleRegister(fullName, email, password, avatarFile)
      window.toastify('Registration successful', 'success')
      navigate('/')
    } catch (err) {
      window.toastify(err.message || 'Registration failed. Please try again.', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className='auth'>
      <div className="container">
        <div className="card p-4 mx-auto shadow">
          <Title level={1} className='text-center'>Register</Title>
          <Paragraph className='text-center'>
            Already have an account? <Link className='text-decoration-none' to="/auth/login">Login</Link>
          </Paragraph>
          <Form layout='vertical'>
            <div className="text-center mb-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 100, height: 100, borderRadius: '50%', border: '2px dashed #d9d9d9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', overflow: 'hidden', margin: '0 auto',
                  background: avatarPreview ? 'transparent' : '#fafafa',
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <CameraOutlined style={{ fontSize: 32, color: '#999' }} />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8 }}>Click to upload profile photo</Paragraph>
            </div>
            <Item label="Full Name" required>
              <Input size='large' placeholder='Enter your full name' name='fullName' onChange={handleChange} />
            </Item>
            <Item label="Email" required>
              <Input type="email" size='large' placeholder='Enter your email' name='email' onChange={handleChange} />
            </Item>
            <Item label="Password" required>
              <Input.Password size='large' placeholder='Enter your password' name='password' onChange={handleChange} />
            </Item>
            <Item label="Confirm Password" required>
              <Input.Password size='large' placeholder='Confirm your password' name='confirmPassword' onChange={handleChange} />
            </Item>
            <Button type='primary' size='large' htmlType='submit' block loading={isProcessing} onClick={handleRegisterSubmit}>
              Register
            </Button>
          </Form>
        </div>
      </div>
    </main>
  )
}

export default Register
