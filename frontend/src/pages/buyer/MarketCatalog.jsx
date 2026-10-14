// MarketCatalog - Modern Unified Marketplace with Rich Crops, Voice Search & 1-to-1 Farmer Direct Connect
import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Loader2, Filter, X, Users, MapPin, Search, 
  SlidersHorizontal, Star, Mic, MicOff, Sparkles, Building2, ShoppingBag, 
  TrendingDown, TrendingUp, CheckCircle, ShieldCheck, ArrowUpRight, MessageSquare, Phone
} from 'lucide-react'
import { useToast } from '../../components/ui/Toast'
import { getCropImage, getAPMCBenchmark } from '../../lib/cropImages'
import FarmerConnectModal from '../../components/farmer/FarmerConnectModal'
import AgriGeminiVoiceAssistant from '../../components/ai/AgriGeminiVoiceAssistant'

const CROPS = [
  'Tomato', 'Onion', 'Potato', 'Rice', 'Wheat', 'Maize', 'Ragi',
  'Coconut', 'Banana', 'Mango', 'Chilli', 'Cabbage', 'Cauliflower',
  'Brinjal', 'Okra', 'Groundnut', 'Soybean'
]

const DISTRICTS = [
  'Bangalore Urban', 'Bangalore Rural', 'Mysore', 'Hubli', 'Dharwad',
  'Mangalore', 'Belgaum', 'Raichur', 'Chitradurga', 'Shimoga', 'Tumkur', 'Kolar', 'Mandya'
]

const DEFAULT_CATALOG = [
  {
    id: 'cat-1',
    crop_type: 'Tomato (Grade A)',
    qty_avail: 850,
    price: 28,
    ai_grade: 'A',
    is_active: true,
    district: 'Bangalore Urban',
    pooling_enabled: false,
    farmers: { full_name: 'Ramesh Gowda', district: 'Bangalore Urban', trust_score: 96, is_verified: true }
  },
  {
    id: 'cat-2',
    crop_type: 'Onion (Red Nashik)',
    qty_avail: 1200,
    price: 32,
    ai_grade: 'A',
    is_active: true,
    district: 'Hubli',
    pooling_enabled: true,
    farmers: { full_name: 'Suresh Patil', district: 'Hubli', trust_score: 94, is_verified: true }
  },
  {
    id: 'cat-3',
    crop_type: 'Rice (Sona Masoori)',
    qty_avail: 2500,
    price: 44,
    ai_grade: 'A',
    is_active: true,
    district: 'Mandya',
    pooling_enabled: true,
    farmers: { full_name: 'Mahesh Gowda', district: 'Mandya', trust_score: 98, is_verified: true }
  },
  {
    id: 'cat-4',
    crop_type: 'Ragi (Organic)',
    qty_avail: 600,
    price: 36,
    ai_grade: 'A',
    is_active: true,
    district: 'Kolar',
    pooling_enabled: false,
    farmers: { full_name: 'Venkatappa K', district: 'Kolar', trust_score: 91, is_verified: true }
  },
  {
    id: 'cat-5',
    crop_type: 'Chilli (Byadgi Grade 1)',
    qty_avail: 400,
    price: 84,
    ai_grade: 'A',
    is_active: true,
    district: 'Dharwad',
    pooling_enabled: false,
    farmers: { full_name: 'Basavarajappa', district: 'Dharwad', trust_score: 95, is_verified: true }
  },
  {
    id: 'cat-6',
    crop_type: 'Potato (Hassan Premium)',
    qty_avail: 1500,
    price: 22,
    ai_grade: 'B',
    is_active: true,
    district: 'Hassan',
    pooling_enabled: false,
    farmers: { full_name: 'Manjunath H', district: 'Hassan', trust_score: 89, is_verified: true }
  }
]

