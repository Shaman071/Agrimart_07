// NegotiationCart - Buyer's cart and order placement
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, Trash2, Plus, Minus, CreditCard, Truck, Shield, AlertCircle, CheckCircle } from 'lucide-react'

export default function NegotiationCart() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)

  useEffect(() => {
    fetchCart()
  }, [profile])

  const fetchCart = async () => {
    if (!profile?.buyer_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          produce_listings!inner(
            crop_type, price, qty_avail, farmers!inner(full_name, district)
          )
        `)
        .eq('buyer_id', profile.buyer_id)
        .eq('status', 'Pending')
        .eq('is_pooled', false)

      if (error) throw error
      setCartItems(data || [])
    } catch (err) {
      console.error('Failed to fetch cart:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (orderId, newQty) => {
    if (newQty < 1) return
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          quantity: newQty,
          total_cost: newQty * cartItems.find(i => i.id === orderId).produce_listings.price
        })
        .eq('id', orderId)

      if (error) throw error
      fetchCart()
    } catch (err) {
      console.error('Failed to update quantity:', err)
    }
  }

  const removeItem = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error
      fetchCart()
    } catch (err) {
      console.error('Failed to remove item:', err)
    }
  }

  const placeOrder = async () => {
    if (cartItems.length === 0) return
    setPlacingOrder(true)
    try {
      // In production: create Razorpay order, redirect to payment
      // For now: just mark as placed (status stays Pending until payment)
      alert('Order placed! In production, this would redirect to Razorpay for payment.')
      navigate('/buyer/orders')
    } catch (err) {
      alert(err.message)
    } finally {
      setPlacingOrder(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.total_cost), 0)
  const platformFee = Math.round(subtotal * 0.02) // 2% platform fee
  const total = subtotal + platformFee

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Cart ({cartItems.length} items)</h1>

      {cartItems.length === 0 ? (
        <div className="card text-center py-16">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-6">Browse the market and add items to your cart</p>
          <a href="/buyer/market" className="btn-primary inline-flex">
            Continue Shopping
          </a>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="card overflow-hidden">
            <div className="divide-y">
              {cartItems.map((item) => {
                const listing = item.produce_listings
                const farmer = listing.farmers
                const maxQty = listing.qty_avail
                
                return (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                          {listing.crop_type}
                        </span>
                        <span className="text-sm text-gray-500">by {farmer.full_name}</span>
                      </div>
                      <p className="text-sm text-gray-500">{farmer.district} • ₹{listing.price}/kg</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={maxQty}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center border-x py-1 focus:outline-none"
                        />
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= maxQty}
                          className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <span className="font-semibold text-gray-900 w-24 text-right">
                        ₹{item.total_cost}
                      </span>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="card">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal ({cartItems.length} items)</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform Fee (2%)</span>
                <span>₹{platformFee}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-semibold text-lg">₹{total}</span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-green-50 rounded-xl">
              <div className="flex items-center space-x-2 text-green-700 mb-2">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Escrow Protection</span>
              </div>
              <p className="text-sm text-green-700">
                Your payment is held securely in escrow until delivery is confirmed.
                Funds are released to the farmer only after you receive the produce.
              </p>
            </div>

            <button
              onClick={placeOrder}
              disabled={placingOrder || cartItems.length === 0}
              className="btn-primary w-full mt-4 py-3 text-lg"
            >
              {placingOrder ? 'Processing...' : `Place Order - ₹${total}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}