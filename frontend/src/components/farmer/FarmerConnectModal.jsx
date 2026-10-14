// FarmerConnectModal - 1-to-1 Buyer-Farmer Chat & Audio/Video Call System with Intelligent Conversational Engine
import { useState, useEffect, useRef } from 'react'
import { 
  MessageSquare, Phone, Video, Mic, MicOff, Volume2, VolumeX, 
  Send, X, CheckCheck, User, Star, MapPin, ShieldCheck, Sparkles, PhoneOff
} from 'lucide-react'

const CROP_PRICES = {
  tomato: { price: 28, unit: 'kg', grade: 'Grade A', district: 'Bangalore Urban' },
  potato: { price: 22, unit: 'kg', grade: 'Hassan Premium', district: 'Hassan' },
  onion: { price: 32, unit: 'kg', grade: 'Red Nashik', district: 'Hubli' },
  rice: { price: 44, unit: 'kg', grade: 'Sona Masoori', district: 'Mandya' },
  ragi: { price: 36, unit: 'kg', grade: 'Organic', district: 'Kolar' },
  chilli: { price: 84, unit: 'kg', grade: 'Byadgi Grade 1', district: 'Dharwad' },
  mango: { price: 95, unit: 'kg', grade: 'Alphonso', district: 'Kolar' },
  coconut: { price: 26, unit: 'piece', grade: 'Tiptur Tender', district: 'Tumkur' }
}

