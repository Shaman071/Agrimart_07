// ListingDetail - Buyer's listing detail view
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, MapPin, User, Star, Truck, Users, Tag, AlertCircle, CheckCircle, Plus, Minus } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ListingDetail() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [joiningPool, setJoiningPool] = useState(false)
  const [marketRate, setMarketRate] = useState(null)

  useEffect(() => {
    fetchListing()
    fetchMarketRate()
  }, [id])

  const fetchListing = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('produce_listings')
        .select(`
          *,
          farmers!inner(full_name, district, trust_score, is_verified, land_size)
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

  const fetchMarketRate = async () => {
    // Mock - in production call /market/apmc-rates
    setMarketRate({ modal: 28, min: 22, max: 35 })
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
      alert('Added to cart! Check your cart to place order.')
      navigate('/buyer/cart')
    } catch (err) {
      alert(err.message)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleJoinPool = async () => {
    if (!profile?.buyer_id) return navigate('/login')
    if (!listing.pooling_enabled) return

    const qty = prompt(`Enter quantity to contribute (kg). Pool threshold: ${listing.pooling_threshold} kg`)
    if (!qty) return

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary-600" />
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

  const farmer = listing.farmers

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{listing.crop_type}</h1>
          <p className="text-gray-500">by {farmer.full_name} • {farmer.district}</p>
        </div>
        {listing.ai_grade && (
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            listing.ai_grade === 'A' ? 'bg-green-100 text-green-800' :
            listing.ai_grade === 'B' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            Grade {listing.ai_grade}
          </span>
        )}
      </div>

      {/* Main Card */}
      <div className="card">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price & Quantity */}
          <div className="space-y-4">
            <div className="bg-primary-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Price per kg</p>
              <p className="text-3xl font-bold text-gray-900">₹{listing.price}</p>
              {marketRate && (
                <p className="text-sm text-gray-500 mt-1">
                  Market rate: ₹{marketRate.modal}/kg (₹{marketRate.min}-₹{marketRate.max})
                </p>
              )}
            </div>

            <div className="border rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Quantity (kg)</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border rounded-lg hover:bg-gray-100 flex items-center justify-center"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxQty}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="flex-1 text-center text-xl font-medium border rounded-lg px-4 py-2"
                />
                <button
                  onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                  className="w-10 h-10 border rounded-lg hover:bg-gray-100 flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Available: {listing.qty_avail} kg</p>
              <p className="text-lg font-semibold text-gray-900 mt-2">Total: ₹{quantity * listing.price}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || quantity > maxQty}
                className="btn-primary flex-1"
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              {listing.pooling_enabled && (
                <button
                  onClick={handleJoinPool}
                  disabled={joiningPool}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Join Pool
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Available</p>
                <p className="text-xl font-bold">{listing.qty_avail} kg</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Reserved</p>
                <p className="text-xl font-bold">{listing.qty_reserved} kg</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">Farmer Details</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium">{farmer.full_name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {farmer.district}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Trust: {farmer.trust_score}
                    </span>
                    {farmer.is_verified && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {listing.pooling_enabled && (
              <div className="border-t pt-4 bg-blue-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-blue-700 mb-2">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">Group Buying Enabled</span>
                </div>
                <p className="text-sm text-blue-700">
                  Pool threshold: {listing.pooling_threshold} kg. Join with other buyers to unlock wholesale pricing!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* APMC Benchmark */}
      {marketRate && (
        <div className="card border-l-4 border-primary-500">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            APMC Benchmark Price
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm text-gray-500">Min</p>
              <p className="text-xl font-bold">₹{marketRate.min}</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-3">
              <p className="text-sm text-primary-700">Modal</p>
              <p className="text-xl font-bold text-primary-700">₹{marketRate.modal}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm text-gray-500">Max</p>
              <p className="text-xl font-bold">₹{marketRate.max}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}