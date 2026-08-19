// CreateListing - with AI grading integration
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Camera, Loader2, CheckCircle, AlertCircle, X, Image } from 'lucide-react'

const CROPS = [
  'Tomato', 'Onion', 'Potato', 'Rice', 'Wheat', 'Maize', 'Ragi',
  'Coconut', 'Banana', 'Mango', 'Chilli', 'Cabbage', 'Cauliflower',
  'Brinjal', 'Okra', 'Pumpkin', 'Carrot', 'Beetroot', 'Groundnut',
  'Soybean', 'Cotton', 'Sugarcane', 'Chickpea', 'Pigeon Pea'
]

const DISTRICTS = [
  'Bangalore Urban', 'Bangalore Rural', 'Mysore', 'Hubli', 'Dharwad',
  'Mangalore', 'Belgaum', 'Gulbarga', 'Bidar', 'Raichur', 'Koppal',
  'Bellary', 'Chitradurga', 'Davangere', 'Shimoga', 'Tumkur', 'Kolar'
]

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function CreateListing() {
  const { t } = useTranslation('farmer')
  const navigate = useNavigate()
  const { user } = useAuth()
  const params = useParams()
  const isEditing = !!params.edit

  const [formData, setFormData] = useState({
    crop_type: '',
    qty_avail: '',
    price: '',
    district: '',
    pooling_enabled: false,
    pooling_threshold: '',
    ai_grade: '',
  })
  const [gradeResult, setGradeResult] = useState(null)
  const [grading, setGrading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    if (isEditing) {
      fetchListing(params.edit)
    }
  }, [params.edit])

  const fetchListing = async (id) => {
    try {
      const { data, error } = await supabase
        .from('produce_listings')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      if (data) {
        setFormData({
          crop_type: data.crop_type,
          qty_avail: data.qty_avail,
          price: data.price,
          district: data.district || '',
          pooling_enabled: data.pooling_enabled,
          pooling_threshold: data.pooling_threshold || '',
          ai_grade: data.ai_grade || '',
        })
        if (data.ai_grade) {
          setGradeResult({ ai_grade: data.ai_grade, confidence: 0.9, suggested_price_range: { min: data.price * 0.9, max: data.price * 1.1 } })
        }
      }
    } catch (err) {
      console.error('Failed to fetch listing:', err)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)

    // Grade
    setGrading(true)
    try {
      const formData = new FormData()
      formData.append('crop_type', formData.crop_type || formData.get('crop_type'))
      formData.append('image', file)

      const session = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE}/vision/grade-crop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: formData
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.detail || 'Grading failed')

      setGradeResult(result)
      setFormData(prev => ({ ...prev, ai_grade: result.ai_grade, price: result.suggested_price_range.max.toString() }))
    } catch (err) {
      setError(err.message)
    } finally {
      setGrading(false)
    }
  }

  const useSuggestedPrice = () => {
    if (gradeResult) {
      setFormData(prev => ({ ...prev, price: gradeResult.suggested_price_range.max.toString() }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const session = await supabase.auth.getSession()
      const payload = {
        farmer_id: user.id,
        crop_type: formData.crop_type,
        qty_avail: parseFloat(formData.qty_avail),
        price: parseFloat(formData.price),
        district: formData.district,
        pooling_enabled: formData.pooling_enabled,
        pooling_threshold: formData.pooling_threshold ? parseFloat(formData.pooling_threshold) : null,
        ai_grade: formData.ai_grade,
        is_active: true,
      }

      const url = isEditing 
        ? `${API_BASE}/produce_listings/${params.edit}`
        : `${API_BASE}/produce_listings`
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Failed to save listing')
      }

      setSuccess(true)
      setTimeout(() => navigate('/farmer/inventory'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="farmer-card">
        <h1 className="text-2xl font-bold text-farmer-text mb-1">{t('createListing.title')}</h1>
        <p className="text-farmer-text/70">{t('createListing.subtitle')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="farmer-card space-y-6">
        {/* Crop Type */}
        <div>
          <label className="block text-farmer-text font-medium mb-2">{t('createListing.cropType')}</label>
          <select
            value={formData.crop_type}
            onChange={(e) => handleChange('crop_type', e.target.value)}
            className="input-field text-farmer-text bg-white"
            required
          >
            <option value="">{t('createListing.cropPlaceholder')}</option>
            {CROPS.map(crop => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>
        </div>

        {/* Quantity & Price Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-farmer-text font-medium mb-2">{t('createListing.quantity')}</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.qty_avail}
              onChange={(e) => handleChange('qty_avail', e.target.value)}
              className="input-field text-farmer-text bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-farmer-text font-medium mb-2">{t('createListing.price')}</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="input-field text-farmer-text bg-white"
              required
            />
          </div>
        </div>

        {/* District */}
        <div>
          <label className="block text-farmer-text font-medium mb-2">{t('createListing.district')}</label>
          <select
            value={formData.district}
            onChange={(e) => handleChange('district', e.target.value)}
            className="input-field text-farmer-text bg-white"
            required
          >
            <option value="">{t('createListing.districtPlaceholder')}</option>
            {DISTRICTS.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>

        {/* AI Grade Section */}
        <div className="border-t border-farmer-accent/30 pt-6">
          <label className="block text-farmer-text font-medium mb-3">{t('createListing.aiGrade')}</label>
          
          <div className="space-y-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
                id="crop-image"
                disabled={grading}
              />
              <button
                type="button"
                onClick={() => document.getElementById('crop-image').click()}
                disabled={grading}
                className="farmer-btn w-full flex items-center justify-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>{grading ? t('createListing.grading') : t('createListing.gradeButton')}</span>
              </button>
            </label>

            {imagePreview && (
              <div className="relative max-w-xs mx-auto">
                <img src={imagePreview} alt="Crop preview" className="w-full rounded-xl border-2 border-farmer-accent/30" />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {gradeResult && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-green-700 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">{t('createListing.gradeResult', { grade: gradeResult.ai_grade, confidence: Math.round(gradeResult.confidence * 100) })}</span>
                </div>
                <p className="text-green-700 text-sm">{t('createListing.suggestedPrice', { min: gradeResult.suggested_price_range.min, max: gradeResult.suggested_price_range.max })}</p>
                <button
                  type="button"
                  onClick={useSuggestedPrice}
                  className="mt-2 text-sm text-green-700 underline hover:text-green-800"
                >
                  {t('createListing.useSuggestedPrice')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pooling */}
        <div className="border-t border-farmer-accent/30 pt-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.pooling_enabled}
              onChange={(e) => handleChange('pooling_enabled', e.target.checked)}
              className="w-5 h-5 text-farmer-accent border-farmer-accent/30 rounded focus:ring-farmer-accent"
            />
            <span className="text-farmer-text font-medium">{t('createListing.enablePooling')}</span>
          </label>
          {formData.pooling_enabled && (
            <div className="mt-3">
              <label className="block text-farmer-text font-medium mb-2">{t('createListing.poolingThreshold')}</label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.pooling_threshold}
                onChange={(e) => handleChange('pooling_threshold', e.target.value)}
                className="input-field text-farmer-text bg-white"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="farmer-btn flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin w-6 h-6" />
                {t('createListing.creating')}
              </>
            ) : (
              t('createListing.submit')
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/farmer/inventory')}
            className="farmer-btn flex-1 bg-white text-farmer-text border-2 border-farmer-accent"
          >
            {t('actions.cancel')}
          </button>
        </div>
      </form>

      {success && (
        <div className="farmer-card text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-farmer-xl text-green-700">{t('createListing.success')}</h2>
        </div>
      )}
    </div>
  )
}