import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '@/config/api'

const Auth = createContext()

const AuthContext = ({ children }) => {
  const [state, setState] = useState({ isAuth: false, user: null, userRole: null, isAppLoading: true })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setState({ isAuth: true, user, userRole: user.role, isAppLoading: false })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setState({ isAuth: false, user: null, userRole: null, isAppLoading: false })
      }
    } else {
      setState({ isAuth: false, user: null, userRole: null, isAppLoading: false })
    }
  }, [])

  const handleLogin = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    setState({ isAuth: true, user: res.user, userRole: res.user.role, isAppLoading: false })
    return res
  }

  const handleRegister = async (fullName, email, password, avatarFile) => {
    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('email', email)
    formData.append('password', password)
    if (avatarFile) formData.append('avatar', avatarFile)

    const res = await api.post('/auth/register', formData, true)

    if (res.error) throw new Error(res.error)

    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    setState({ isAuth: true, user: res.user, userRole: res.user.role, isAppLoading: false })
    return res
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setState({ isAuth: false, user: null, userRole: null, isAppLoading: false })
  }

  return (
    <Auth.Provider value={{ ...state, handleLogin, handleRegister, handleLogout }}>
      {children}
    </Auth.Provider>
  )
}

export default AuthContext

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Auth)
