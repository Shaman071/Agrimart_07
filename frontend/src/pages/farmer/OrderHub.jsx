// OrderHub - Farmer's Order Hub & Live Order Tracking
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { 
  Loader2, Package, User, MapPin, Truck, CheckCircle, 
  AlertCircle, Clock, Eye, ShieldCheck, ArrowRight
} from 'lucide-react'
import { useToast } from '../../components/ui/Toast'

const TABS = [
  { key: 'All', label: 'All Orders' },
  { key: 'Pending', label: 'Pending Approval' },
  { key: 'Accepted', label: 'Accepted (Escrow Locked)' },
  { key: 'Dispatched', label: 'In Transit / Dispatched' },
  { key: 'Completed', label: 'Completed' },
]

export default function OrderHub() {
  const { profile } = useAuth()
  const { success: showSuccess } = useToast()
  const [activeTab, setActiveTab] = useState('All')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [profile, activeTab])

  const fetchOrders = async () => {
    setLoading(true)
    let list = []

    // 1. Local active orders
    try {
      const stored = JSON.parse(localStorage.getItem('agrimart_active_orders') || '[]')
      list = [...stored]
    } catch (e) {}

    // 2. Remote Supabase orders if profile exists
    if (profile?.farmer_id) {
      try {
        const { data } = await supabase
          .from('orders')
          .select(`
            *,
            buyers(full_name, buyer_type, address),
            produce_listings(crop_type, price)
          `)
          .order('created_at', { ascending: false })

        if (data?.length) {
          const ids = new Set(list.map(l => l.id))
          data.forEach(d => {
            if (!ids.has(d.id)) list.push(d)
          })
        }
      } catch (err) {}
    }

    // Default mock orders if empty
    if (list.length === 0) {
      list = [
        {
          id: 'ord-demo-101',
          crop_type: 'Tomato (Grade A)',
          quantity: 250,
          total_cost: 7000,
          status: 'Accepted',
          buyer_name: 'Metro Cash & Carry',
          district: 'Bangalore Urban',
          created_at: new Date().toISOString()
        },
        {
          id: 'ord-demo-102',
          crop_type: 'Rice (Sona Masoori)',
          quantity: 500,
          total_cost: 22000,
          status: 'Dispatched',
          buyer_name: 'Hotel Nandhini Group',
          district: 'Mysore',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    }

    // Filter by tab
    if (activeTab !== 'All') {
      list = list.filter(o => o.status === activeTab)
    }

    setOrders(list)
    setLoading(false)
  }

  const handleStatusUpdate = (orderId, newStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    setOrders(updated)
    
    // Save to local storage
    const stored = JSON.parse(localStorage.getItem('agrimart_active_orders') || '[]')
    const saved = stored.map(s => s.id === orderId ? { ...s, status: newStatus } : s)
    localStorage.setItem('agrimart_active_orders', JSON.stringify(saved))

    showSuccess(`Order status updated to ${newStatus}!`)
  }

  const getNextAction = (status) => {
    switch (status) {
      case 'Pending': return { label: 'Accept Order', next: 'Accepted', color: 'bg-emerald-600' }
      case 'Accepted': return { label: 'Dispatch Order', next: 'Dispatched', color: 'bg-purple-600' }
      case 'Dispatched': return { label: 'Mark Delivered', next: 'Completed', color: 'bg-blue-600' }
      default: return null
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Order Dispatch & Fulfillment Hub</h1>
          <p className="text-slate-500 text-sm">Track buyer orders, update dispatch status, and manage escrow payouts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
            <Package className="w-16 h-16 text-slate-300 mx-auto" />
            <p className="text-slate-500 font-bold">No orders found under "{activeTab}" status.</p>
          </div>
        ) : (
          orders.map((order) => {
            const action = getNextAction(order.status)
            const cropName = order.produce_listings?.crop_type || order.crop_type || 'Tomato (Grade A)'
            const buyerName = order.buyers?.full_name || order.buyer_name || 'Verified Buyer'

            return (
              <div key={order.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">ID: {order.id.slice(0, 10)}</span>
                    <span className={`px-3 py-0.5 rounded-full text-[11px] font-black ${
                      order.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                      order.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'Dispatched' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 text-lg">{cropName}</h3>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
                    <span>Quantity: <strong className="text-slate-900 font-mono">{order.quantity} kg</strong></span>
                    <span>Total Cost: <strong className="text-emerald-700 font-mono font-black">₹{order.total_cost?.toLocaleString()}</strong></span>
                    <span>Buyer: <strong className="text-slate-900">{buyerName}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {action && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, action.next)}
                      className={`px-5 py-3 ${action.color} text-white font-bold text-xs rounded-2xl shadow-md hover:scale-105 transition-all flex items-center justify-center gap-2 w-full md:w-auto`}
                    >
                      <Truck className="w-4 h-4" />
                      {action.label} →
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}