// Login Page — Premium modern UI with animations
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Mail, Phone, Lock, Eye, EyeOff, Sprout, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  
  const [identifier, setIdentifier] = useState('')
  const DEFAULT_COUNTRY = import.meta.env.VITE_DEFAULT_COUNTRY_CODE || '91'
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(identifier, password)
    if (error) {
      setError(error.message || 'Invalid credentials. Please try again.')
    } else {
      navigate('/role-select')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to home */}
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-300 hover:text-white text-sm font-medium mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl">AgriMart</h1>
              <p className="text-emerald-300 text-xs">Farm-to-Fork Marketplace</p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-1">Welcome back</h2>
          <p className="text-emerald-200 text-sm mb-8">Sign in to your farmer or buyer account</p>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-500/20 border border-red-400/30 rounded-2xl text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identifier */}
            <div>
              <label className="block text-sm font-semibold text-emerald-100 mb-2">
                Email or Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  placeholder={`name@example.com or +${DEFAULT_COUNTRY}9876543210`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-emerald-100 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base rounded-2xl shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In to AgriMart'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">Quick Demo Login (1-Click)</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  setIdentifier('farmer@demo.com')
                  setPassword('demo123')
                  setLoading(true)
                  const { error } = await signIn('farmer@demo.com', 'demo123')
                  if (error) setError(error.message)
                  else navigate('/role-select')
                  setLoading(false)
                }}
                className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-xl text-xs font-bold text-emerald-200 transition-all text-left flex flex-col"
              >
                <span className="text-yellow-300 font-bold">🌾 Demo Farmer</span>
                <span className="text-[10px] text-emerald-300/80 font-mono">farmer@demo.com</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIdentifier('buyer@demo.com')
                  setPassword('demo123')
                  setLoading(true)
                  const { error } = await signIn('buyer@demo.com', 'demo123')
                  if (error) setError(error.message)
                  else navigate('/role-select')
                  setLoading(false)
                }}
                className="px-3 py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/30 rounded-xl text-xs font-bold text-emerald-200 transition-all text-left flex flex-col"
              >
                <span className="text-emerald-300 font-bold">🏪 Demo Buyer</span>
                <span className="text-[10px] text-emerald-300/80 font-mono">buyer@demo.com</span>
              </button>
            </div>
          </div>

          <p className="text-center text-emerald-300 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors">
              Register Free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}