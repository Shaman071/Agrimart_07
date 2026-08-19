// Farmer Dashboard
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { TrendingUp, Package, DollarSign, Star, Mic, Camera, Stethoscope, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const statCards = [
  { key: 'activeListings', icon: Package, color: 'bg-blue-500', bg: 'bg-blue-100' },
  { key: 'pendingOrders', icon: TrendingUp, color: 'bg-yellow-500', bg: 'bg-yellow-100' },
  { key: 'totalEarnings', icon: DollarSign, color: 'bg-green-500', bg: 'bg-green-100' },
  { key: 'trustScore', icon: Star, color: 'bg-farmer-accent', bg: 'bg-yellow-100' },
]

const quickActions = [
  { path: '/farmer/create-listing', icon: Package, label: 'farmer.dashboard.quickActions.createListing', color: 'bg-blue-500' },
  { path: '/farmer/kisan-vani', icon: Mic, label: 'farmer.dashboard.quickActions.voiceListing', color: 'bg-farmer-accent' },
  { path: '/farmer/crop-doctor', icon: Stethoscope, label: 'farmer.dashboard.quickActions.cropDoctor', color: 'bg-green-500' },
  { path: '/farmer/orders', icon: Package, label: 'farmer.dashboard.quickActions.viewOrders', color: 'bg-purple-500' },
]

export default function FarmerDashboard() {
  const { t } = useTranslation('farmer')
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    activeListings: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    trustScore: 50,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [profile])

  const fetchStats = async () => {
    if (!profile?.farmer_id) return
    
    try {
      const [listings, orders, transactions] = await Promise.all([
        supabase.from('produce_listings').select('id', { count: 'exact' }).eq('farmer_id', profile.farmer_id).eq('is_active', true),
        supabase.from('orders').select('id', { count: 'exact' }).eq('listing_id', 'farmer_id').eq('status', 'Pending'),
        supabase.from('transactions').select('amount').eq('status', 'Released'),
      ])

      // Get farmer's orders through listings
      const { data: farmerListings } = await supabase
        .from('produce_listings')
        .select('id')
        .eq('farmer_id', profile.farmer_id)

      const listingIds = farmerListings?.map(l => l.id) || []
      let pendingCount = 0
      if (listingIds.length > 0) {
        const { count } = await supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .in('listing_id', listingIds)
          .eq('status', 'Pending')
        pendingCount = count || 0
      }

      const earnings = transactions.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

      setStats({
        activeListings: listings.count || 0,
        pendingOrders: pendingCount,
        totalEarnings: earnings,
        trustScore: profile.trust_score || 50,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-farmer-accent border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="farmer-card">
        <h1 className="text-2xl font-bold text-farmer-text mb-2">
          {t('dashboard.welcome', { name: profile?.full_name || 'Farmer' })}
        </h1>
        <p className="text-farmer-text/70">{profile?.district} • {t('dashboard.stats.trustScore')}: {stats.trustScore}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const value = stats[card.key]
          return (
            <Link
              key={card.key}
              to={index === 0 ? '/farmer/inventory' : index === 1 ? '/farmer/orders' : index === 2 ? '/farmer/wallet' : '/farmer/profile'}
              className="farmer-card block group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`w-7 h-7 ${card.color}`} />
                </div>
                <ArrowRight className="w-6 h-6 text-farmer-text/50 group-hover:text-farmer-accent transition-colors" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-farmer-text">{card.key === 'totalEarnings' ? `₹${value.toLocaleString()}` : value}</p>
                <p className="text-farmer-text/70 text-sm">{t(`dashboard.stats.${card.key}`)}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="farmer-card">
        <h2 className="text-farmer-xl text-farmer-text mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.path}
                to={action.path}
                className={`farmer-btn flex flex-col items-center space-y-3 ${action.color} group`}
              >
                <Icon className="w-10 h-10 group-hover:scale-110 transition-transform" />
                <span className="text-center">{t(action.label)}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="farmer-card">
        <h2 className="text-farmer-xl text-farmer-text mb-4">{t('dashboard.recentActivity')}</h2>
        <div className="space-y-3">
          <p className="text-farmer-text/70 text-center py-8">No recent activity. Create your first listing to get started!</p>
        </div>
      </div>
    </div>
  )
}