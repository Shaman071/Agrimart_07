// SystemMetrics - Admin dashboard
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { Loader2, Users, Package, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, BarChart2 } from 'lucide-react'

export default function SystemMetrics() {
  const { t } = useTranslation('common')
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalFarmers: 0,
    totalBuyers: 0,
    activeListings: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    disputedOrders: 0,
    totalVolume: 0,
    totalValue: 0,
    avgTrustScore: 0,
  })
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState({ orders: [], revenue: [], users: [] })

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const [
        usersRes, farmersRes, buyersRes, listingsRes,
        ordersRes, completedRes, pendingRes, disputedRes,
        volumeRes, valueRes, trustRes
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('farmers').select('id', { count: 'exact' }),
        supabase.from('buyers').select('id', { count: 'exact' }),
        supabase.from('produce_listings').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'Completed'),
        supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'Pending'),
        supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'Disputed'),
        supabase.from('orders').select('quantity'),
        supabase.from('orders').select('total_cost'),
        supabase.from('farmers').select('trust_score'),
      ])

      const totalVolume = volumeRes.data?.reduce((sum, o) => sum + Number(o.quantity), 0) || 0
      const totalValue = valueRes.data?.reduce((sum, o) => sum + Number(o.total_cost), 0) || 0
      const avgTrust = trustRes.data?.length
        ? trustRes.data.reduce((sum, f) => sum + Number(f.trust_score), 0) / trustRes.data.length
        : 0

      setMetrics({
        totalUsers: usersRes.count || 0,
        totalFarmers: farmersRes.count || 0,
        totalBuyers: buyersRes.count || 0,
        activeListings: listingsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        completedOrders: completedRes.count || 0,
        pendingOrders: pendingRes.count || 0,
        disputedOrders: disputedRes.count || 0,
        totalVolume,
        totalValue,
        avgTrustScore: Math.round(avgTrust * 10) / 10,
      })

      // Mock chart data for demo
      setChartData({
        orders: Array.from({ length: 7 }, (_, i) => ({ day: i, count: Math.floor(Math.random() * 50) + 10 })),
        revenue: Array.from({ length: 7 }, (_, i) => ({ day: i, value: Math.floor(Math.random() * 100000) + 50000 })),
        users: Array.from({ length: 7 }, (_, i) => ({ day: i, count: Math.floor(Math.random() * 20) + 5 })),
      })
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}10`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Metrics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={metrics.totalUsers.toLocaleString()} icon={Users} color="blue" />
        <StatCard title="Farmers" value={metrics.totalFarmers.toLocaleString()} icon={Users} color="green" />
        <StatCard title="Buyers" value={metrics.totalBuyers.toLocaleString()} icon={Users} color="purple" />
        <StatCard title="Active Listings" value={metrics.activeListings.toLocaleString()} icon={Package} color="orange" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={metrics.totalOrders.toLocaleString()} icon={Package} color="blue" />
        <StatCard title="Completed" value={metrics.completedOrders.toLocaleString()} icon={CheckCircle} color="green" trend={`${Math.round(metrics.completedOrders / Math.max(metrics.totalOrders, 1) * 100)}% rate`} />
        <StatCard title="Pending" value={metrics.pendingOrders.toLocaleString()} icon={Clock} color="yellow" />
        <StatCard title="Disputed" value={metrics.disputedOrders.toLocaleString()} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Volume" value={`${(metrics.totalVolume / 1000).toFixed(1)}k kg`} icon={TrendingUp} color="blue" />
        <StatCard title="Total Value" value={`₹${(metrics.totalValue / 100000).toFixed(1)}L`} icon={DollarSign} color="green" />
        <StatCard title="Avg Trust Score" value={metrics.avgTrustScore} icon={Shield} color="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Orders (Last 7 Days)</h3>
          <div className="h-64 flex items-end justify-around px-4">
            {chartData.orders.map((d, i) => (
              <div key={i} className="flex-1 max-w-12 flex flex-col items-center">
                <div
                  className="w-full bg-primary-600 rounded-t transition-all hover:bg-primary-700"
                  style={{ height: `${(d.count / 60) * 100}%`, minHeight: '20px' }}
                />
                <span className="text-xs text-gray-500 mt-1">Day {d.day + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Revenue (Last 7 Days)</h3>
          <div className="h-64 flex items-end justify-around px-4">
            {chartData.revenue.map((d, i) => (
              <div key={i} className="flex-1 max-w-12 flex flex-col items-center">
                <div
                  className="w-full bg-green-600 rounded-t transition-all hover:bg-green-700"
                  style={{ height: `${(d.value / 150000) * 100}%`, minHeight: '20px' }}
                />
                <span className="text-xs text-gray-500 mt-1">Day {d.day + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">New Users (Last 7 Days)</h3>
          <div className="h-64 flex items-end justify-around px-4">
            {chartData.users.map((d, i) => (
              <div key={i} className="flex-1 max-w-12 flex flex-col items-center">
                <div
                  className="w-full bg-purple-600 rounded-t transition-all hover:bg-purple-700"
                  style={{ height: `${(d.count / 25) * 100}%`, minHeight: '20px' }}
                />
                <span className="text-xs text-gray-500 mt-1">Day {d.day + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Order Status Distribution</h3>
          <div className="space-y-3">
            {[
              { label: 'Completed', value: metrics.completedOrders, color: 'bg-green-500' },
              { label: 'Pending', value: metrics.pendingOrders, color: 'bg-yellow-500' },
              { label: 'Dispatched', value: metrics.totalOrders - metrics.completedOrders - metrics.pendingOrders - metrics.disputedOrders, color: 'bg-purple-500' },
              { label: 'Disputed', value: metrics.disputedOrders, color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-600">{item.label}</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${metrics.totalOrders > 0 ? (item.value / metrics.totalOrders) * 100 : 0}%` }} />
                </div>
                <span className="w-16 text-sm font-medium text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}