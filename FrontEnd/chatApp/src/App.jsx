import './App.css'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'
import AuthScreen from './components/AuthScreen'
import ChatPage from './pages/chat/component'

function App() {
  const currentUser = useSelector((state) => state.chat.currentUser)
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const chatSocket = io(import.meta.env.VITE_SOCKET_URL)
    const handleConnect = () => setSocket(chatSocket)

    chatSocket.on('connect', handleConnect)

    return () => {
      chatSocket.off('connect', handleConnect)
      chatSocket.disconnect()
    }
  }, [])

  return currentUser ? (
    <ChatPage currentUser={currentUser} socket={socket} />
  ) : (
    <AuthScreen socket={socket} />
  )
}

export default App
