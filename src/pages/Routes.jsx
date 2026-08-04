import { Navigate, Route, Routes } from 'react-router-dom'
import Auth from './Auth'
import Dashboard from './Dashboard'
import Frontend from './Frontend'
import NoPage from '@/components/Misc/NoPage'
import ProtectedRoute from '@/components/Misc/ProtectedRoute'
import { useAuth } from '@/context/Auth'

const Index = () => {
  const { isAuth } = useAuth()
  return (
    <Routes>
      <Route path="/*" element={<Frontend />} />
      <Route path="auth/*" element={!isAuth ? <Auth /> : <Navigate to="/" />} />
      <Route path="dashboard/*" element={<ProtectedRoute adminOnly element={<Dashboard />} />} />
      <Route path="*" element={<NoPage />} />
    </Routes>
  )
}

export default Index
