// Inventory Manager - Farmer's listings management
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Plus, Edit, Trash2, Eye, ToggleLeft, Loader2, CheckCircle, AlertCircle, Package } from 'lucide-react'
import { Link } from 'react-router-dom'

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
    if (!profile?.farmer_id) return
    try {
      const { data, error } = await supabase
        .from('produce_listings')
        .select('*')
        .eq('farmer_id', profile.farmer_id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setListings(data || [])
    } catch (err) {
      console.error('Failed to fetch listings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (listing) => {
    setToggling(listing.id)
    try {
      const { error } = await supabase
        .from('produce_listings')
        .update({ is_active: !listing.is_active })
        .eq('id', listing.id)
      
      if (error) throw error
      fetchListings()
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
      const { error } = await supabase
        .from('produce_listings')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchListings()
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setDeleting(null)
    }
  }

  const getGradeBadge = (grade) => {
    const colors = { A: 'bg-green-100 text-green-800', B: 'bg-yellow-100 text-yellow-800', C: 'bg-red-100 text-red-800' }
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[grade] || 'bg-gray-100 text-gray-800'}`}>{grade}</span>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-farmer-text">{t('inventory.title')}</h1>
          <p className="text-farmer-text/70">{t('inventory.myListings')}</p>
        </div>
        <Link to="/farmer/create-listing" className="farmer-btn">
          <Plus className="w-5 h-5" />
          {t('inventory.addListing')}
        </Link>
      </div>

      {/* Listings Table */}
      <div className="farmer-card">
        {listings.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-farmer-text/30 mx-auto mb-4" />
            <p className="text-farmer-text/70 mb-4">{t('inventory.noListings')}</p>
            <Link to="/farmer/create-listing" className="farmer-btn inline-flex">
              <Plus className="w-5 h-5" />
              {t('inventory.addListing')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-farmer-accent/30 text-left text-sm text-farmer-text/70">
                  <th className="pb-3 font-semibold">{t('inventory.crop')}</th>
                  <th className="pb-3 font-semibold">{t('inventory.available')}</th>
                  <th className="pb-3 font-semibold">{t('inventory.reserved')}</th>
                  <th className="pb-3 font-semibold">{t('inventory.price')}</th>
                  <th className="pb-3 font-semibold">{t('inventory.grade')}</th>
                  <th className="pb-3 font-semibold">{t('inventory.status')}</th>
                  <th className="pb-3 font-semibold">{t('inventory.poolingEnabled')}</th>
                  <th className="pb-3 font-semibold">{t('inventory.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farmer-accent/20">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-farmer-bg/50">
                    <td className="py-4 font-medium text-farmer-text">{listing.crop_type}</td>
                    <td className="py-4 text-farmer-text">{listing.qty_avail} kg</td>
                    <td className="py-4 text-farmer-text/70">{listing.qty_reserved} kg</td>
                    <td className="py-4 font-semibold text-farmer-text">₹{listing.price}/kg</td>
                    <td className="py-4">{listing.ai_grade ? getGradeBadge(listing.ai_grade) : <span className="text-farmer-text/50">—</span>}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        listing.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {listing.is_active ? t('status.active') : t('status.inactive')}
                      </span>
                    </td>
                    <td className="py-4">
                      {listing.pooling_enabled && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {t('inventory.poolingEnabled')} ({listing.pooling_threshold} kg)
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <Link to={`/farmer/create-listing?edit=${listing.id}`} className="p-2 text-farmer-text/70 hover:text-farmer-accent hover:bg-farmer-accent/10 rounded-lg" title={t('inventory.edit')}>
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleToggle(listing)}
                          disabled={toggling === listing.id}
                          className="p-2 text-farmer-text/70 hover:text-farmer-accent hover:bg-farmer-accent/10 rounded-lg"
                          title={listing.is_active ? t('inventory.deactivate') : t('inventory.activate')}
                        >
                          <ToggleLeft className={`w-5 h-5 ${listing.is_active ? 'text-green-500' : 'text-gray-400'}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deleting === listing.id}
                          className="p-2 text-farmer-text/70 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          title={t('inventory.delete')}
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