import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { loginUser } from '../store/chatSlice'
import LoginForm from '../pages/signUp/component/login'
import SignUpForm from '../pages/signUp/component/signUp'

function AuthScreen({ socket }) {
  const dispatch = useDispatch()
  const [mode, setMode] = useState('login')

  const handleLoginSuccess = (userData) => {
    dispatch(loginUser(userData))
  }

  return (
    <div className="app-shell flex items-center justify-center px-4">
      {mode === 'login' ? (
        <LoginForm
          socket={socket}
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignup={() => setMode('signup')}
        />
      ) : (
        <SignUpForm onSwitchToLogin={() => setMode('login')} />
      )}
    </div>
  )
}

export default AuthScreen
