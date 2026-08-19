// MarketCatalog - Buyer's marketplace with filters and pooling
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, Filter, X, Plus, Users, Tag, MapPin, Truck, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

const CROPS = [
  'Tomato', 'Onion', 'Potato', 'Rice', 'Wheat', 'Maize', 'Ragi',
  'Coconut', 'Banana', 'Mango', 'Chilli', 'Cabbage', 'Cauliflower',
  'Brinjal', 'Okra', 'Pumpkin', 'Carrot', 'Beetroot', 'Groundnut',
  'Soybean', 'Cotton', 'Sugarcane', 'Chickpea', 'Pigeon Pea'
]

const DISTRICTS = [
  'Bangalore Urban', 'Bangalore Rural', 'Mysore', 'Hubli', 'Dharwad',
  'Mangalore', 'Belgaum', 'Gulbarga', 'Bidar', 'Raichur', 'Koppal',
  'Bellary', 'Chitradurga', 'Davangere', 'Shimoga', 'Tumkur', 'Kolar'
]

const BUYER_TYPES = ['Consumer', 'Retailer', 'Wholesaler']

export default function MarketCatalog() {
  const { t } = useTranslation('common')
  const { profile } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    crop: '',
    district: '',
    minPrice: '',
    maxPrice: '',
    grade: '',
    pooling: false,
    organic: false,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [joiningPool, setJoiningPool] = useState(null)

  useEffect(() => {
    fetchListings()
  }, [filters])

  const fetchListings = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('produce_listings')
        .select(`
          *,
          farmers!inner(full_name, district, trust_score)
        `)
        .eq('is_active', true)
        .gt('qty_avail', 0)
        .order('created_at', { ascending: false })

      if (filters.crop) query = query.eq('crop_type', filters.crop)
      if (filters.district) query = query.eq('farmers.district', filters.district)
      if (filters.minPrice) query = query.gte('price', parseFloat(filters.minPrice))
      if (filters.maxPrice) query = query.lte('price', parseFloat(filters.maxPrice))
      if (filters.grade) query = query.eq('ai_grade', filters.grade)
      if (filters.pooling) query = query.eq('pooling_enabled', true)

      const { data, error } = await query
      if (error) throw error
      setListings(data || [])
    } catch (err) {
      console.error('Failed to fetch listings:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      crop: '', district: '', minPrice: '', maxPrice: '', grade: '', pooling: false, organic: false
    })
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== false)

  const handleJoinPool = async (listing) => {
    if (!profile?.buyer_id) return
    setJoiningPool(listing.id)
    try {
      const qty = prompt(`Enter quantity to contribute (kg). Pool threshold: ${listing.pooling_threshold} kg`)
      if (!qty) return

      const { error } = await supabase
        .from('pooled_contributions')
        .insert({
          listing_id: listing.id,
          buyer_id: profile.buyer_id,
          quantity: parseFloat(qty)
        })

      if (error) throw error
      alert('Successfully joined pool!')
      fetchListings()
    } catch (err) {
      alert(err.message)
    } finally {
      setJoiningPool(null)
    }
  }

  const getGradeBadge = (grade) => {
    const colors = { A: 'bg-green-100 text-green-800', B: 'bg-yellow-100 text-yellow-800', C: 'bg-red-100 text-red-800' }
    return grade ? <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[grade]}`}>{grade}</span> : null
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Catalog</h1>
          <p className="text-gray-600">{listings.length} listings available</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-sm text-primary-600 hover:underline">Clear all</button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={filters.crop}
              onChange={(e) => setFilters({...filters, crop: e.target.value})}
              className="input-field"
            >
              <option value="">All Crops</option>
              {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filters.district}
              onChange={(e) => setFilters({...filters, district: e.target.value})}
              className="input-field"
            >
              <option value="">All Districts</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input
              type="number"
              placeholder="Min Price (₹/kg)"
              value={filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Max Price (₹/kg)"
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              className="input-field"
            />
            <select
              value={filters.grade}
              onChange={(e) => setFilters({...filters, grade: e.target.value})}
              className="input-field"
            >
              <option value="">Any Grade</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.pooling}
                onChange={(e) => setFilters({...filters, pooling: e.target.checked})}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span>Group Buying Only</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.organic}
                onChange={(e) => setFilters({...filters, organic: e.target.checked})}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span>Organic</span>
            </label>
          </div>
        </div>
      )}

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="card text-center py-16">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              to={`/buyer/listing/${listing.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  {listing.crop_type}
                </span>
                {listing.ai_grade && getGradeBadge(listing.ai_grade)}
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-2xl font-bold text-gray-900">₹{listing.price}/kg</p>
                <p className="text-sm text-gray-500">
                  {listing.qty_avail} kg available
                  {listing.pooling_enabled && (
                    <> • Pool: {listing.pooling_threshold} kg</>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{listing.farmers?.district}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Trust: {listing.farmers?.trust_score || 50}</span>
                </div>
              </div>

              {listing.pooling_enabled && (
                <button
                  onClick={(e) => { e.preventDefault(); handleJoinPool(listing) }}
                  disabled={joiningPool === listing.id}
                  className="mt-3 w-full btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Join Pool ({listing.pooling_threshold} kg min)
                </button>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Load More */}
      <div className="text-center">
        <button className="btn-secondary">Load More</button>
      </div>
    </div>
  )
}