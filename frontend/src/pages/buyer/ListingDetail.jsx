// ListingDetail - Buyer's listing detail view with crop imagery, APMC Mandi benchmarks, and Escrow steps
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { 
  Loader2, MapPin, User, Star, Truck, Users, Tag, AlertCircle, 
  CheckCircle, Plus, Minus, ShieldCheck, Lock, ArrowLeft, TrendingDown, Building2, ShoppingBag
} from 'lucide-react'
import { getCropImage, getAPMCBenchmark } from '../../lib/cropImages'

export default function ListingDetail() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(50)
  const [addingToCart, setAddingToCart] = useState(false)
  const [joiningPool, setJoiningPool] = useState(false)

  useEffect(() => {
    fetchListing()
  }, [id])

  const fetchListing = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('produce_listings')
        .select(`
          *,
          farmers(full_name, district, trust_score, is_verified, land_size)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setListing(data)
    } catch (err) {
      console.error('Failed to fetch listing:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!profile?.buyer_id) return navigate('/login')
    setAddingToCart(true)
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          buyer_id: profile.buyer_id,
          listing_id: id,
          quantity: quantity,
          total_cost: quantity * listing.price,
          status: 'Pending',
          is_pooled: false
        })

      if (error) throw error
      alert('Order placed & added to cart! Proceeding to active orders.')
      navigate('/buyer/orders')
    } catch (err) {
      alert(err.message)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleJoinPool = async () => {
    if (!profile?.buyer_id) return navigate('/login')
    if (!listing.pooling_enabled) return

    const qty = prompt(`Enter quantity to contribute (kg). Pool threshold: ${listing.pooling_threshold || 500} kg`)
    if (!qty || parseFloat(qty) <= 0) return

    setJoiningPool(true)
    try {
      const { error } = await supabase
        .from('pooled_contributions')
        .insert({
          listing_id: id,
          buyer_id: profile.buyer_id,
          quantity: parseFloat(qty)
        })

      if (error) throw error
      alert('Successfully joined pool!')
      fetchListing()
    } catch (err) {
      alert(err.message)
    } finally {
      setJoiningPool(false)
    }
  }

  const maxQty = listing?.qty_avail || 0
  const cropImage = listing ? getCropImage(listing.crop_type) : ''
  const apmc = listing ? getAPMCBenchmark(listing.crop_type, listing.price) : null
  const farmer = listing?.farmers || { full_name: 'Verified Kisan', district: listing?.district || 'Karnataka', trust_score: 88, is_verified: true }

  const poolingThreshold = listing?.pooling_threshold || 500
  const pooledQty = listing?.qty_reserved || Math.round(poolingThreshold * 0.4)
  const poolProgress = Math.min(Math.round((pooledQty / poolingThreshold) * 100), 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="card text-center py-16">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Listing not found</h3>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/buyer/market')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Market Catalog
      </button>

      {/* Main Grid Header */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Column: Crop Image Banner */}
        <div className="relative min-h-[320px] bg-gray-100">
          <img src={cropImage} alt={listing.crop_type} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-full font-bold text-sm border border-white/20">
              {listing.crop_type}
            </span>
            {listing.ai_grade && (
              <span className="px-3 py-1 bg-emerald-500 text-white rounded-full font-bold text-xs shadow-md">
                Grade {listing.ai_grade} Premium
              </span>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <p className="text-2xl font-black">₹{listing.price} / kg</p>
            <p className="text-xs text-emerald-300 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" /> Direct from {farmer.district} mandi zone
            </p>
          </div>
        </div>

        {/* Right Column: Key Summary & Actions */}
        <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-gray-900">{listing.crop_type}</h1>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg">
                  {listing.qty_avail.toLocaleString()} kg available
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Listed by {farmer.full_name}</p>
            </div>

            {/* Mandi Benchmark Box */}
            {apmc && (
              <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-100">
                <div className="flex justify-between items-center text-xs text-emerald-900 mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" /> Mandi Benchmark
                  </span>
                  <span className="font-bold text-emerald-700">₹{apmc.benchmark}/kg</span>
                </div>
                <p className="text-xs text-emerald-700 font-medium">
                  {apmc.isLower ? `⚡ Current price is ${apmc.badgeText}!` : 'Fair market pricing.'}
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Select Order Quantity (kg)</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(10, quantity - 10))}
                  className="w-10 h-10 border border-gray-300 rounded-xl hover:bg-gray-100 flex items-center justify-center font-bold text-gray-700"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxQty}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="flex-1 text-center text-xl font-black border border-gray-300 rounded-xl px-4 py-2 text-gray-900"
                />
                <button
                  onClick={() => setQuantity(Math.min(maxQty, quantity + 10))}
                  className="w-10 h-10 border border-gray-300 rounded-xl hover:bg-gray-100 flex items-center justify-center font-bold text-gray-700"
                >
                  +
                </button>
              </div>
              <div className="flex justify-between text-xs text-gray-500 pt-1">
                <span>Total Amount:</span>
                <span className="font-black text-base text-gray-900">₹{(quantity * listing.price).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || quantity > maxQty}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {addingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buy Now with Escrow Protection'}
            </button>

            {listing.pooling_enabled && (
              <button
                onClick={handleJoinPool}
                disabled={joiningPool}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Users className="w-4 h-4" />
                <span>Join Group Buying Pool ({poolingThreshold} kg threshold)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Escrow State Machine Audit & Trust Protection */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-600" />
          AgriMart Smart Escrow Protection Workflow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1">
            <span className="font-bold text-emerald-800 flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[10px]">1</span>
              Funds Locked
            </span>
            <p className="text-emerald-950">Payment deposited into tamper-proof Escrow contract upon order confirmation.</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1">
            <span className="font-bold text-emerald-800 flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[10px]">2</span>
              Dispatch Tracked
            </span>
            <p className="text-emerald-950">Farmer uploads transport manifest and vehicle details.</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1">
            <span className="font-bold text-emerald-800 flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[10px]">3</span>
              Quality Check
            </span>
            <p className="text-emerald-950">Buyer verifies produce quality against AI Grade specifications upon receipt.</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1">
            <span className="font-bold text-emerald-800 flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[10px]">4</span>
              Payout Released
            </span>
            <p className="text-emerald-950">Escrow funds automatically transferred to farmer's verified bank account.</p>
          </div>
        </div>
      </div>
    </div>
  )
}