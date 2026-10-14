// Login Page — Premium modern UI with 1-click quick demo login
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Mail, Lock, Eye, EyeOff, Sprout, ArrowLeft, Loader2, AlertCircle, Tractor, Building2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  
  const [identifier, setIdentifier] = useState('')
  const DEFAULT_COUNTRY = import.meta.env.VITE_DEFAULT_COUNTRY_CODE || '91'
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSuccessfulSignIn = (userEmail, role) => {
    if (userEmail?.includes('farmer') || role === 'farmer') {
      navigate('/farmer/dashboard', { replace: true })
    } else if (userEmail?.includes('admin') || role === 'admin') {
      navigate('/admin/metrics', { replace: true })
    } else {
      navigate('/buyer/market', { replace: true })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await signIn(identifier, password)
    if (error) {
      setError(error.message || 'Invalid credentials. Please try again.')
      setLoading(false)
    } else {
      handleSuccessfulSignIn(identifier, data?.user?.user_metadata?.role)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
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
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl">AgriMart</h1>
              <p className="text-emerald-400 text-xs font-semibold">Direct Agri Marketplace</p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-6">Sign in to access your marketplace dashboard</p>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Login 1-Click */}
          <div className="mb-6 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-emerald-400 text-xs font-black uppercase tracking-wider">Instant 1-Click Demo Login</p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={async () => {
                  setIdentifier('farmer@demo.com')
                  setPassword('demo123')
                  setLoading(true)
                  const { data, error } = await signIn('farmer@demo.com', 'demo123')
                  if (error) {
                    setError(error.message)
                    setLoading(false)
                  } else {
                    handleSuccessfulSignIn('farmer@demo.com', 'farmer')
                  }
                }}
                className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-left transition-all hover:scale-[1.02] flex items-center gap-2.5"
              >
                <Tractor className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-yellow-300 font-bold text-xs block">🌾 Demo Farmer</span>
                  <span className="text-[10px] text-slate-400 font-mono">1-Click Sign In</span>
                </div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIdentifier('buyer@demo.com')
                  setPassword('demo123')
                  setLoading(true)
                  const { data, error } = await signIn('buyer@demo.com', 'demo123')
                  if (error) {
                    setError(error.message)
                    setLoading(false)
                  } else {
                    handleSuccessfulSignIn('buyer@demo.com', 'buyer')
                  }
                }}
                className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-left transition-all hover:scale-[1.02] flex items-center gap-2.5"
              >
                <Building2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-emerald-300 font-bold text-xs block">🏪 Demo Buyer</span>
                  <span className="text-[10px] text-slate-400 font-mono">1-Click Sign In</span>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-500 font-bold uppercase">Or Sign In with Email</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Email or Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                  placeholder={`name@example.com or +${DEFAULT_COUNTRY}9876543210`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In to Dashboard →'
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
              Register Free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}