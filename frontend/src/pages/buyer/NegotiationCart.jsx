// NegotiationCart - Buyer's cart and order placement with modern UI
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { getCropImage } from '../../lib/cropImages'
import { 
  Loader2, Trash2, Plus, Minus, Shield, AlertCircle, 
  ShoppingBag, ArrowLeft, Lock, CheckCircle, Package
} from 'lucide-react'

export default function NegotiationCart() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (profile?.buyer_id) fetchCart()
    else setLoading(false)
  }, [profile?.buyer_id])

  const fetchCart = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          produce_listings(
            id, crop_type, price, qty_avail,
            farmers(full_name, district)
          )
        `)
        .eq('buyer_id', profile.buyer_id)
        .eq('status', 'Pending')
        .eq('is_pooled', false)

      if (error) throw error
      setCartItems(data || [])
    } catch (err) {
      console.error('Failed to fetch cart:', err)
      setError('Failed to load cart. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (orderId, newQty) => {
    if (newQty < 1) return
    const item = cartItems.find(i => i.id === orderId)
    if (!item) return
    const newTotal = newQty * (item.produce_listings?.price || 0)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ quantity: newQty, total_cost: newTotal })
        .eq('id', orderId)
      if (error) throw error
      // Optimistic update
      setCartItems(prev => prev.map(i => 
        i.id === orderId ? { ...i, quantity: newQty, total_cost: newTotal } : i
      ))
    } catch (err) {
      console.error('Failed to update quantity:', err)
    }
  }

  const removeItem = async (orderId) => {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId)
      if (error) throw error
      setCartItems(prev => prev.filter(i => i.id !== orderId))
    } catch (err) {
      console.error('Failed to remove item:', err)
    }
  }

  const placeOrder = async () => {
    if (cartItems.length === 0) return
    setPlacingOrder(true)
    setError('')
    try {
      // Mark orders as Accepted (escrow locked state)
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Accepted' })
        .in('id', cartItems.map(i => i.id))

      if (error) throw error

      setSuccess(true)
      setTimeout(() => navigate('/buyer/orders'), 1800)
    } catch (err) {
      setError(err.message || 'Failed to place order.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.total_cost || 0), 0)
  const platformFee = Math.round(subtotal * 0.02)
  const total = subtotal + platformFee

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
          <p className="text-gray-500 text-sm">Loading your cart...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center h-64 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-9 h-9 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Order Placed!</h2>
        <p className="text-gray-600">Your payment is held in escrow. Redirecting to orders...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/buyer/market" className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Your Cart</h1>
          <p className="text-gray-500 text-sm">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm text-center py-20 px-6">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-8">Browse fresh produce directly from verified Karnataka farmers</p>
          <Link to="/buyer/market" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition-all">
            Explore Market Catalog →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const listing = item.produce_listings
              const farmer = listing?.farmers
              const cropImage = getCropImage(listing?.crop_type)
              const maxQty = listing?.qty_avail || 9999

              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {/* Crop image */}
                    <img 
                      src={cropImage} 
                      alt={listing?.crop_type} 
                      className="w-20 h-20 rounded-xl object-cover border border-gray-100 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-black text-gray-900 text-lg leading-tight">{listing?.crop_type}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            by {farmer?.full_name || 'Verified Kisan'} • {farmer?.district || 'Karnataka'}
                          </p>
                          <p className="text-sm font-bold text-emerald-700 mt-1">₹{listing?.price}/kg</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Qty selector */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-700" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={maxQty}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-14 text-center text-sm font-bold border-x border-gray-200 py-2 focus:outline-none"
                          />
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= maxQty}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        <span className="font-black text-gray-900 text-lg">
                          ₹{(Number(item.total_cost) || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 sticky top-4">
              <h2 className="font-black text-gray-900 text-lg">Order Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee (2%)</span>
                  <span>₹{platformFee.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-black text-gray-900 text-base">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Escrow Protection Banner */}
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-800 mb-1.5">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm">Escrow Protected</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Payment is held securely. Released to farmer only after you confirm delivery & quality.
                </p>
              </div>

              <button
                onClick={placeOrder}
                disabled={placingOrder || cartItems.length === 0}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Place Order — ₹{total.toLocaleString()}
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                By placing order, you agree to escrow payment terms
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}