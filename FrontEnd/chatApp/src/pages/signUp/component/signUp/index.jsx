import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

function SignUpForm({ onSwitchToLogin }) {
  const socketRef = useRef(null)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('signupSuccess', () => {
      setIsSubmitting(false)
      onSwitchToLogin()
    })

    socket.on('error', (error) => {
      setErrorMessage(typeof error === 'string' ? error : 'Unable to create your account. Please try again.')
      setIsSubmitting(false)
    })

    socket.on('connect_error', () => {
      setErrorMessage('Cannot connect to the chat server. Please try again.')
      setIsSubmitting(false)
    })

    return () => socket.disconnect()
  }, [onSwitchToLogin])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!username || !email || !password || isSubmitting || !socketRef.current) return

    setErrorMessage('')
    setIsSubmitting(true)
    socketRef.current.emit('signup', { username: username.trim(), email: email.trim(), password })
  }

  return (
    <div className="auth-card w-full max-w-md rounded-2xl p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#25d366] text-2xl font-bold text-[#111b21]">
          W
        </div>
        <h1 className="text-3xl font-semibold text-white">Create account</h1>
        <p className="mt-2 text-sm text-[#8696a0]">Sign up to start chatting with your friends</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#1f2c34] px-4 py-3 text-white outline-none placeholder:text-[#8696a0]"
          placeholder="Username"
          required
        />
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
          {isSubmitting ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#8696a0]">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-medium text-[#25d366]">
          Login
        </button>
      </p>
    </div>
  )
}

export default SignUpForm
