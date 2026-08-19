// CropDoctor - AI crop disease diagnosis
import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Camera, Loader2, AlertCircle, CheckCircle, Info, RotateCcw, Image, Stethoscope } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SUPPORTED_CROPS = [
  'Tomato', 'Potato', 'Onion', 'Rice', 'Chilli', 'Cabbage',
  'Cauliflower', 'Brinjal', 'Okra', 'Pumpkin', 'Carrot', 'Beetroot'
]

export default function CropDoctor() {
  const { t } = useTranslation('farmer')
  const { user } = useAuth()
  const [selectedCrop, setSelectedCrop] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!selectedCrop) {
      setError('Please select a crop type first')
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)

    // Analyze
    setAnalyzing(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('crop_type', selectedCrop)
      formData.append('image', file)

      const session = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE}/vision/diagnose-crop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: formData
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Diagnosis failed')

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const reset = () => {
    setImagePreview(null)
    setResult(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="farmer-card text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Stethoscope className="w-8 h-8 text-farmer-accent" />
          <h1 className="text-2xl font-bold text-farmer-text">{t('cropDoctor.title')}</h1>
        </div>
        <p className="text-farmer-text/70">{t('cropDoctor.subtitle')}</p>
      </div>

      {/* Crop Selection */}
      <div className="farmer-card">
        <label className="block text-farmer-text font-medium mb-3">{t('cropDoctor.cropType')}</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {SUPPORTED_CROPS.map(crop => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCrop === crop
                  ? 'bg-farmer-accent text-white shadow-lg'
                  : 'bg-white border-2 border-farmer-accent/30 text-farmer-text hover:bg-farmer-accent/10'
              }`}
            >
              {crop}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div className="farmer-card">
        {result ? (
          // Show result
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${
              result.confidence > 0.8 ? 'bg-green-50 border border-green-200' :
              result.confidence > 0.6 ? 'bg-yellow-50 border border-yellow-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`p-2 rounded-xl ${
                  result.confidence > 0.8 ? 'bg-green-100' :
                  result.confidence > 0.6 ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  <Stethoscope className={`w-5 h-5 ${
                    result.confidence > 0.8 ? 'text-green-600' :
                    result.confidence > 0.6 ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-farmer-text">{t('cropDoctor.result')}</p>
                  <p className="text-sm text-farmer-text/70">{t('cropDoctor.confidence')}: {Math.round(result.confidence * 100)}%</p>
                </div>
              </div>
              <p className="text-lg font-medium text-farmer-text">{result.likely_issue}</p>
            </div>

            <div className="bg-white border border-farmer-accent/30 rounded-xl p-4">
              <h4 className="font-semibold text-farmer-text mb-2 flex items-center space-x-2">
                <Info className="w-5 h-5 text-farmer-accent" />
                {t('cropDoctor.recommendedAction')}
              </h4>
              <p className="text-farmer-text">{result.recommended_action}</p>
            </div>

            {result.possible_causes && result.possible_causes.length > 0 && (
              <div className="bg-white border border-farmer-accent/30 rounded-xl p-4">
                <h4 className="font-semibold text-farmer-text mb-2 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-farmer-accent" />
                  {t('cropDoctor.possibleCauses')}
                </h4>
                <ul className="space-y-1">
                  {result.possible_causes.map((cause, i) => (
                    <li key={i} className="text-farmer-text/80 text-sm flex items-center space-x-2">
                      <span className="w-2 h-2 bg-farmer-accent rounded-full" />
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              <p className="flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>{t('cropDoctor.disclaimer')}</span>
              </p>
            </div>

            <button onClick={reset} className="farmer-btn w-full">
              <RotateCcw className="w-5 h-5" />
              {t('cropDoctor.tryAnother')}
            </button>
          </div>
        ) : (
          // Upload area
          <div className="text-center space-y-4">
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
                id="crop-image"
                disabled={analyzing || !selectedCrop}
              />
              <button
                type="button"
                onClick={() => document.getElementById('crop-image').click()}
                disabled={analyzing || !selectedCrop}
                className={`relative w-48 h-48 mx-auto rounded-2xl border-4 border-dashed transition-all ${
                  selectedCrop
                    ? 'border-farmer-accent bg-farmer-bg hover:bg-farmer-accent/10'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Image className="w-12 h-12 text-farmer-text/50 mb-2" />
                  <p className="text-farmer-text/70">{analyzing ? t('cropDoctor.analyzing') : t('cropDoctor.uploadImage')}</p>
                </div>
              </button>
            </label>

            {imagePreview && (
              <div className="relative max-w-md mx-auto">
                <img src={imagePreview} alt="Crop preview" className="w-full rounded-xl border-2 border-farmer-accent/30" />
                <button
                  onClick={reset}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            {!selectedCrop && (
              <p className="text-farmer-text/60 text-sm">Please select a crop type above first</p>
            )}

            {analyzing && (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="animate-spin w-6 h-6 text-farmer-accent" />
                <span className="text-farmer-text">{t('cropDoctor.analyzing')}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-sm text-farmer-text/60 mt-4">{t('cropDoctor.supportedCrops')}</p>
      </div>
    </div>
  )
}