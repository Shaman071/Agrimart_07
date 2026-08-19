// BusinessProfile - Buyer's profile management
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, User, Building2, MapPin, Mail, CreditCard, Shield, Save, CheckCircle, AlertCircle } from 'lucide-react'

const BUYER_TYPES = ['Consumer', 'Retailer', 'Wholesaler']

export default function BusinessProfile() {
  const { t } = useTranslation('common')
  const { profile, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    full_name: '',
    buyer_type: 'Consumer',
    biz_name: '',
    gstin: '',
    address: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        buyer_type: profile.buyer_type || 'Consumer',
        biz_name: profile.biz_name || '',
        gstin: profile.gstin || '',
        address: profile.address || '',
      })
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const { error } = await updateProfile(formData)
      if (error) throw error
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>

      {/* Profile Header */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <Building2 className="w-10 h-10 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'Buyer'}</h2>
            <p className="text-gray-500">{profile?.buyer_type}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Trust Score: {profile?.trust_score || 50}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="card space-y-6">
        <div className="border-b pb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Type</label>
              <select
                value={formData.buyer_type}
                onChange={(e) => setFormData({...formData, buyer_type: e.target.value})}
                className="input-field"
              >
                {BUYER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="border-b pb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={formData.biz_name}
                onChange={(e) => setFormData({...formData, biz_name: e.target.value})}
                className="input-field"
                placeholder="Optional for consumers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                className="input-field"
                placeholder="15-character GSTIN (optional)"
                maxLength={15}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address
          </h3>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="input-field min-h-[100px]"
            placeholder="Full delivery address"
            rows={3}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* Trust Score Info */}
      <div className="card border-l-4 border-primary-500">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          About Trust Score
        </h3>
        <p className="text-sm text-gray-600">
          Your trust score is calculated based on order completion rate and dispute history.
          Higher scores give you better visibility to farmers and faster order processing.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Completed: {profile?.completed_orders || 0}
          </span>
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Disputed: {profile?.disputed_orders || 0}
          </span>
        </div>
      </div>

      {message.text && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  )
}