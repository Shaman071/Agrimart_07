// DispatchManager - Farmer's delivery management
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, Truck, MapPin, User, Package, CheckCircle, AlertCircle, Clock, Edit3 } from 'lucide-react'

const DISPATCH_STATUSES = [
  { key: 'Picked Up', label: 'dispatch.statuses.pickedUp', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'In Transit', label: 'dispatch.statuses.inTransit', color: 'bg-blue-100 text-blue-800' },
  { key: 'Arrived', label: 'dispatch.statuses.arrived', color: 'bg-green-100 text-green-800' },
]

export default function DispatchManager() {
  const { t } = useTranslation('farmer')
  const { profile } = useAuth()
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    fetchDispatches()
  }, [profile])

  const fetchDispatches = async () => {
    if (!profile?.farmer_id) return
    setLoading(true)
    try {
      const { data: listings } = await supabase
        .from('produce_listings')
        .select('id')
        .eq('farmer_id', profile.farmer_id)

      const listingIds = listings?.map(l => l.id) || []
      if (listingIds.length === 0) {
        setDispatches([])
        return
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('id, buyers(full_name, address), produce_listings(crop_type)')
        .in('listing_id', listingIds)
        .in('status', ['Accepted', 'Dispatched'])

      if (!orders || orders.length === 0) {
        setDispatches([])
        return
      }

      const orderIds = orders.map(o => o.id)
      const { data: transports } = await supabase
        .from('transports')
        .select('*')
        .in('order_id', orderIds)

      // Merge orders with transports
      const merged = orders.map(order => {
        const transport = transports?.find(t => t.order_id === order.id)
        return {
          ...order,
          transport: transport || { dispatch: 'Picked Up', driver: '', plate_num: '' }
        }
      })

      setDispatches(merged)
    } catch (err) {
      console.error('Failed to fetch dispatches:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (transportId, orderId, newStatus) => {
    setUpdating(transportId)
    try {
      const { error } = await supabase
        .from('transports')
        .update({ dispatch: newStatus })
        .eq('id', transportId)
      
      if (error) throw error
      
      // If arrived, update order status
      if (newStatus === 'Arrived') {
        await supabase
          .from('orders')
          .update({ status: 'Completed' })
          .eq('id', orderId)
      }
      
      fetchDispatches()
    } catch (err) {
      console.error('Failed to update dispatch:', err)
    } finally {
      setUpdating(null)
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
        <h1 className="text-2xl font-bold text-farmer-text">{t('dispatch.title')}</h1>
        <p className="text-farmer-text/70 mt-1">{t('dispatch.subtitle')}</p>
      </div>

      {dispatches.length === 0 ? (
        <div className="farmer-card text-center py-12">
          <Truck className="w-16 h-16 text-farmer-text/30 mx-auto mb-4" />
          <p className="text-farmer-text/70">{t('dispatch.noDispatches')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dispatches.map((dispatch) => {
            const order = dispatch
            const transport = dispatch.transport
            const buyer = order.buyers
            const listing = order.produce_listings
            const currentStatus = transport.dispatch || 'Picked Up'
            const currentIndex = DISPATCH_STATUSES.findIndex(s => s.key === currentStatus)
            
            return (
              <div key={order.id} className="farmer-card">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {t(`status.${order.status.toLowerCase()}`)}
                      </span>
                      <span className="text-farmer-text/70 text-sm">#{order.id.slice(0, 8)}</span>
                    </div>
                    <p className="font-medium text-farmer-text text-lg">{listing.crop_type}</p>
                    <p className="text-farmer-text/70">{buyer.full_name} • {buyer.buyer_type}</p>
                  </div>
                  <div>
                    <p className="text-farmer-text/70 text-sm">{t('dispatch.address')}</p>
                    <p className="text-farmer-text text-sm">{buyer.address}</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-farmer-text/70 text-sm">{t('dispatch.dispatchStatus')}</p>
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusUpdate(transport.id, order.id, e.target.value)}
                        disabled={updating === transport.id}
                        className="input-field text-farmer-text bg-white text-sm"
                      >
                        {DISPATCH_STATUSES.map(s => (
                          <option key={s.key} value={s.key}>{t(s.label)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-farmer-text/70">{t('dispatch.driver')}</p>
                        <input
                          type="text"
                          value={transport.driver}
                          onChange={(e) => updateTransportField(transport.id, 'driver', e.target.value)}
                          className="input-field text-farmer-text bg-white text-sm py-2"
                          placeholder="Driver name"
                        />
                      </div>
                      <div>
                        <p className="text-farmer-text/70">{t('dispatch.vehicle')}</p>
                        <input
                          type="text"
                          value={transport.plate_num}
                          onChange={(e) => updateTransportField(transport.id, 'plate_num', e.target.value)}
                          className="input-field text-farmer-text bg-white text-sm py-2"
                          placeholder="Vehicle no."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const updateTransportField = async (id, field, value) => {
  await supabase.from('transports').update({ [field]: value }).eq('id', id)
}