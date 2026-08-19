// Verify Phone Page
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { Loader2 } from 'lucide-react'

export default function VerifyPhone() {
  const location = useLocation()
  const navigate = useNavigate()
  const phone = location.state?.phone

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: err } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms'
      })
      if (err) throw err
      // Verified — redirect to role selection
      navigate('/role-select', { replace: true })
    } catch (err) {
      console.error('Verification failed:', err)
      setError(err.error_description || err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (!phone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card">
          <p className="text-gray-600">No phone number provided. Please start registration again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <h2 className="text-xl font-semibold mb-4">Verify your phone</h2>
          <p className="text-sm text-gray-600 mb-4">A one-time code was sent to {phone}. Enter it below to verify your account.</p>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input-field text-center text-lg tracking-widest"
              placeholder="Enter code"
              required
            />

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 inline-block mr-2" /> Verifying...
                </>
              ) : 'Verify'}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-500">Didn't receive the code? Check your phone or try again later.</p>
        </div>
      </div>
    </div>
  )
}