export default function FarmerConnectModal({ listing, farmer, onClose }) {
  const [activeTab, setActiveTab] = useState('chat') // 'chat' or 'call'
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isCalling, setIsCalling] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callTranscript, setCallTranscript] = useState('')
  const [isListeningMic, setIsListeningMic] = useState(false)
  
  const timerRef = useRef(null)
  const chatEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const latestSpokenTextRef = useRef('')

  const farmerInfo = farmer || listing?.farmers || {
    full_name: 'Ramesh Gowda',
    district: listing?.district || 'Bangalore Urban',
    trust_score: 96,
    is_verified: true,
    phone: '+91 98450 12345'
  }

  const defaultCrop = listing?.crop_type || 'Tomato (Grade A)'

  useEffect(() => {
    setMessages([
      {
        id: 1,
        sender: 'farmer',
        text: `Namaskara! I am ${farmerInfo.full_name}. Thank you for your interest in my harvest. How can I help you today?`,
        time: 'Just now'
      }
    ])
  }, [listing])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Call timer logic
  useEffect(() => {
    if (isCalling) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
      setCallDuration(0)
    }
    return () => clearInterval(timerRef.current)
  }, [isCalling])

  // Speech Recognition for Chat Input (Auto-Send on Speak)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = true
      rec.lang = 'en-IN'

      rec.onresult = (e) => {
        const text = e.results[0][0].transcript
        setInputMessage(text)
        latestSpokenTextRef.current = text
      }

      rec.onend = () => {
        setIsListeningMic(false)
        if (latestSpokenTextRef.current.trim()) {
          handleSendMessage(latestSpokenTextRef.current)
          latestSpokenTextRef.current = ''
        }
      }

      rec.onerror = () => setIsListeningMic(false)
      recognitionRef.current = rec
    }
  }, [])

  const toggleMicInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is supported in Google Chrome or Microsoft Edge.')
      return
    }
    if (isListeningMic) {
      recognitionRef.current.stop()
      setIsListeningMic(false)
    } else {
      setInputMessage('')
      latestSpokenTextRef.current = ''
      recognitionRef.current.start()
      setIsListeningMic(true)
    }
  }

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Intelligent Contextual Farmer Response Generator
  const generateFarmerResponse = (userText) => {
    const text = userText.toLowerCase()
    
    // Detect Crop in user query
    let detectedCrop = 'tomato'
    let cropDisplayName = defaultCrop

    for (const key of Object.keys(CROP_PRICES)) {
      if (text.includes(key)) {
        detectedCrop = key
        cropDisplayName = key.charAt(0).toUpperCase() + key.slice(1)
        break
      }
    }

    const cropDetail = CROP_PRICES[detectedCrop] || { price: 28, unit: 'kg', grade: 'Grade A', district: farmerInfo.district }

    // Detect Quantity in user query (e.g. 100kg, 500, 50)
    const qtyMatch = text.match(/(\d+)\s*(kg|kilos|tons)?/)
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : null

    if (qty) {
      const totalPrice = qty * cropDetail.price
      if (qty >= 500) {
        const discountedRate = cropDetail.price - 2
        const discountedTotal = qty * discountedRate
        return `Namaskara! For a bulk order of ${qty} ${cropDetail.unit} of ${cropDisplayName}, I can offer a direct bulk discount of ₹2/${cropDetail.unit} (₹${discountedRate}/${cropDetail.unit}). The total amount is ₹${discountedTotal.toLocaleString()} with free Escrow dispatch!`
      } else {
        return `Namaskara! For ${qty} ${cropDetail.unit} of ${cropDisplayName} (${cropDetail.grade}), my rate is ₹${cropDetail.price}/${cropDetail.unit}. The total amount is ₹${totalPrice.toLocaleString()}. I can pack and ship directly from my farm in ${cropDetail.district} within 24 hours!`
      }
    }

    if (text.includes('price') || text.includes('rate') || text.includes('cost') || text.includes('sell')) {
      return `My price for ${cropDisplayName} (${cropDetail.grade}) is ₹${cropDetail.price} per ${cropDetail.unit}. For orders above 500 kg, I offer an extra ₹2/kg discount!`
    }

    if (text.includes('photo') || text.includes('picture') || text.includes('image')) {
      return `I have updated high-definition harvest photos of my ${cropDisplayName} crop on AgriMart. The AI Quality grade is verified Grade-A!`
    }

    if (text.includes('delivery') || text.includes('transport') || text.includes('ship') || text.includes('time')) {
      return `Logistics transport will be handled via AgriMart Escrow fleets straight to your warehouse in 24 to 48 hours.`
    }

    return `Yes! My ${cropDisplayName} crop is freshly harvested in ${cropDetail.district}. Feel free to ask about custom quantities or dispatch dates.`
  }

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputMessage
    if (!text.trim()) return

    const userMsg = {
      id: Date.now(),
      sender: 'buyer',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInputMessage('')

    // Generate accurate farmer response
    setTimeout(() => {
      const reply = generateFarmerResponse(text)

      const farmerReply = {
        id: Date.now() + 1,
        sender: 'farmer',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, farmerReply])

      // Speak response using browser speech synth if speaker enabled
      if (window.speechSynthesis && isSpeakerOn) {
        window.speechSynthesis.cancel()
        const synth = new SpeechSynthesisUtterance(reply)
        synth.rate = 0.95
        window.speechSynthesis.speak(synth)
      }
    }, 600)
  }

  const startVoiceCall = () => {
    setActiveTab('call')
    setIsCalling(true)
    const greeting = `Namaskara! ${farmerInfo.full_name} speaking. I am listening! Ask me about my ${defaultCrop} harvest prices.`
    setCallTranscript(greeting)

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(greeting)
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  const endCall = () => {
    setIsCalling(false)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setActiveTab('chat')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full h-[620px] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 bg-emerald-500/30 rounded-2xl flex items-center justify-center border border-white/20 font-black text-lg">
                {farmerInfo.full_name.charAt(0)}
              </div>
              <span className="w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full absolute -bottom-0.5 -right-0.5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base leading-tight">{farmerInfo.full_name}</h3>
                <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-400/30">
                  Verified Farmer
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-400" /> {farmerInfo.district} • <Star className="w-3 h-3 text-amber-400 fill-current inline" /> {farmerInfo.trust_score}% Trust Score
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCalling ? (
              <button
                onClick={startVoiceCall}
                className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-md transition-all flex items-center gap-1.5 text-xs"
              >
                <Phone className="w-4 h-4" /> Direct Call
              </button>
            ) : (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-mono font-bold border border-amber-500/30 animate-pulse">
                LIVE: {formatTimer(callDuration)}
              </span>
            )}

            <button
              onClick={() => { endCall(); onClose() }}
              className="p-2 text-slate-300 hover:text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Live Buyer-Farmer Chat
          </button>
          <button
            onClick={() => { if (!isCalling) startVoiceCall(); else setActiveTab('call'); }}
            className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'call'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Phone className="w-4 h-4" /> 1-to-1 Audio Call {isCalling && `(${formatTimer(callDuration)})`}
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col justify-between p-4 bg-slate-50/50 overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'buyer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs font-medium space-y-1 shadow-sm ${
                      msg.sender === 'buyer'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className={`text-[10px] block text-right font-mono ${msg.sender === 'buyer' ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Action Preset Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-200/60 no-scrollbar">
              <button
                onClick={() => handleSendMessage(`i want to buy 100kg tomatoes at what price will you sell?`)}
                className="px-3 py-1 bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 rounded-full text-[11px] font-bold whitespace-nowrap"
              >
                🍅 100kg Tomatoes Price
              </button>
              <button
                onClick={() => handleSendMessage(`i want to buy 100kg of potatoes at what price will you sell?`)}
                className="px-3 py-1 bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 rounded-full text-[11px] font-bold whitespace-nowrap"
              >
                🥔 100kg Potatoes Price
              </button>
              <button
                onClick={() => handleSendMessage(`What is the estimated delivery time to my warehouse?`)}
                className="px-3 py-1 bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 rounded-full text-[11px] font-bold whitespace-nowrap"
              >
                🚚 Dispatch Timeline
              </button>
            </div>

            {/* Message Input Box with Mic Auto-Send */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={toggleMicInput}
                className={`p-3 rounded-2xl transition-all border ${
                  isListeningMic ? 'bg-rose-600 text-white animate-pulse border-rose-500' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
                title="Speak message (Auto-sends when done)"
              >
                {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-600" />}
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isListeningMic ? "Listening to your voice... (Will auto-send)" : `Ask ${farmerInfo.full_name} about crops...`}
                className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
              <button
                onClick={() => handleSendMessage()}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-md transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Call Interface */
          <div className="flex-1 bg-slate-950 text-white p-8 flex flex-col justify-between items-center text-center relative overflow-hidden">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                <User className="w-12 h-12 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-black">{farmerInfo.full_name}</h3>
                <p className="text-xs text-slate-400">{farmerInfo.district} • Verified Kisan Supplier</p>
                <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-mono font-bold">
                  {isCalling ? `Connected • ${formatTimer(callDuration)}` : 'Connecting audio line...'}
                </span>
              </div>
            </div>

            {/* Simulated Live Audio Waveform Animation */}
            <div className="flex items-center gap-1.5 h-12">
              {[40, 70, 30, 90, 60, 100, 50, 80, 40, 75, 95, 30].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-emerald-400 rounded-full transition-all duration-300 animate-pulse"
                  style={{ height: `${isCalling ? h : 15}%` }}
                />
              ))}
            </div>

            <p className="text-xs text-slate-300 italic max-w-md bg-slate-900/80 p-3 rounded-2xl border border-white/10">
              "{callTranscript}"
            </p>

            {/* Call Action Bar */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-2xl border transition-all ${
                  isMuted ? 'bg-rose-500 text-white border-rose-400' : 'bg-slate-900 text-slate-300 border-white/10'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={endCall}
                className="p-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-2xl hover:scale-110 transition-all"
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`p-4 rounded-2xl border transition-all ${
                  isSpeakerOn ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 text-slate-300 border-white/10'
                }`}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
