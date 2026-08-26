// Farmer Dashboard - Modern UI with real-time stats
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
import { 
  TrendingUp, Package, DollarSign, Star, Mic, Camera, Stethoscope, 
  ArrowRight, Clock, CheckCircle, Truck, AlertTriangle, 
  ShoppingBag, BarChart2, Plus, Tractor
} from 'lucide-react'
import { Card, CardHeader, Button, Badge, Avatar } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { formatCurrency, formatDate } from '../../lib/utils'

const statCards = [
  { key: 'activeListings', icon: Package, label: 'dashboard.stats.activeListings', color: 'text-blue-600', bg: 'bg-blue-100', link: '/farmer/inventory' },
  { key: 'pendingOrders', icon: Clock, label: 'dashboard.stats.pendingOrders', color: 'text-yellow-600', bg: 'bg-yellow-100', link: '/farmer/orders' },
  { key: 'totalEarnings', icon: DollarSign, label: 'dashboard.stats.totalEarnings', color: 'text-green-600', bg: 'bg-green-100', link: '/farmer/wallet' },
  { key: 'trustScore', icon: Star, label: 'dashboard.stats.trustScore', color: 'text-amber-600', bg: 'bg-amber-100', link: '/farmer/profile' },
]

const quickActions = [
  { path: '/farmer/create-listing', icon: Plus, label: 'dashboard.quickActions.createListing', color: 'bg-blue-600 hover:bg-blue-700', description: 'dashboard.quickActions.createListingDesc' },
  { path: '/farmer/kisan-vani', icon: Mic, label: 'dashboard.quickActions.voiceListing', color: 'bg-amber-600 hover:bg-amber-700', description: 'dashboard.quickActions.voiceListingDesc' },
  { path: '/farmer/crop-doctor', icon: Stethoscope, label: 'dashboard.quickActions.cropDoctor', color: 'bg-green-600 hover:bg-green-700', description: 'dashboard.quickActions.cropDoctorDesc' },
  { path: '/farmer/orders', icon: Package, label: 'dashboard.quickActions.viewOrders', color: 'bg-purple-600 hover:bg-purple-700', description: 'dashboard.quickActions.viewOrdersDesc' },
]

