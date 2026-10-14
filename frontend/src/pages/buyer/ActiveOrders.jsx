// ActiveOrders - Buyer's Order Tracking & Escrow Release Portal
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { 
  Loader2, Package, Truck, MapPin, Clock, CheckCircle, 
  AlertCircle, Eye, User, Calendar, ShieldCheck, ArrowRight
} from 'lucide-react'
import { getCropImage } from '../../lib/cropImages'
import { useToast } from '../../components/ui/Toast'

const STATUS_STAGES = ['Pending', 'Accepted', 'Dispatched', 'Completed']

export default function ActiveOrders() {
  const { profile } = useAuth()
  const { success: showSuccess } = useToast()
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [profile])

  const fetchOrders = async () => {
    setLoading(true)
    let list = []

    // Read local active orders
    try {
      const stored = JSON.parse(localStorage.getItem('agrimart_active_orders') || '[]')
      list = [...stored]
    } catch (e) {}

    // Default mock buyer orders if empty
    if (list.length === 0) {
      list = [
        {
          id: 'ord-demo-101',
          crop_type: 'Tomato (Grade A)',
          quantity: 250,
          total_cost: 7000,
          status: 'Accepted',
          farmer_name: 'Ramesh Gowda',
          district: 'Bangalore Urban',
          driver: 'Sunil Kumar',
          plate_num: 'KA-04-E-8821',
          created_at: new Date().toISOString()
        },
        {
          id: 'ord-demo-102',
          crop_type: 'Rice (Sona Masoori)',
          quantity: 500,
          total_cost: 22000,
          status: 'Dispatched',
          farmer_name: 'Mahesh Gowda',
          district: 'Mandya',
          driver: 'Ravi Teja',
          plate_num: 'KA-05-M-4412',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]
      localStorage.setItem('agrimart_active_orders', JSON.stringify(list))
    }

    setOrders(list)
    setLoading(false)
  }

  const releaseEscrow = (orderId) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: 'Completed' } : o)
    setOrders(updated)
    localStorage.setItem('agrimart_active_orders', JSON.stringify(updated))
    showSuccess('🎉 Delivery approved & Escrow payment released to farmer!')
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: 'Completed' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Orders & Escrow Tracker</h1>
          <p className="text-slate-500 text-sm">Track real-time transit status and release Escrow payments upon inspection</p>
        </div>

        <Link
          to="/buyer/market"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-1.5"
        >
          Browse Market →
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <Package className="w-16 h-16 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No active orders placed yet</h3>
          <p className="text-slate-500 text-sm">Explore APMC benchmarked produce catalog to place your first order.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const crop = order.produce_listings?.crop_type || order.crop_type || 'Tomato (Grade A)'
            const farmerName = order.produce_listings?.farmers?.full_name || order.farmer_name || 'Ramesh Gowda'
            const cropImg = getCropImage(crop)
            const stageIndex = STATUS_STAGES.indexOf(order.status)
            const progressPct = ((stageIndex + 1) / STATUS_STAGES.length) * 100

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={cropImg} alt={crop} className="w-16 h-16 rounded-2xl object-cover border border-slate-200" />
                    <div>
                      <h4 className="font-black text-slate-900 text-base">{crop}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {order.quantity} kg • Farmer: <strong className="text-slate-800">{farmerName}</strong>
                      </p>
                      <p className="text-xs text-emerald-700 font-mono font-black mt-0.5">Total: ₹{order.total_cost?.toLocaleString()}</p>
                    </div>
                  </div>

                  <span className={`px-3.5 py-1 rounded-full text-xs font-black ${
                    order.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                    order.status === 'Dispatched' ? 'bg-purple-100 text-purple-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* Progress Tracker Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    {STATUS_STAGES.map((s, idx) => (
                      <span key={s} className={idx <= stageIndex ? 'text-emerald-700 font-black' : ''}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Transport Driver Info if Dispatched */}
                {order.status === 'Dispatched' && (
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2 text-purple-950 font-bold">
                      <Truck className="w-4 h-4 text-purple-700" /> Transit Driver: {order.driver || 'Sunil Kumar'} ({order.plate_num || 'KA-04-E-8821'})
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); releaseEscrow(order.id) }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                    >
                      Approve Delivery & Release Escrow →
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal View Details */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Escrow Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Order ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Crop:</span>
                <span className="font-bold text-slate-900">{selectedOrder.crop_type || selectedOrder.produce_listings?.crop_type}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Quantity:</span>
                <span className="font-mono font-bold text-slate-900">{selectedOrder.quantity} kg</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Escrow Total:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">₹{selectedOrder.total_cost?.toLocaleString()}</span>
              </div>
            </div>

            {selectedOrder.status !== 'Completed' && (
              <button
                onClick={() => releaseEscrow(selectedOrder.id)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Approve Delivery & Release Escrow Payout
              </button>
            )}

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}