// Role Select Page (after email/phone verification)
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { Tractor, Building2, CheckCircle, Loader2 } from 'lucide-react'

export default function RoleSelect() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, loading } = useAuth()
  
  const [selectedRole, setSelectedRole] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Check if user already has a profile
    if (profile?.role) {
      const redirectPath = profile.role === 'farmer' 
        ? '/farmer/dashboard' 
        : profile.role === 'buyer' 
          ? '/buyer/market' 
          : '/admin/metrics'
      navigate(redirectPath, { replace: true })
    }
  }, [profile, navigate])

  const { createProfile } = useAuth()

  const handleContinue = async () => {
    if (!selectedRole || !user) return
    
    setSaving(true)
    try {
      // Try to create a profile row in the DB; if tables are missing, createProfile falls back to local profile
      await createProfile(selectedRole)
      const redirectPath = selectedRole === 'farmer' 
        ? '/farmer/dashboard' 
        : '/buyer/market'
      navigate(redirectPath, { replace: true })
    } catch (error) {
      console.error('Role selection failed:', error)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-12 h-12 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tractor className="w-10 h-10 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to AgriMart!</h1>
            <p className="text-gray-600 mt-2">Select your role to continue</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setSelectedRole('farmer')}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedRole === 'farmer'
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <Tractor className="mx-auto w-12 h-12 mb-3 text-primary-600" />
              <span className="block text-lg font-semibold text-gray-900">Farmer</span>
              <span className="text-sm text-gray-500">I sell produce</span>
              {selectedRole === 'farmer' && (
                <CheckCircle className="mx-auto mt-2 w-6 h-6 text-primary-600" />
              )}
            </button>

            <button
              onClick={() => setSelectedRole('buyer')}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedRole === 'buyer'
                  ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <Building2 className="mx-auto w-12 h-12 mb-3 text-primary-600" />
              <span className="block text-lg font-semibold text-gray-900">Buyer</span>
              <span className="text-sm text-gray-500">I buy produce</span>
              {selectedRole === 'buyer' && (
                <CheckCircle className="mx-auto mt-2 w-6 h-6 text-primary-600" />
              )}
            </button>
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedRole || saving}
            className="btn-primary w-full py-3 text-lg disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin w-5 h-5 inline-block mr-2" />
                Setting up...
              </>
            ) : 'Continue'}
          </button>

          <p className="mt-4 text-xs text-gray-500">
            You can change this later in settings
          </p>
        </div>
      </div>
    </div>
  )
}