// KisanVani Voice Action - Voice-first listing creation
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle, Trash2, Edit3 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function KisanVaniVoiceAction() {
  const { t } = useTranslation('farmer')
  const navigate = useNavigate()
  const { user } = useAuth()
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const startRecording = async () => {
    setError('')
    setTranscript('')
    setParsedData(null)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setRecording(true)
    } catch (err) {
      setError('Microphone access denied. Please enable microphone permissions.')
      console.error(err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const processAudio = async (audioBlob) => {
    setProcessing(true)
    try {
      // For demo: simulate STT with text input
      // In production: send audioBlob to Whisper API
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      // Mock: use text input for demo
      // const response = await fetch(`${API_BASE}/voice/parse-listing`, {
      //   method: 'POST',
      //   body: formData,
      //   headers: { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }
      // })
      
      // For now, simulate with a text area input (dev mode)
      setProcessing(false)
    } catch (err) {
      setError('Failed to process audio')
      setProcessing(false)
    }
  }

  const parseText = async (text) => {
    setProcessing(true)
    setError('')
    try {
      const session = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE}/voice/parse-listing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({ text, language: 'en' })
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Parsing failed')
      
      setParsedData(data)
      setTranscript(text)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const createListing = async () => {
    if (!parsedData) return
    
    setProcessing(true)
    try {
      const session = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE}/produce_listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({
          farmer_id: user.id,
          ...parsedData,
          is_active: true
        })
      })
      
      if (!response.ok) throw new Error('Failed to create listing')
      
      setSuccess(true)
      setTimeout(() => navigate('/farmer/inventory'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const reset = () => {
    setTranscript('')
    setParsedData(null)
    setError('')
    setSuccess(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="farmer-card text-center">
        <h1 className="text-2xl font-bold text-farmer-text mb-2">{t('kisanVani.title')}</h1>
        <p className="text-farmer-text/70">{t('kisanVani.subtitle')}</p>
        <p className="text-sm text-farmer-text/60 mt-2">{t('kisanVani.tips')}</p>
      </div>

      {/* Recording Interface */}
      <div className="farmer-card">
        {parsedData ? (
          // Show parsed data for confirmation
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-green-700 mb-3">
                <CheckCircle className="w-6 h-6" />
                <span className="font-semibold">{t('kisanVani.parsedData')}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-farmer-text/70">{t('kisanVani.cropType')}</p>
                  <p className="font-semibold text-farmer-text">{parsedData.crop_type}</p>
                </div>
                <div>
                  <p className="text-farmer-text/70">{t('kisanVani.quantity')}</p>
                  <p className="font-semibold text-farmer-text">{parsedData.qty_avail} kg</p>
                </div>
                <div>
                  <p className="text-farmer-text/70">{t('kisanVani.price')}</p>
                  <p className="font-semibold text-farmer-text">₹{parsedData.price}/kg</p>
                </div>
                <div>
                  <p className="text-farmer-text/70">{t('kisanVani.district')}</p>
                  <p className="font-semibold text-farmer-text">{parsedData.district}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={createListing}
                disabled={processing}
                className="farmer-btn flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin w-6 h-6" />
                    Creating...
                  </>
                ) : (
                  t('kisanVani.confirmListing')
                )}
              </button>
              <button
                onClick={reset}
                className="farmer-btn flex-1 bg-white text-farmer-text border-2 border-farmer-accent"
              >
                {t('kisanVani.tryAgain')}
              </button>
            </div>
          </div>
        ) : (
          // Recording state
          <div className="text-center space-y-6">
            <div className="relative">
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={processing}
                className={`relative w-32 h-32 mx-auto rounded-full transition-all ${
                  recording
                    ? 'bg-red-500 voice-recording shadow-[0_0_0_4px_rgba(239,68,68,0.4)]'
                    : 'bg-farmer-accent hover:bg-yellow-600 shadow-lg'
                }`}
              >
                {recording ? (
                  <MicOff className="w-12 h-12 text-white mx-auto" />
                ) : (
                  <Mic className="w-12 h-12 text-white mx-auto" />
                )}
              </button>
              {recording && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                  {t('kisanVani.recording')}
                </div>
              )}
            </div>

            <p className="text-farmer-lg text-farmer-text">
              {recording ? t('kisanVani.recording') : t('kisanVani.startRecording')}
            </p>

            {/* Dev Mode: Text Input for testing */}
            <div className="border-t border-farmer-accent/30 pt-6">
              <p className="text-sm text-farmer-text/70 mb-3">Dev Mode: Type transcript to test</p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="e.g., I have 500 kg tomato at 25 rupees per kg in Bangalore"
                className="input-field min-h-[80px] text-farmer-text"
                rows={3}
              />
              <button
                onClick={() => parseText(transcript)}
                disabled={processing || !transcript.trim()}
                className="farmer-btn w-full mt-3"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin w-6 h-6" />
                    {t('kisanVani.processing')}
                  </>
                ) : 'Parse Text'}
              </button>
            </div>

            <p className="text-sm text-farmer-text/60">{t('kisanVani.supportedLanguages')}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>Listing created successfully! Redirecting...</span>
          </div>
        )}
      </div>
    </div>
  )
}