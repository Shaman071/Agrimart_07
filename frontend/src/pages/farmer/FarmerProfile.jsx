// FarmerProfile - Profile management
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, User, MapPin, Award, Shield, FileText, Camera, CheckCircle, AlertCircle, Save } from 'lucide-react'

export default function FarmerProfile() {
  const { t } = useTranslation('farmer')
  const { profile, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    full_name: '',
    district: '',
    land_size: '',
  })
  const [kycFile, setKycFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const DISTRICTS = [
    'Bangalore Urban', 'Bangalore Rural', 'Mysore', 'Hubli', 'Dharwad',
    'Mangalore', 'Belgaum', 'Gulbarga', 'Bidar', 'Raichur', 'Koppal',
    'Bellary', 'Chitradurga', 'Davangere', 'Shimoga', 'Tumkur', 'Kolar'
  ]

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        district: profile.district || '',
        land_size: profile.land_size || '',
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

  const handleKycUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' })
      return
    }

    setUploading(true)
    setKycFile(file)
    try {
      const fileName = `kyc/${profile.farmer_id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('farmers')
        .update({ kyc_document_url: fileName })
        .eq('farmer_id', profile.farmer_id)

      if (updateError) throw updateError

      setMessage({ type: 'success', text: 'KYC document uploaded successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="farmer-card">
        <h1 className="text-2xl font-bold text-farmer-text">{t('profile.title')}</h1>
      </div>

      {/* Profile Info */}
      <div className="farmer-card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-farmer-accent rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-farmer-xl text-farmer-text">{profile?.full_name || 'Farmer'}</h2>
            <p className="text-farmer-text/70">{profile?.district}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                profile?.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {profile?.is_verified ? t('profile.verified') : t('profile.notVerified')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {t('profile.trustScore')}: {profile?.trust_score || 50}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-farmer-accent/30 pt-6">
          <h3 className="text-farmer-text font-semibold mb-4">{t('profile.personalInfo')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-farmer-text font-medium mb-2">{t('profile.fullName')}</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="input-field text-farmer-text bg-white"
              />
            </div>
            <div>
              <label className="block text-farmer-text font-medium mb-2">{t('profile.district')}</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({...formData, district: e.target.value})}
                className="input-field text-farmer-text bg-white"
              >
                <option value="">Select district</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-farmer-text font-medium mb-2">{t('profile.landSize')}</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.land_size}
                onChange={(e) => setFormData({...formData, land_size: e.target.value})}
                className="input-field text-farmer-text bg-white"
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="farmer-btn mt-6">
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : t('profile.updateProfile')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="farmer-card">
        <h3 className="text-farmer-text font-semibold mb-4">{t('profile.completedOrders')}: {profile?.completed_orders || 0} • {t('profile.disputedOrders')}: {profile?.disputed_orders || 0}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-farmer-bg rounded-xl text-center">
            <Award className="w-8 h-8 text-farmer-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-farmer-text">{profile?.completed_orders || 0}</p>
            <p className="text-farmer-text/70 text-sm">{t('profile.completedOrders')}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{profile?.disputed_orders || 0}</p>
            <p className="text-farmer-text/70 text-sm">{t('profile.disputedOrders')}</p>
          </div>
        </div>
      </div>

      {/* KYC */}
      <div className="farmer-card">
        <h3 className="text-farmer-text font-semibold mb-4 flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          {t('profile.kycDocuments')}
        </h3>
        <div className="space-y-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleKycUpload}
              className="hidden"
              id="kyc-upload"
              disabled={uploading}
            />
            <button
              type="button"
              onClick={() => document.getElementById('kyc-upload').click()}
              disabled={uploading}
              className="farmer-btn w-full flex items-center justify-center space-x-2"
            >
              <Camera className="w-5 h-5" />
              <span>{uploading ? 'Uploading...' : t('profile.uploadKyc')}</span>
            </button>
          </label>
          {profile?.kyc_document_url && (
            <p className="text-sm text-green-700 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>KYC document uploaded</span>
            </p>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  )
}