import { useEffect, useState } from 'react'

function LoginForm({ socket, onLoginSuccess, onSwitchToSignup }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!socket) return undefined
    if (!socket.connected) socket.connect()

    const handleLoginSuccessResponse = (data) => {
      if (!data?.token || !data.user) {
        setErrorMessage('Login failed. Please try again.')
        setIsSubmitting(false)
        return
      }

      localStorage.setItem('token', data.token)
      const userName = data.user.username

      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess({
          id: data.user.id,
          name: userName,
          status: 'online',
          avatar: userName.slice(0, 2).toUpperCase(),
          oldMessage: data.oldMessage,
        })
      }

      setIsSubmitting(false)
    }

    const handleError = (error) => {
      setErrorMessage(typeof error === 'string' ? error : 'Unable to log in. Please try again.')
      setIsSubmitting(false)
    }

    const handleConnectError = () => {
      setErrorMessage('Cannot connect to the chat server. Please try again.')
      setIsSubmitting(false)
    }

    socket.on('loginSuccess', handleLoginSuccessResponse)
    socket.on('error', handleError)
    socket.on('connect_error', handleConnectError)

    return () => {
      socket.off('loginSuccess', handleLoginSuccessResponse)
      socket.off('error', handleError)
      socket.off('connect_error', handleConnectError)
    }
  }, [socket, onLoginSuccess])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!email || !password || isSubmitting || !socket) return

    setErrorMessage('')
    setIsSubmitting(true)
    socket.emit('new-user-join', { email: email.trim(), password })
  }

  return (
    <div className="auth-card w-full max-w-md rounded-2xl p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#25d366] text-2xl font-bold text-[#111b21]">
          W
        </div>
        <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-[#8696a0]">Sign in to continue your conversations</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#1f2c34] px-4 py-3 text-white outline-none placeholder:text-[#8696a0]"
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#1f2c34] px-4 py-3 text-white outline-none placeholder:text-[#8696a0]"
          placeholder="Password"
          required
        />
        {errorMessage && (
          <p role="alert" className="text-sm text-red-400">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#25d366] px-4 py-3 text-sm font-semibold text-[#111b21] transition hover:bg-[#1fbf5a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Logging in...' : 'Enter chat'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#8696a0]">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitchToSignup} className="font-medium text-[#25d366]">
          Sign up
        </button>
      </p>
    </div>
  )
}

export default LoginForm
