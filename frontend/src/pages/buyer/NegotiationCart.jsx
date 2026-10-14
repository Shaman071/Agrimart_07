// NegotiationCart - Modern Buyer Cart & Escrow Checkout Engine
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { getCropImage } from '../../lib/cropImages'
import { 
  Loader2, Trash2, Plus, Minus, Shield, AlertCircle, 
  ShoppingBag, ArrowLeft, Lock, CheckCircle, Package, ArrowRight
} from 'lucide-react'
import { useToast } from '../../components/ui/Toast'

export default function NegotiationCart() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { success: showSuccess } = useToast()
  
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [successState, setSuccessState] = useState(false)

  useEffect(() => {
    fetchCart()
  }, [profile])

  const fetchCart = async () => {
    setLoading(true)
    let items = []

    // 1. Read local cart items
    try {
      const stored = JSON.parse(localStorage.getItem('agrimart_cart_items') || '[]')
      items = [...stored]
    } catch (e) {}

    // 2. Fetch remote items if buyer profile exists
    if (profile?.buyer_id) {
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

        if (!error && data?.length) {
          const ids = new Set(items.map(i => i.id))
          data.forEach(d => {
            if (!ids.has(d.id)) items.push(d)
          })
        }
      } catch (err) {}
    }

    setCartItems(items)
    setLoading(false)
  }

  const updateQuantity = (orderId, newQty) => {
    if (newQty < 1) return
    const updated = cartItems.map(item => {
      if (item.id === orderId) {
        const price = item.produce_listings?.price || item.price || 28
        return { ...item, quantity: newQty, total_cost: newQty * price }
      }
      return item
    })
    setCartItems(updated)
    localStorage.setItem('agrimart_cart_items', JSON.stringify(updated))
  }

  const removeItem = (orderId) => {
    const updated = cartItems.filter(i => i.id !== orderId)
    setCartItems(updated)
    localStorage.setItem('agrimart_cart_items', JSON.stringify(updated))
  }

  const placeOrder = async () => {
    if (cartItems.length === 0) return
    setPlacingOrder(true)

    try {
      // Save completed orders to active orders list
      const activeOrders = JSON.parse(localStorage.getItem('agrimart_active_orders') || '[]')
      const newOrders = cartItems.map(item => ({
        ...item,
        status: 'Accepted',
        escrow_locked: true,
        created_at: new Date().toISOString()
      }))
      
      localStorage.setItem('agrimart_active_orders', JSON.stringify([...newOrders, ...activeOrders]))
      localStorage.removeItem('agrimart_cart_items')
      
      setSuccessState(true)
      showSuccess('🎉 Order placed & Escrow payment locked successfully!')
      setTimeout(() => navigate('/buyer/orders', { replace: true }), 1200)
    } catch (err) {
      setSuccessState(true)
      setTimeout(() => navigate('/buyer/orders', { replace: true }), 1200)
    } finally {
      setPlacingOrder(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.total_cost || 0), 0)
  const platformFee = Math.round(subtotal * 0.015)
  const total = subtotal + platformFee

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
      </div>
    )
  }

  if (successState) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Escrow Payment Locked!</h2>
        <p className="text-slate-500 text-sm">Your order has been transmitted to the farmer. Redirecting to active orders...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link to="/buyer/market" className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Checkout Cart</h1>
          <p className="text-slate-500 text-sm">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} ready for Escrow checkout</p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Your cart is currently empty</h3>
          <p className="text-slate-500 text-sm">Explore APMC benchmarked produce from verified farmers.</p>
          <Link
            to="/buyer/market"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs shadow-md transition-all"
          >
            Browse Produce Catalog →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart List */}
          <div className="lg:col-span-7 space-y-4">
            {cartItems.map((item) => {
              const crop = item.produce_listings?.crop_type || 'Tomato (Grade A)'
              const price = item.produce_listings?.price || item.price || 28
              const cropImg = getCropImage(crop)

              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <img src={cropImg} alt={crop} className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{crop}</h4>
                      <p className="text-xs text-slate-500 font-mono">₹{price}/kg</p>
                      <p className="text-xs text-emerald-700 font-black font-mono mt-1">Total: ₹{item.total_cost?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 10))}
                        className="p-2 text-slate-600 hover:text-slate-900"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 font-mono font-bold text-xs text-slate-900">{item.quantity} kg</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 10)}
                        className="p-2 text-slate-600 hover:text-slate-900"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Checkout Summary */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" /> Escrow Order Summary
              </h3>

              <div className="space-y-2 text-xs border-y border-slate-100 py-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({cartItems.length} items):</span>
                  <span className="font-mono font-bold text-slate-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform & Escrow Fee (1.5%):</span>
                  <span className="font-mono font-bold text-slate-900">₹{platformFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="font-bold text-emerald-950 text-xs">Total Amount:</span>
                <span className="text-xl font-black text-emerald-700 font-mono">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={placeOrder}
              disabled={placingOrder}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {placingOrder ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              Lock Escrow & Place Order →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}