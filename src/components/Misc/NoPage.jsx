import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

const NoPage = () => {
  const navigate = useNavigate()
  return (
    <main className="d-flex justify-content-center align-items-center">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={<Button type="primary" onClick={() => navigate('/')}>Back Home</Button>}
      />
    </main>
  )
}

export default NoPage
