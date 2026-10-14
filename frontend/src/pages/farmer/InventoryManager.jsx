// Inventory Manager - Farmer's produce listings management
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Plus, Edit, Trash2, ToggleLeft, Loader2, Package, Mic, Sparkles } from 'lucide-react'

export default function InventoryManager() {
  const { t } = useTranslation('farmer')
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)

  useEffect(() => {
    fetchListings()
  }, [profile])

  const fetchListings = async () => {
    let combined = []

    // Read custom local listings first
    try {
      const stored = JSON.parse(localStorage.getItem('agrimart_custom_listings') || '[]')
      combined = [...stored]
    } catch (e) {}

    // Fetch from Supabase
    if (profile?.farmer_id) {
      try {
        const { data, error } = await supabase
          .from('produce_listings')
          .select('*')
          .eq('farmer_id', profile.farmer_id)
          .order('created_at', { ascending: false })
        
        if (!error && data?.length) {
          const ids = new Set(combined.map(c => c.id))
          data.forEach(d => {
            if (!ids.has(d.id)) combined.push(d)
          })
        }
      } catch (err) {
        console.error('Failed to fetch remote listings:', err)
      }
    }

    // Default fallback mock listings if empty
    if (combined.length === 0) {
      combined = [
        {
          id: 'lst-demo-1',
          crop_type: 'Tomato (Grade A)',
          qty_avail: 500,
          qty_reserved: 0,
          price: 28,
          ai_grade: 'A',
          is_active: true,
          district: 'Bangalore Urban',
          pooling_enabled: false
        },
        {
          id: 'lst-demo-2',
          crop_type: 'Rice (Sona Masoori)',
          qty_avail: 1200,
          qty_reserved: 200,
          price: 44,
          ai_grade: 'A',
          is_active: true,
          district: 'Mandya',
          pooling_enabled: true,
          pooling_threshold: 1000
        }
      ]
    }

    setListings(combined)
    setLoading(false)
  }

  const handleToggle = async (listing) => {
    setToggling(listing.id)
    try {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_active: !l.is_active } : l))
      // Update local storage
      const stored = JSON.parse(localStorage.getItem('agrimart_custom_listings') || '[]')
      const updated = stored.map(l => l.id === listing.id ? { ...l, is_active: !l.is_active } : l)
      localStorage.setItem('agrimart_custom_listings', JSON.stringify(updated))
    } catch (err) {
      console.error('Failed to toggle:', err)
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this listing?')) return
    setDeleting(id)
    try {
      setListings(prev => prev.filter(l => l.id !== id))
      const stored = JSON.parse(localStorage.getItem('agrimart_custom_listings') || '[]')
      const updated = stored.filter(l => l.id !== id)
      localStorage.setItem('agrimart_custom_listings', JSON.stringify(updated))
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setDeleting(null)
    }
  }

  const getGradeBadge = (grade) => {
    const colors = { A: 'bg-emerald-100 text-emerald-800 border-emerald-300', B: 'bg-yellow-100 text-yellow-800 border-yellow-300', C: 'bg-red-100 text-red-800 border-red-300' }
    return <span className={`px-2.5 py-0.5 border rounded-full text-xs font-bold ${colors[grade] || 'bg-slate-100 text-slate-800'}`}>{grade}</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Inventory & Harvest Listings</h1>
          <p className="text-slate-500 text-sm">Manage your active farm produce listings, prices, and stock</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/farmer/kisan-vani" 
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all"
          >
            <Mic className="w-4 h-4" /> KisanVani Voice Add
          </Link>

          <Link 
            to="/farmer/create-listing" 
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Manual Add Listing
          </Link>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
        {listings.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No active produce listings found.</p>
            <Link to="/farmer/kisan-vani" className="px-5 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs inline-flex items-center gap-2">
              <Mic className="w-4 h-4" /> Add via KisanVani Voice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-400">
                  <th className="pb-3">Crop Name</th>
                  <th className="pb-3">Available Stock</th>
                  <th className="pb-3">Reserved</th>
                  <th className="pb-3">Price / kg</th>
                  <th className="pb-3">AI Grade</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      {listing.crop_type}
                    </td>
                    <td className="py-4 font-mono font-bold text-slate-800">{listing.qty_avail} kg</td>
                    <td className="py-4 font-mono text-slate-400">{listing.qty_reserved || 0} kg</td>
                    <td className="py-4 font-mono font-black text-emerald-700">₹{listing.price}/kg</td>
                    <td className="py-4">{getGradeBadge(listing.ai_grade || 'A')}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        listing.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {listing.is_active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggle(listing)}
                          disabled={toggling === listing.id}
                          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Toggle Status"
                        >
                          <ToggleLeft className={`w-5 h-5 ${listing.is_active ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deleting === listing.id}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}