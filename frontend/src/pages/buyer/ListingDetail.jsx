// ListingDetail - Fail-safe crop listing view with APMC benchmarks & Escrow checkout
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { 
  Loader2, MapPin, Star, ShieldCheck, Lock, ArrowLeft, 
  ShoppingBag, CheckCircle, AlertCircle, Plus, Minus
} from 'lucide-react'
import { getCropImage, getAPMCBenchmark } from '../../lib/cropImages'
import { useToast } from '../../components/ui/Toast'

const DEFAULT_ITEMS = [
  {
    id: 'cat-1',
    crop_type: 'Tomato (Grade A)',
    qty_avail: 850,
    price: 28,
    ai_grade: 'A',
    district: 'Bangalore Urban',
    farmers: { full_name: 'Ramesh Gowda', district: 'Bangalore Urban', trust_score: 96, is_verified: true }
  },
  {
    id: 'cat-2',
    crop_type: 'Onion (Red Nashik)',
    qty_avail: 1200,
    price: 32,
    ai_grade: 'A',
    district: 'Hubli',
    farmers: { full_name: 'Suresh Patil', district: 'Hubli', trust_score: 94, is_verified: true }
  },
  {
    id: 'cat-3',
    crop_type: 'Rice (Sona Masoori)',
    qty_avail: 2500,
    price: 44,
    ai_grade: 'A',
    district: 'Mandya',
    farmers: { full_name: 'Mahesh Gowda', district: 'Mandya', trust_score: 98, is_verified: true }
  },
  {
    id: 'cat-4',
    crop_type: 'Ragi (Organic)',
    qty_avail: 600,
    price: 36,
    ai_grade: 'A',
    district: 'Kolar',
    farmers: { full_name: 'Venkatappa K', district: 'Kolar', trust_score: 91, is_verified: true }
  },
  {
    id: 'cat-5',
    crop_type: 'Chilli (Byadgi Grade 1)',
    qty_avail: 400,
    price: 84,
    ai_grade: 'A',
    district: 'Dharwad',
    farmers: { full_name: 'Basavarajappa', district: 'Dharwad', trust_score: 95, is_verified: true }
  },
  {
    id: 'cat-6',
    crop_type: 'Potato (Hassan Premium)',
    qty_avail: 1500,
    price: 22,
    ai_grade: 'B',
    district: 'Hassan',
    farmers: { full_name: 'Manjunath H', district: 'Hassan', trust_score: 89, is_verified: true }
  },
  {
    id: 'cat-7',
    crop_type: 'Mango (Alphonso / Badami)',
    qty_avail: 750,
    price: 95,
    ai_grade: 'A',
    district: 'Kolar',
    farmers: { full_name: 'Anjanappa K', district: 'Kolar', trust_score: 97, is_verified: true }
  },
  {
    id: 'cat-8',
    crop_type: 'Coconut (Tiptur Tender)',
    qty_avail: 3000,
    price: 26,
    ai_grade: 'A',
    district: 'Tumkur',
    farmers: { full_name: 'Siddaiah T', district: 'Tumkur', trust_score: 92, is_verified: true }
  }
]

export default function ListingDetail() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { id } = useParams()
  const { success, error: showError } = useToast()
  
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(50)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    fetchListing()
  }, [id])

  const fetchListing = async () => {
    setLoading(true)
    let item = null

    // 1. Check local storage custom listings
    try {
      const stored = JSON.parse(localStorage.getItem('agrimart_custom_listings') || '[]')
      item = stored.find(s => s.id === id)
    } catch (e) {}

    // 2. Check default items list
    if (!item) {
      item = DEFAULT_ITEMS.find(d => d.id === id)
    }

    // 3. Fetch from Supabase if not found locally
    if (!item) {
      try {
        const { data, error } = await supabase
          .from('produce_listings')
          .select(`
            *,
            farmers(full_name, district, trust_score, is_verified)
          `)
          .eq('id', id)
          .single()

        if (!error && data) item = data
      } catch (err) {}
    }

    // Fallback item if id still not found
    if (!item) {
      item = DEFAULT_ITEMS[0]
    }

    setListing(item)
    setLoading(false)
  }

  const handleAddToCart = async () => {
    setAddingToCart(true)
    try {
      const cartItem = {
        id: `ord_${Date.now()}`,
        listing_id: listing.id,
        quantity: Number(quantity),
        total_cost: Number(quantity) * Number(listing.price),
        status: 'Pending',
        is_pooled: false,
        produce_listings: listing
      }

      // Save to local storage cart
      const stored = JSON.parse(localStorage.getItem('agrimart_cart_items') || '[]')
      stored.unshift(cartItem)
      localStorage.setItem('agrimart_cart_items', JSON.stringify(stored))

      success('🎉 Added to cart! Redirecting to cart checkout...')
      setTimeout(() => navigate('/buyer/cart', { replace: true }), 800)
    } catch (err) {
      showError(err.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
      </div>
    )
  }

  const cropImage = getCropImage(listing.crop_type)
  const apmc = getAPMCBenchmark(listing.crop_type, listing.price)
  const farmer = listing.farmers || { full_name: 'Verified Kisan', district: listing.district || 'Bangalore Urban', trust_score: 95 }
  const totalCost = Number(quantity) * Number(listing.price)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link 
        to="/buyer/market"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Produce Catalog
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Column: Image */}
        <div className="md:col-span-6 relative min-h-[320px] bg-slate-100">
          <img src={cropImage} alt={listing.crop_type} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-slate-950/80 backdrop-blur-md text-white rounded-full font-bold text-xs border border-white/20">
              Grade {listing.ai_grade || 'A'}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-2xl font-black">{listing.crop_type}</h1>
            <p className="text-xs text-slate-300 flex items-center gap-1 font-medium mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {farmer.district || listing.district}
            </p>
          </div>
        </div>

        {/* Right Column: Order Details */}
        <div className="md:col-span-6 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-baseline border-b border-slate-100 pb-4">
              <div>
                <span className="text-3xl font-black text-slate-900 font-mono">₹{listing.price}</span>
                <span className="text-xs text-slate-500 font-bold"> / kg</span>
              </div>
              {apmc && (
                <div className="text-right">
                  <span className="text-xs text-slate-400 line-through">Mandi Rate ₹{apmc.mandi}</span>
                  <span className="text-xs text-emerald-600 font-bold block">Save {apmc.savingsPct}% Direct</span>
                </div>
              )}
            </div>

            {/* Farmer Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Farmer Partner</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{farmer.full_name}</p>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl text-xs font-bold border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-current text-amber-500" /> {farmer.trust_score}% Trust
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">Select Quantity (kg):</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(10, quantity - 10))}
                  className="w-10 h-10 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-28 py-2 text-center bg-white border border-slate-300 rounded-xl font-mono font-bold text-lg text-slate-900"
                />

                <button
                  onClick={() => setQuantity(quantity + 10)}
                  className="w-10 h-10 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Total Cost Callout */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-900">Total Escrow Amount:</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">₹{totalCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {addingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
              Add to Cart & Lock Escrow Order →
            </button>

            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-500" /> Funds held safely in Escrow until delivery approval
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}