export default function FarmerDashboard() {
  const { t } = useTranslation('farmer')
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  
  const [stats, setStats] = useState({
    activeListings: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    trustScore: 50,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentOrders()
  }, [profile])

  const fetchStats = async () => {
    if (!profile?.farmer_id) return
    
    try {
      // Step 1: Get farmer's listing IDs
      const { data: farmerListings } = await supabase
        .from('produce_listings')
        .select('id')
        .eq('farmer_id', profile.farmer_id)

      const listingIds = farmerListings?.map(l => l.id) || []

      // Step 2: Count active listings
      const { count: activeCount } = await supabase
        .from('produce_listings')
        .select('id', { count: 'exact' })
        .eq('farmer_id', profile.farmer_id)
        .eq('is_active', true)

      // Step 3: Count pending orders (only if listings exist)
      let pendingCount = 0
      let earnings = 0
      if (listingIds.length > 0) {
        const { count } = await supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .in('listing_id', listingIds)
          .eq('status', 'Pending')
        pendingCount = count || 0

        // Step 4: Get order IDs for earnings
        const { data: farmerOrders } = await supabase
          .from('orders')
          .select('id')
          .in('listing_id', listingIds)

        const orderIds = farmerOrders?.map(o => o.id) || []
        if (orderIds.length > 0) {
          const { data: txns } = await supabase
            .from('transactions')
            .select('amount')
            .eq('status', 'Released')
            .in('order_id', orderIds)
          earnings = txns?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
        }
      }

      setStats({
        activeListings: activeCount || 0,
        pendingOrders: pendingCount,
        totalEarnings: earnings,
        trustScore: profile.trust_score || 50,
      })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const fetchRecentOrders = async () => {
    if (!profile?.farmer_id) return
    try {
      const { data: farmerListings } = await supabase
        .from('produce_listings')
        .select('id')
        .eq('farmer_id', profile.farmer_id)

      const listingIds = farmerListings?.map(l => l.id) || []
      if (listingIds.length === 0) {
        setRecentOrders([])
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          produce_listings!inner(crop_type, price),
          buyers(full_name, buyer_type)
        `)
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!error) setRecentOrders(data || [])
    } catch (err) {
      console.error('Failed to fetch recent orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTrustScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusConfig = (status) => {
    const configs = {
      Pending: { label: 'Pending', color: 'text-yellow-600 bg-yellow-100', icon: Clock },
      Accepted: { label: 'Accepted', color: 'text-blue-600 bg-blue-100', icon: CheckCircle },
      Dispatched: { label: 'Dispatched', color: 'text-purple-600 bg-purple-100', icon: Truck },
      Completed: { label: 'Completed', color: 'text-green-600 bg-green-100', icon: CheckCircle },
      Disputed: { label: 'Disputed', color: 'text-red-600 bg-red-100', icon: AlertTriangle },
    }
    return configs[status] || { label: status, color: 'text-gray-600 bg-gray-100', icon: Package }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="h-24" />
          ))}
        </div>
        <Card className="h-64" />
        <Card className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Premium Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-green-500 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
        <div className="absolute bottom-0 right-16 -mb-8 w-24 h-24 rounded-full bg-white opacity-10"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-3xl font-bold">
              {t('dashboard.welcome', { name: profile?.full_name || 'Farmer' })}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-primary-50">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-300 fill-current" />
                Trust Score: {stats.trustScore}
              </span>
              <span>•</span>
              <span>{profile?.district || 'Location not set'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-sm font-medium shadow-sm flex items-center gap-2">
              <Tractor className="w-4 h-4" />
              {t('profile.farmer') || 'Verified Farmer'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = stats[card.key]
          return (
            <Link key={card.key} to={card.link} className="block group">
              <Card className="group-hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={`w-7 h-7 ${card.color}`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {card.key === 'totalEarnings' ? formatCurrency(value) : value}
                  </p>
                  <p className="text-gray-500 text-sm">{t(card.label)}</p>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader 
            title={t('dashboard.quickActions')} 
            description={t('dashboard.quickActionsDesc')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.path} to={action.path} className="group">
                  <button className={`w-full ${action.color} text-white p-6 rounded-xl flex flex-col items-center gap-3 text-left group-hover:opacity-90 transition-all shadow-lg shadow-primary-500/20`}>
                    <Icon className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <p className="font-semibold text-lg">{t(action.label)}</p>
                      <p className="text-white/80 text-sm">{t(action.description)}</p>
                    </div>
                  </button>
                </Link>
              )
            })}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader 
            title={t('dashboard.recentOrders')} 
            description={t('dashboard.recentOrdersDesc')}
            action={
              <Link to="/farmer/orders" className="text-sm text-primary-600 hover:underline font-medium">
                {t('dashboard.viewAll')}
              </Link>
            }
          />
          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">{t('dashboard.noRecentOrders')}</p>
              <Link to="/farmer/create-listing">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  {t('dashboard.createFirstListing')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const listing = order.produce_listings
                const buyer = order.buyers
                const config = getStatusConfig(order.status)
                const StatusIcon = config.icon
                
                return (
                  <Link key={order.id} to={`/farmer/orders`} className="block">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary-100 rounded-xl">
                          <Package className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{listing.crop_type}</p>
                          <p className="text-sm text-gray-500">{buyer?.full_name} • {formatCurrency(order.total_cost)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={config.color.replace('text-', '').replace(' bg-', '')} size="sm" dot={true}>
                          {config.label}
                        </Badge>
                        <span className="text-gray-500 text-sm">{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}