// Register Page — Premium modern UI with role selection
import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Mail, Lock, Eye, EyeOff, Sprout, ArrowLeft, Loader2, AlertCircle, Tractor, Building2, ShieldCheck } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signUp } = useAuth()
  
  const [role, setRole] = useState(searchParams.get('role') || 'buyer')
  const [identifier, setIdentifier] = useState('')
  const DEFAULT_COUNTRY = import.meta.env.VITE_DEFAULT_COUNTRY_CODE || '91'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { data, error } = await signUp(identifier, password, role)
    if (error) {
      setError(error.message || 'Registration failed. Please try again.')
    } else {
      if (role === 'farmer') {
        navigate('/farmer/dashboard', { replace: true })
      } else {
        navigate('/buyer/market', { replace: true })
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-300 hover:text-white text-sm font-medium mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl">AgriMart</h1>
              <p className="text-emerald-300 text-xs">Join 12,400+ members</p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-1">Create Account</h2>
          <p className="text-emerald-200 text-sm mb-6">Free to join. Start buying or selling in minutes.</p>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('farmer')}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${
                role === 'farmer'
                  ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-500/10'
                  : 'border-white/20 bg-white/5 hover:border-white/40'
              }`}
            >
              <Tractor className={`mx-auto w-7 h-7 mb-2 ${role === 'farmer' ? 'text-yellow-400' : 'text-emerald-300'}`} />
              <span className={`block font-bold text-sm ${role === 'farmer' ? 'text-yellow-300' : 'text-white'}`}>Farmer</span>
              <span className="text-xs text-emerald-300/70">Sell your produce</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${
                role === 'buyer'
                  ? 'border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-500/10'
                  : 'border-white/20 bg-white/5 hover:border-white/40'
              }`}
            >
              <Building2 className={`mx-auto w-7 h-7 mb-2 ${role === 'buyer' ? 'text-emerald-400' : 'text-emerald-300'}`} />
              <span className={`block font-bold text-sm ${role === 'buyer' ? 'text-emerald-300' : 'text-white'}`}>Buyer</span>
              <span className="text-xs text-emerald-300/70">Buy direct from farms</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-red-500/20 border border-red-400/30 rounded-2xl text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier */}
            <div>
              <label className="block text-sm font-semibold text-emerald-100 mb-2">
                Email or Phone Number
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
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
              <label className="block text-sm font-semibold text-emerald-100 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  placeholder="At least 6 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-emerald-100 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            {/* Trust notice */}
            <div className="flex items-start gap-2 text-xs text-emerald-300 py-1">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              No verification code needed. You'll be logged in instantly after registration.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                `Create ${role === 'farmer' ? 'Farmer' : 'Buyer'} Account →`
              )}
            </button>
          </form>

          <p className="text-center text-emerald-300 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors">
              Sign In →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}