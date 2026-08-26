// MarketCatalog - Modern B2C & B2B Unified Marketplace with Demand Pooling & APMC Benchmarks
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Loader2, Filter, X, Users, MapPin, Search, 
  SlidersHorizontal, Star, Mic, Sparkles, Building2, ShoppingBag, 
  TrendingDown, TrendingUp, CheckCircle, ShieldCheck, ArrowUpRight
} from 'lucide-react'
import { Card, Button, Badge, Input, Select, Avatar } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { formatCurrency } from '../../lib/utils'
import { getCropImage, getAPMCBenchmark } from '../../lib/cropImages'

const CROPS = [
  'Tomato', 'Onion', 'Potato', 'Rice', 'Wheat', 'Maize', 'Ragi',
  'Coconut', 'Banana', 'Mango', 'Chilli', 'Cabbage', 'Cauliflower',
  'Brinjal', 'Okra', 'Pumpkin', 'Carrot', 'Beetroot', 'Groundnut',
  'Soybean', 'Cotton', 'Sugarcane', 'Chickpea'
]

const DISTRICTS = [
  'Bangalore Urban', 'Bangalore Rural', 'Mysore', 'Hubli', 'Dharwad',
  'Mangalore', 'Belgaum', 'Gulbarga', 'Bidar', 'Raichur', 'Koppal',
  'Bellary', 'Chitradurga', 'Davangere', 'Shimoga', 'Tumkur', 'Kolar'
]

const GRADES = ['A', 'B', 'C']

