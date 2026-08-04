import "./App.scss"
import { useEffect } from "react"
import Routes from "./pages/Routes"
import { ConfigProvider, App as AntdApp } from "antd"
import { useAuth } from "./context/Auth"
import ScreenLoader from "@/components/Misc/ScreenLoader"

const MessageBridge = () => {
  const { message } = AntdApp.useApp()
  useEffect(() => {
    window.__antdMessage = message
  }, [message])
  return null
}

const App = () => {
  const { isAppLoading } = useAuth()
  return (
    <ConfigProvider theme={{ components: { Button: { controlOutlineWidth: 0 } } }}>
      <AntdApp>
        <MessageBridge />
        {!isAppLoading ? <Routes /> : <ScreenLoader />}
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
