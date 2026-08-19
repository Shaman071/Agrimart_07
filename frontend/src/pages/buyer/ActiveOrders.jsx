// ActiveOrders - Buyer's order tracking with realtime
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, Package, Truck, MapPin, Clock, CheckCircle, AlertCircle, Eye, User, Calendar } from 'lucide-react'

const STATUS_ORDER = ['Pending', 'Accepted', 'Dispatched', 'Completed', 'Disputed']
const STATUS_ICONS = {
  Pending: Clock,
  Accepted: CheckCircle,
  Dispatched: Truck,
  Completed: CheckCircle,
  Disputed: AlertCircle,
}

export default function ActiveOrders() {
  const { t } = useTranslation('common')
  const { profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
    // Subscribe to realtime updates
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `buyer_id=eq.${profile?.buyer_id}` },
        (payload) => {
          console.log('Order update:', payload)
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile])

  const fetchOrders = async () => {
    if (!profile?.buyer_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          produce_listings!inner(crop_type, price, farmers!inner(full_name, district)),
          transports(driver, plate_num, dispatch)
        `)
        .eq('buyer_id', profile.buyer_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Accepted': return 'bg-blue-100 text-blue-800'
      case 'Dispatched': return 'bg-purple-100 text-purple-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Disputed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgress = (status) => {
    const index = STATUS_ORDER.indexOf(status)
    return ((index + 1) / STATUS_ORDER.length) * 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
          <a href="/buyer/market" className="btn-primary inline-flex">Browse Market</a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const listing = order.produce_listings
            const farmer = listing.farmers
            const transport = order.transports
            const status = order.status
            const Icon = STATUS_ICONS[status] || Clock
            const progress = getProgress(status)

            return (
              <div key={order.id} className="card" onClick={() => setSelectedOrder(order)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{listing.crop_type}</p>
                      <p className="text-sm text-gray-500">
                        {order.quantity} kg • ₹{order.total_cost} • {farmer.full_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                      {status}
                    </span>
                    <Eye className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    {STATUS_ORDER.map((s, i) => (
                      <span key={s} className={i <= STATUS_ORDER.indexOf(status) ? 'font-medium text-primary-600' : ''}>
                        {s.charAt(0)}
                      </span>
                    ))}
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Transport Info */}
                {transport && status !== 'Pending' && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Driver</p>
                        <p className="font-medium">{transport.driver || 'Assigned'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Vehicle</p>
                        <p className="font-medium">{transport.plate_num || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-medium capitalize">{transport.dispatch?.toLowerCase() || 'picked up'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dispute Button */}
                {['Accepted', 'Dispatched'].includes(status) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); alert('Dispute feature - redirects to dispute form') }}
                    className="mt-3 w-full btn-secondary text-sm"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Raise Dispute
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p>{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Crop</p>
                  <p className="font-medium">{selectedOrder.produce_listings.crop_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p>{selectedOrder.quantity} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price/kg</p>
                  <p>₹{selectedOrder.produce_listings.price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-semibold text-lg">₹{selectedOrder.total_cost}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Farmer</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedOrder.produce_listings.farmers.full_name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {selectedOrder.produce_listings.farmers.district}
                    </p>
                  </div>
                </div>
              </div>

              {selectedOrder.transports && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Delivery</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Driver</p>
                      <p>{selectedOrder.transports.driver || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Vehicle</p>
                      <p>{selectedOrder.transports.plate_num || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="capitalize">{selectedOrder.transports.dispatch?.toLowerCase()}</p>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={() => setSelectedOrder(null)} className="btn-secondary w-full mt-4">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}