import AuthContext from './Auth'
import CartContext from './Cart'

const AppProvider = ({ children }) => {
  return (
    <AuthContext>
      <CartContext>
        {children}
      </CartContext>
    </AuthContext>
  )
}

export default AppProvider
