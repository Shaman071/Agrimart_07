// DispatchManager - Farmer's Delivery, Driver Assignment & Escrow Release Hub
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { 
  Loader2, Truck, MapPin, User, Package, CheckCircle, 
  AlertCircle, Clock, Edit3, ShieldCheck, ArrowRight, Save
} from 'lucide-react'
import { useToast } from '../../components/ui/Toast'

const DISPATCH_STATUSES = [
  { key: 'Picked Up', label: 'Picked Up by Logistics', color: 'bg-amber-100 text-amber-800' },
  { key: 'In Transit', label: 'In Transit on Highway', color: 'bg-purple-100 text-purple-800' },
  { key: 'Arrived', label: 'Delivered / Arrived at Buyer Warehouse', color: 'bg-emerald-100 text-emerald-800' },
]

export default function DispatchManager() {
  const { profile } = useAuth()
  const { success: showSuccess } = useToast()
  
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDispatches()
  }, [profile])

  const fetchDispatches = async () => {
    setLoading(true)
    let list = []

    // Read active orders from local storage
    try {
      const stored = JSON.parse(localStorage.getItem('agrimart_active_orders') || '[]')
      list = [...stored]
    } catch (e) {}

    // Default mock dispatch items if list is empty
    if (list.length === 0) {
      list = [
        {
          id: 'ord-demo-101',
          crop_type: 'Tomato (Grade A)',
          quantity: 250,
          total_cost: 7000,
          status: 'Dispatched',
          buyer_name: 'Metro Cash & Carry',
          address: 'APMC Yard, Yeshwanthpur, Bangalore',
          driver: 'Sunil Kumar',
          plate_num: 'KA-04-E-8821',
          dispatch_status: 'In Transit',
          created_at: new Date().toISOString()
        },
        {
          id: 'ord-demo-102',
          crop_type: 'Rice (Sona Masoori)',
          quantity: 500,
          total_cost: 22000,
          status: 'Accepted',
          buyer_name: 'Hotel Nandhini Group',
          address: 'Indiranagar 100ft Rd, Bangalore',
          driver: 'Ravi Teja',
          plate_num: 'KA-05-M-4412',
          dispatch_status: 'Picked Up',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]
      localStorage.setItem('agrimart_active_orders', JSON.stringify(list))
    }

    setDispatches(list)
    setLoading(false)
  }

  const handleUpdateDispatch = (orderId, updates) => {
    const updated = dispatches.map(item => {
      if (item.id === orderId) {
        const newObj = { ...item, ...updates }
        if (updates.dispatch_status === 'Arrived') {
          newObj.status = 'Completed'
        }
        return newObj
      }
      return item
    })

    setDispatches(updated)
    localStorage.setItem('agrimart_active_orders', JSON.stringify(updated))
    showSuccess('Dispatch status updated successfully!')
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Dispatch & Logistics Manager</h1>
        <p className="text-slate-500 text-sm">Assign transport drivers, vehicle numbers, and update delivery transit status</p>
      </div>

      {dispatches.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <Truck className="w-16 h-16 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No active dispatches right now</h3>
          <p className="text-slate-500 text-sm">Orders accepted in the Order Hub will appear here for logistics tracking.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dispatches.map((dispatch) => {
            const crop = dispatch.crop_type || dispatch.produce_listings?.crop_type || 'Tomato (Grade A)'
            const buyerName = dispatch.buyer_name || dispatch.buyers?.full_name || 'Verified Buyer'
            const currentTransit = dispatch.dispatch_status || 'Picked Up'

            return (
              <div key={dispatch.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">Order ID: {dispatch.id.slice(0, 10)}</span>
                      <span className={`px-3 py-0.5 rounded-full text-[11px] font-black ${
                        dispatch.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {dispatch.status}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 text-lg mt-1">{crop}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-bold block">Escrow Order Value</span>
                    <span className="text-xl font-black text-emerald-700 font-mono">₹{dispatch.total_cost?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Buyer & Destination */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-400 uppercase text-[10px]">Buyer Destination</p>
                    <p className="font-bold text-slate-900 text-sm">{buyerName}</p>
                    <p className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" /> {dispatch.address || 'Bangalore APMC Yard'}
                    </p>
                  </div>

                  {/* Driver Name Input */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-400 uppercase text-[10px]">Logistics Driver</p>
                    <input
                      type="text"
                      value={dispatch.driver || ''}
                      onChange={(e) => handleUpdateDispatch(dispatch.id, { driver: e.target.value })}
                      placeholder="Enter driver name"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  {/* Vehicle Plate No Input */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-400 uppercase text-[10px]">Vehicle Number Plate</p>
                    <input
                      type="text"
                      value={dispatch.plate_num || ''}
                      onChange={(e) => handleUpdateDispatch(dispatch.id, { plate_num: e.target.value })}
                      placeholder="e.g. KA-04-E-8821"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Transit Status Selector */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Transit State:</label>
                    <select
                      value={currentTransit}
                      onChange={(e) => handleUpdateDispatch(dispatch.id, { dispatch_status: e.target.value })}
                      className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none"
                    >
                      {DISPATCH_STATUSES.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {currentTransit === 'Arrived' && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Escrow payout unlocked in wallet!
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}