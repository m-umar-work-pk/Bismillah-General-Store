import { useAuth } from '@/context/Auth'
import { Navigate } from 'react-router-dom'
import ScreenLoader from './ScreenLoader'

const ProtectedRoute = ({ element, adminOnly }) => {
  const { isAuth, userRole, isAppLoading } = useAuth()
  if (isAppLoading) return <ScreenLoader />
  if (!isAuth) return <Navigate to="/auth/login" />
  if (adminOnly && userRole !== 'admin') return <Navigate to="/" />
  return element
}

export default ProtectedRoute
