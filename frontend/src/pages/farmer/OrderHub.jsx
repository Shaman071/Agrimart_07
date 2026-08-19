// OrderHub - Farmer's order management
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, Package, User, MapPin, Truck, CheckCircle, AlertCircle, Clock, Eye } from 'lucide-react'

const TABS = [
  { key: 'Pending', label: 'orders.tabs.pending', icon: Clock },
  { key: 'Accepted', label: 'orders.tabs.accepted', icon: CheckCircle },
  { key: 'Dispatched', label: 'orders.tabs.dispatched', icon: Truck },
  { key: 'Completed', label: 'orders.tabs.completed', icon: CheckCircle },
  { key: 'Disputed', label: 'orders.tabs.disputed', icon: AlertCircle },
]

export default function OrderHub() {
  const { t } = useTranslation('farmer')
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('Pending')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [profile, activeTab])

  const fetchOrders = async () => {
    if (!profile?.farmer_id) return
    setLoading(true)
    try {
      // Get farmer's listing IDs
      const { data: listings } = await supabase
        .from('produce_listings')
        .select('id')
        .eq('farmer_id', profile.farmer_id)

      const listingIds = listings?.map(l => l.id) || []
      if (listingIds.length === 0) {
        setOrders([])
        return
      }

      let query = supabase
        .from('orders')
        .select(`
          *,
          buyers!inner(full_name, buyer_type, address),
          produce_listings!inner(crop_type, price)
        `)
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false })

      if (activeTab !== 'All') {
        query = query.eq('status', activeTab)
      }

      const { data, error } = await query
      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
      
      if (error) throw error
      fetchOrders()
    } catch (err) {
      console.error('Failed to update order:', err)
    }
  }

  const getNextAction = (status) => {
    switch (status) {
      case 'Pending': return { label: 'orders.accept', next: 'Accepted', icon: CheckCircle }
      case 'Accepted': return { label: 'orders.dispatch', next: 'Dispatched', icon: Truck }
      case 'Dispatched': return { label: 'orders.complete', next: 'Completed', icon: CheckCircle }
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-farmer-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="farmer-card">
        <h1 className="text-2xl font-bold text-farmer-text">{t('orders.title')}</h1>
      </div>

      {/* Tabs */}
      <div className="farmer-card p-0 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-farmer-accent/30">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-farmer-accent text-farmer-accent bg-farmer-bg'
                    : 'border-transparent text-farmer-text/70 hover:text-farmer-text hover:bg-farmer-bg/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t(tab.label)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Orders List */}
      <div className="farmer-card p-0">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-farmer-text/30 mx-auto mb-4" />
            <p className="text-farmer-text/70">{t('orders.noOrders')}</p>
          </div>
        ) : (
          <div className="divide-y divide-farmer-accent/20">
            {orders.map((order) => {
              const action = getNextAction(order.status)
              const buyer = order.buyers
              const listing = order.produce_listings
              
              return (
                <div key={order.id} className="p-4 hover:bg-farmer-bg/50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-farmer-text/70 text-sm">{t('orders.orderId')}</p>
                      <p className="font-mono text-farmer-text">{order.id.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-farmer-text/70 text-sm">{t('orders.crop')}</p>
                      <p className="font-medium text-farmer-text">{listing.crop_type}</p>
                      <p className="text-sm text-farmer-text/70">{order.quantity} kg • ₹{order.total_cost}</p>
                    </div>
                    <div>
                      <p className="text-farmer-text/70 text-sm">{t('orders.buyer')}</p>
                      <p className="font-medium text-farmer-text">{buyer.full_name}</p>
                      <p className="text-sm text-farmer-text/70">{buyer.buyer_type}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Dispatched' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {t(`status.${order.status.toLowerCase()}`)}
                      </span>
                      {action && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, action.next)}
                          className="farmer-btn text-sm px-4 py-2"
                        >
                          <action.icon className="w-4 h-4" />
                          {t(action.label)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}