export default function MarketCatalog() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  
  const [allListings, setAllListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isVoiceSearching, setIsVoiceSearching] = useState(false)
  const [connectModalItem, setConnectModalItem] = useState(null)
  
  const [filters, setFilters] = useState({
    crop: '',
    district: '',
    minPrice: '',
    maxPrice: '',
    grade: '',
    pooling: false,
    sortBy: 'newest',
  })
  const [showFilters, setShowFilters] = useState(false)
  const recognitionRef = useRef(null)
  const latestSpokenRef = useRef('')

  useEffect(() => {
    fetchListings()
  }, [])

  // Smart Voice Search Parsing Engine
  const processSpokenVoiceQuery = (rawText) => {
    if (!rawText) return
    const textLower = rawText.toLowerCase().trim()
    
    // Check if user spoke a crop name
    const cropsList = ['tomato', 'tomatoes', 'potato', 'potatoes', 'onion', 'onions', 'rice', 'ragi', 'chilli', 'chili', 'wheat', 'mango', 'coconut', 'banana']
    let foundCrop = ''
    for (const c of cropsList) {
      if (textLower.includes(c)) {
        foundCrop = c.replace(/s$/, '') // tomato, potato, onion
        break
      }
    }

    if (foundCrop) {
      setSearchQuery(foundCrop)
      success(`🎤 Voice Search filtered for "${foundCrop}"`)
      return
    }

    // Otherwise clean out conversational filler words
    const cleaned = textLower
      .replace(/\b(find|show|me|search|i|want|need|get|buy|cheapest|cheap|price|under|rs|rupees|in|the|a|for|of|crops|produce)\b/g, '')
      .trim()

    const finalQuery = cleaned || rawText
    setSearchQuery(finalQuery)
    success(`🎤 Voice Search: "${finalQuery}"`)
  }

  // Web Speech API Initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = true
      rec.lang = 'en-IN'

      rec.onresult = (event) => {
        let currentTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript
        }
        if (currentTranscript.trim()) {
          setSearchQuery(currentTranscript)
          latestSpokenRef.current = currentTranscript
        }
      }

      rec.onend = () => {
        setIsVoiceSearching(false)
        if (latestSpokenRef.current.trim()) {
          processSpokenVoiceQuery(latestSpokenRef.current)
          latestSpokenRef.current = ''
        }
      }

      rec.onerror = () => setIsVoiceSearching(false)
      recognitionRef.current = rec
    }
  }, [])

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert('Voice search requires Google Chrome or Microsoft Edge.')
      return
    }
    if (isVoiceSearching) {
      recognitionRef.current.stop()
      setIsVoiceSearching(false)
    } else {
      setSearchQuery('')
      latestSpokenRef.current = ''
      recognitionRef.current.start()
      setIsVoiceSearching(true)
    }
  }

  const fetchListings = async () => {
    setLoading(true)
    let fetched = []
    
    try {
      const stored = JSON.parse(localStorage.getItem('agrimart_custom_listings') || '[]')
      fetched = [...stored]
    } catch (e) {}

    DEFAULT_CATALOG.forEach(cat => {
      if (!fetched.some(f => f.id === cat.id)) {
        fetched.push(cat)
      }
    })

    setAllListings(fetched)
    setLoading(false)
  }

  const listings = useMemo(() => {
    let results = [...allListings]

    if (filters.crop) {
      results = results.filter(l => l.crop_type.toLowerCase().includes(filters.crop.toLowerCase()))
    }
    if (filters.district) {
      results = results.filter(l => (l.district || l.farmers?.district || '').toLowerCase().includes(filters.district.toLowerCase()))
    }
    if (filters.minPrice) {
      results = results.filter(l => Number(l.price) >= Number(filters.minPrice))
    }
    if (filters.maxPrice) {
      results = results.filter(l => Number(l.price) <= Number(filters.maxPrice))
    }
    if (filters.grade) {
      results = results.filter(l => l.ai_grade === filters.grade)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      results = results.filter(l => {
        const cropName = l.crop_type.toLowerCase()
        const distName = (l.district || l.farmers?.district || '').toLowerCase()
        const farmerName = (l.farmers?.full_name || '').toLowerCase()
        
        return cropName.includes(q) || distName.includes(q) || farmerName.includes(q) ||
               (q.includes('tomato') && cropName.includes('tomato')) ||
               (q.includes('potato') && cropName.includes('potato')) ||
               (q.includes('onion') && cropName.includes('onion')) ||
               (q.includes('rice') && cropName.includes('rice'))
      })
    }

    if (activeTab === 'pooling') results = results.filter(l => l.pooling_enabled)
    else if (activeTab === 'b2b') results = results.filter(l => l.qty_avail >= 500)
    else if (activeTab === 'b2c') results = results.filter(l => l.qty_avail < 500)

    return results
  }, [allListings, searchQuery, activeTab, filters])

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Top Banner & Voice Search Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Direct From Farmers • APMC Benchmarked
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              AgriMart Direct Produce Catalog
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Wholesale farm produce with 100% Escrow security and APMC rate benchmarking across 30 Karnataka districts.
            </p>
          </div>

          {/* Search Input with Voice Mic */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={isVoiceSearching ? "Listening to your voice..." : "Search crops, districts, farmers..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 bg-slate-950 border text-white placeholder-slate-500 rounded-2xl text-sm focus:outline-none transition-all ${
                  isVoiceSearching ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-800 focus:ring-2 focus:ring-emerald-500'
                }`}
              />

              {/* Functional Voice Mic Button */}
              <button
                onClick={toggleVoiceSearch}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                  isVoiceSearching ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Voice Search Crops (Speak tomato, potato, etc.)"
              >
                {isVoiceSearching ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'
            }`}
          >
            All Produce ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('pooling')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pooling' ? 'bg-purple-600 text-white shadow-md' : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}
          >
            <Users className="w-4 h-4 text-purple-500" /> Group Buying Pools
          </button>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 self-start lg:self-auto"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filter Options
        </button>
      </div>

      {/* Quick Voice Prompt Shortcuts */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar text-xs">
        <span className="font-bold text-slate-400 shrink-0">Try Voice Search:</span>
        {["Tomato", "Potato", "Onion", "Rice", "Bangalore", "Hassan"].map((tag) => (
          <button
            key={tag}
            onClick={() => processSpokenVoiceQuery(tag)}
            className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-700 font-bold rounded-full transition-all shrink-0"
          >
            🔍 "{tag}"
          </button>
        ))}
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="px-3 py-1 bg-rose-50 text-rose-600 font-bold rounded-full border border-rose-200 hover:bg-rose-100 text-xs shrink-0"
          >
            Clear Search ✖
          </button>
        )}
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((item) => {
            const cropImg = getCropImage(item.crop_type)
            const farmer = item.farmers || { full_name: 'Ramesh Gowda', district: item.district || 'Bangalore Urban', trust_score: 95 }

            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img src={cropImg} alt={item.crop_type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-slate-950/80 backdrop-blur-md text-white rounded-full text-[11px] font-black">
                        Grade {item.ai_grade || 'A'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-black text-lg drop-shadow-md">{item.crop_type}</h3>
                      <p className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" /> {farmer.district}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-black text-slate-900 font-mono">₹{item.price}</span>
                        <span className="text-xs text-slate-500 font-semibold"> / kg</span>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">Stock: <strong className="text-slate-900 font-mono">{item.qty_avail} kg</strong></span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-bold">Farmer: {farmer.full_name}</span>
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-current" /> {farmer.trust_score}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct 1-to-1 Chat/Call Action */}
                <div className="p-5 pt-0 space-y-2">
                  <button
                    onClick={() => setConnectModalItem(item)}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-colors border border-emerald-200"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Chat / Call Farmer Direct
                  </button>

                  <Link
                    to={`/buyer/listing/${item.id}`}
                    className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1 transition-colors shadow-sm"
                  >
                    View Details & Buy →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 1-to-1 Buyer Farmer Chat & Call System Modal */}
      {connectModalItem && (
        <FarmerConnectModal
          listing={connectModalItem}
          farmer={connectModalItem.farmers}
          onClose={() => setConnectModalItem(null)}
        />
      )}

      {/* Universal AgriGemini Voice Assistant */}
      <AgriGeminiVoiceAssistant userRole="buyer" />
    </div>
  )
}