export default function MarketCatalog() {
  const { t } = useTranslation('common')
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  
  const [allListings, setAllListings] = useState([]) // Raw data from server
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'pooling', 'b2b', 'b2c'
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    crop: '',
    district: '',
    minPrice: '',
    maxPrice: '',
    grade: '',
    pooling: false,
    organic: false,
    sortBy: 'newest',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [joiningPool, setJoiningPool] = useState(null)
  const [poolModalListing, setPoolModalListing] = useState(null)
  const [poolQuantity, setPoolQuantity] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  // Server-side fetch only changes when filters or tab changes (not searchQuery)
  useEffect(() => {
    fetchListings()
  }, [filters, activeTab])

  // Client-side filtering on top of server results (for search + tab tweaks)
  const listings = useMemo(() => {
    let results = [...allListings]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      results = results.filter(l =>
        l.crop_type.toLowerCase().includes(q) ||
        (l.district || l.farmers?.district || '').toLowerCase().includes(q) ||
        (l.farmers?.full_name || '').toLowerCase().includes(q)
      )
    }

    // Tab-based filters (client side for b2b/b2c)
    if (activeTab === 'b2b') {
      results = results.filter(l => l.qty_avail >= 500)
    } else if (activeTab === 'b2c') {
      results = results.filter(l => l.qty_avail < 500 || !l.pooling_enabled)
    }

    // Trust score sort
    if (filters.sortBy === 'trust_desc') {
      results = results.sort((a, b) => (b.farmers?.trust_score || 0) - (a.farmers?.trust_score || 0))
    }

    return results
  }, [allListings, searchQuery, activeTab, filters.sortBy])

  const fetchListings = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('produce_listings')
        .select(`
          *,
          farmers(full_name, district, trust_score, is_verified)
        `)
        .eq('is_active', true)
        .gt('qty_avail', 0)

      if (filters.crop) query = query.eq('crop_type', filters.crop)
      if (filters.minPrice) query = query.gte('price', parseFloat(filters.minPrice))
      if (filters.maxPrice) query = query.lte('price', parseFloat(filters.maxPrice))
      if (filters.grade) query = query.eq('ai_grade', filters.grade)
      
      // Handle tab-based filtering
      if (activeTab === 'pooling' || filters.pooling) {
        query = query.eq('pooling_enabled', true)
      }

      // Sort ordering
      if (filters.sortBy === 'price_asc') query = query.order('price', { ascending: true })
      else if (filters.sortBy === 'price_desc') query = query.order('price', { ascending: false })
      else query = query.order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error

      let results = data || []

      // Client-side filter by district (server-side filter on joined column is unreliable)
      if (filters.district) {
        results = results.filter(l => (l.district || l.farmers?.district) === filters.district)
      }

      setAllListings(results)
    } catch (err) {
      console.error('Failed to fetch listings:', err)
      showError('Failed to load listings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      crop: '', district: '', minPrice: '', maxPrice: '', grade: '', 
      pooling: false, organic: false, sortBy: 'newest'
    })
    setSearchQuery('')
    setActiveTab('all')
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== false && v !== 'newest') || searchQuery !== ''

  const handleOpenPoolModal = (e, listing) => {
    e.preventDefault()
    e.stopPropagation()
    if (!profile?.buyer_id) {
      navigate('/login')
      return
    }
    setPoolModalListing(listing)
    setPoolQuantity(listing.pooling_threshold ? Math.round(listing.pooling_threshold * 0.2) : 50)
  }

  const handleSubmitPool = async () => {
    if (!poolModalListing || !poolQuantity || parseFloat(poolQuantity) <= 0) return
    setJoiningPool(poolModalListing.id)
    try {
      const { error } = await supabase
        .from('pooled_contributions')
        .insert({
          listing_id: poolModalListing.id,
          buyer_id: profile.buyer_id,
          quantity: parseFloat(poolQuantity)
        })

      if (error) throw error
      success(`Successfully joined pool with ${poolQuantity} kg!`)
      setPoolModalListing(null)
      fetchListings()
    } catch (err) {
      showError(err.message || 'Failed to join pool.')
    } finally {
      setJoiningPool(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / KisanVani Voice Search Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-emerald-100">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Direct From Farmers • Zero Middleman Markup
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AgriMart Direct Produce Catalog
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Explore APMC benchmarked listings for retail buyers, wholesalers & restaurants. Participate in <strong>Group Buying</strong> to unlock wholesale rates!
            </p>
          </div>

          {/* Voice Search / Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch w-full md:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700" />
              <input
                type="text"
                placeholder="Search crops, districts, farmers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Link
              to="/farmer/voice-action"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold text-sm transition-all shadow-md active:scale-95"
            >
              <Mic className="w-4 h-4 animate-pulse text-emerald-900" />
              <span>KisanVani Voice</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Produce ({listings.length})
          </button>
          
          <button
            onClick={() => setActiveTab('pooling')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'pooling'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <Users className="w-4 h-4 text-purple-500" />
            <span>Group Buying Pools</span>
            <span className="px-1.5 py-0.5 rounded-md bg-purple-200 text-purple-900 text-xs font-bold">New</span>
          </button>

          <button
            onClick={() => setActiveTab('b2b')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'b2b'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>B2B Wholesale</span>
          </button>

          <button
            onClick={() => setActiveTab('b2c')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'b2c'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>B2C Household</span>
          </button>
        </div>

        {/* Filter / View Mode Controls */}
        <div className="flex items-center gap-3">
          <Button 
            variant={showFilters ? 'primary' : 'secondary'} 
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            size="sm"
          >
            {showFilters ? 'Hide Filters' : 'Filter Options'}
            {hasActiveFilters && <Badge variant="primary" size="sm">{Object.values(filters).filter(v => v && v !== 'newest').length}</Badge>}
          </Button>

          <Select
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            options={[
              { value: 'newest', label: 'Sort: Newest First' },
              { value: 'price_asc', label: 'Price: Low to High' },
              { value: 'price_desc', label: 'Price: High to Low' },
              { value: 'trust_desc', label: 'Highest Farmer Trust' },
            ]}
            className="w-48 text-xs"
          />

          <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${viewMode === 'grid' ? 'bg-white shadow text-emerald-700' : 'text-gray-500'}`}
              title="Grid View"
            >
              Grid
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${viewMode === 'list' ? 'bg-white shadow text-emerald-700' : 'text-gray-500'}`}
              title="List View"
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <Card className="animate-slide-in bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 text-sm">Advanced Search Filters</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>
                Clear All
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Crop Category"
              value={filters.crop}
              onChange={(e) => setFilters({...filters, crop: e.target.value})}
              options={[{value: '', label: 'All Crops'}, ...CROPS.map(c => ({value: c, label: c}))]}
            />
            <Select
              label="District / Location"
              value={filters.district}
              onChange={(e) => setFilters({...filters, district: e.target.value})}
              options={[{value: '', label: 'All Districts'}, ...DISTRICTS.map(d => ({value: d, label: d}))]}
            />
            <Input
              label="Min Price (₹/kg)"
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
            />
            <Input
              label="Max Price (₹/kg)"
              type="number"
              placeholder="500"
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
            />
          </div>
        </Card>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-10 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        /* Empty State */
        <Card className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Produce Listings Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            We couldn't find any produce matching your current search criteria. Try clearing filters or exploring other districts!
          </p>
          <Button variant="primary" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>
            Reset Filters
          </Button>
        </Card>
      ) : (
        /* Render Listings Grid */
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onOpenPoolModal={handleOpenPoolModal}
              listView={viewMode === 'list'}
            />
          ))}
        </div>
      )}

      {/* Group Buying Pool Contribution Modal */}
      {poolModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-purple-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Join Demand Pool</h3>
                  <p className="text-xs text-gray-500">{poolModalListing.crop_type} • Wholesale Rate</p>
                </div>
              </div>
              <button onClick={() => setPoolModalListing(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 text-purple-900">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-xs">Pool Target Threshold</span>
                  <span className="font-bold text-purple-700">{poolModalListing.pooling_threshold || 500} kg</span>
                </div>
                <div className="flex justify-between items-center text-xs text-purple-700">
                  <span>Price per kg</span>
                  <span className="font-bold text-sm text-emerald-700">₹{poolModalListing.price}/kg</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 mb-1.5">
                  Enter Your Quantity (kg)
                </label>
                <input
                  type="number"
                  min="10"
                  max={poolModalListing.qty_avail}
                  value={poolQuantity}
                  onChange={(e) => setPoolQuantity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. 50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total Order Price: <strong className="text-emerald-700">₹{((parseFloat(poolQuantity) || 0) * poolModalListing.price).toLocaleString()}</strong>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setPoolModalListing(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleSubmitPool}
                  disabled={joiningPool === poolModalListing.id}
                >
                  {joiningPool === poolModalListing.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Pool Join'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ListingCard({ listing, onOpenPoolModal, listView }) {
  const cropImage = getCropImage(listing.crop_type)
  const apmc = getAPMCBenchmark(listing.crop_type, listing.price)
  const districtName = listing.district || listing.farmers?.district || 'Karnataka'
  const isWholesale = listing.qty_avail >= 500

  // Calculate pooling progress
  const poolingThreshold = listing.pooling_threshold || 500
  const pooledQty = listing.qty_reserved || Math.round(poolingThreshold * 0.35)
  const poolProgress = Math.min(Math.round((pooledQty / poolingThreshold) * 100), 100)

  return (
    <div className={`group bg-white rounded-2xl border border-gray-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col ${listView ? 'sm:flex-row' : ''}`}>
      
      {/* Crop Image Header */}
      <div className={`relative overflow-hidden bg-gray-100 ${listView ? 'sm:w-64 h-48 sm:h-auto shrink-0' : 'h-48'}`}>
        <img 
          src={cropImage} 
          alt={listing.crop_type} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white font-semibold text-xs border border-white/20">
            {listing.crop_type}
          </span>

          <div className="flex items-center gap-1.5">
            {listing.ai_grade && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm ${
                listing.ai_grade === 'A' ? 'bg-emerald-500 text-white' :
                listing.ai_grade === 'B' ? 'bg-amber-500 text-white' :
                'bg-slate-700 text-white'
              }`}>
                Grade {listing.ai_grade}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Image Overlay: APMC Mandi Benchmark */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
          <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-medium">
            <MapPin className="w-3 h-3 text-emerald-400" />
            {districtName}
          </span>

          {apmc.isLower && (
            <span className="inline-flex items-center gap-1 bg-emerald-600/90 text-white px-2 py-0.5 rounded-md font-bold text-[11px] shadow">
              <TrendingDown className="w-3 h-3" />
              {apmc.badgeText}
            </span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div>
          {/* Price & Quantity Header */}
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-2xl font-black text-gray-900">₹{listing.price}</span>
              <span className="text-gray-500 text-xs font-medium"> / kg</span>
            </div>

            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
              {listing.qty_avail.toLocaleString()} kg available
            </span>
          </div>

          {/* B2B / B2C Category Tag */}
          <div className="flex items-center gap-2 mb-3">
            {isWholesale ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[11px]">
                <Building2 className="w-3 h-3" /> B2B Wholesale Bulk
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold text-[11px]">
                <ShoppingBag className="w-3 h-3" /> B2C Retail & Direct
              </span>
            )}
            
            <span className="text-[11px] text-gray-500">
              Mandi Benchmark: ₹{apmc.benchmark}/kg
            </span>
          </div>

          {/* Demand Pooling / Group Buying Widget */}
          {listing.pooling_enabled && (
            <div className="bg-purple-50/80 rounded-xl p-3 border border-purple-100 space-y-1.5 mb-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-purple-900 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-purple-600" /> Group Buying Active
                </span>
                <span className="font-semibold text-purple-700">{poolProgress}% Filled</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-purple-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${poolProgress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-purple-700">
                <span>Target: {poolingThreshold} kg</span>
                <button
                  onClick={(e) => onOpenPoolModal(e, listing)}
                  className="font-bold text-purple-800 hover:text-purple-950 underline underline-offset-2"
                >
                  Join Pool →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Farmer Trust Info & Action Buttons */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar 
              name={listing.farmers?.full_name || 'Farmer'} 
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate flex items-center gap-1">
                <span>{listing.farmers?.full_name || 'Verified Kisan'}</span>
                {listing.farmers?.is_verified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" title="Kisan Verified" />
                )}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-gray-700">{listing.farmers?.trust_score || 88}</span>
                <span>Trust Score</span>
              </div>
            </div>
          </div>

          <Link
            to={`/buyer/listing/${listing.id}`}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shrink-0 shadow-sm"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  )
}