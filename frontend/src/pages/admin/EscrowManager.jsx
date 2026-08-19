// EscrowManager - Admin escrow management
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { Loader2, DollarSign, Shield, CheckCircle, XCircle, Clock, Eye, Filter, Search } from 'lucide-react'

export default function EscrowManager() {
  const { t } = useTranslation('common')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, locked, released, refunded
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(null)

  useEffect(() => {
    fetchTransactions()
  }, [filter])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          orders!inner(
            id, quantity, total_cost, status,
            buyer_id, listing_id,
            buyers!inner(full_name),
            produce_listings!inner(crop_type, farmers!inner(full_name))
          )
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter.charAt(0).toUpperCase() + filter.slice(1))
      }

      const { data, error } = await query
      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRelease = async (transactionId, orderId) => {
    setProcessing(transactionId)
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'Released' })
        .eq('id', transactionId)

      if (error) throw error

      // Also update order status
      await supabase
        .from('orders')
        .update({ status: 'Completed' })
        .eq('id', orderId)

      fetchTransactions()
    } catch (err) {
      console.error('Failed to release:', err)
    } finally {
      setProcessing(null)
    }
  }

  const handleRefund = async (transactionId, orderId) => {
    if (!confirm('Refund this transaction? This will return funds to buyer and release reserved stock.')) return
    
    setProcessing(transactionId)
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'Refunded' })
        .eq('id', transactionId)

      if (error) throw error

      await supabase
        .from('orders')
        .update({ status: 'Disputed' })
        .eq('id', orderId)

      // Release stock back to available
      const { data: order } = await supabase
        .from('orders')
        .select('listing_id, quantity')
        .eq('id', orderId)
        .single()

      if (order) {
        await supabase.rpc('release_stock', { p_listing_id: order.listing_id, p_qty: order.quantity })
      }

      fetchTransactions()
    } catch (err) {
      console.error('Failed to refund:', err)
    } finally {
      setProcessing(null)
    }
  }

  const filteredTransactions = transactions.filter(t => {
    const order = t.orders
    const buyer = order?.buyers?.full_name || ''
    const farmer = order?.produce_listings?.farmers?.full_name || ''
    const crop = order?.produce_listings?.crop_type || ''
    return buyer.toLowerCase().includes(search.toLowerCase()) ||
           farmer.toLowerCase().includes(search.toLowerCase()) ||
           crop.toLowerCase().includes(search.toLowerCase())
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'Locked': return 'bg-yellow-100 text-yellow-800'
      case 'Released': return 'bg-green-100 text-green-800'
      case 'Refunded': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Escrow Manager</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search buyer, farmer, crop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-64"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-40">
            <option value="all">All</option>
            <option value="locked">Locked</option>
            <option value="released">Released</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Locked</p>
          <p className="text-2xl font-bold text-yellow-600">
            ₹{transactions.filter(t => t.status === 'Locked').reduce((sum, t) => sum + Number(t.amount), 0).toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Released</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{transactions.filter(t => t.status === 'Released').reduce((sum, t) => sum + Number(t.amount), 0).toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Refunded</p>
          <p className="text-2xl font-bold text-red-600">
            ₹{transactions.filter(t => t.status === 'Refunded').reduce((sum, t) => sum + Number(t.amount), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="pb-3 font-semibold">Transaction</th>
              <th className="pb-3 font-semibold">Order</th>
              <th className="pb-3 font-semibold">Crop</th>
              <th className="pb-3 font-semibold">Buyer / Farmer</th>
              <th className="pb-3 font-semibold">Amount</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredTransactions.map((txn) => {
              const order = txn.orders
              const listing = order?.produce_listings
              const buyer = order?.buyers
              const farmer = listing?.farmers

              return (
                <tr key={txn.id} className="hover:bg-gray-50">
                  <td className="py-4 font-mono text-sm">{txn.id.slice(0, 8)}...</td>
                  <td className="py-4 font-mono text-sm">{order?.id?.slice(0, 8)}...</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                      {listing?.crop_type}
                    </span>
                  </td>
                  <td className="py-4 text-sm">
                    <p>{buyer?.full_name}</p>
                    <p className="text-gray-500">{farmer?.full_name}</p>
                  </td>
                  <td className="py-4 font-semibold">₹{Number(txn.amount).toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-gray-500">
                    {new Date(txn.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      {txn.status === 'Locked' && (
                        <>
                          <button
                            onClick={() => handleRelease(txn.id, order.id)}
                            disabled={processing === txn.id}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            {processing === txn.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Release'}
                          </button>
                          <button
                            onClick={() => handleRefund(txn.id, order.id)}
                            disabled={processing === txn.id}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            Refund
                          </button>
                        </>
                      )}
                      {txn.status === 'Released' && (
                        <span className="text-green-600 text-sm">✓ Released</span>
                      )}
                      {txn.status === 'Refunded' && (
                        <span className="text-red-600 text-sm">↩ Refunded</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="card text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No transactions found</p>
        </div>
      )}
    </div>
  )
}

const getStatusColor = (status) => {
  switch (status) {
    case 'Locked': return 'bg-yellow-100 text-yellow-800'
    case 'Released': return 'bg-green-100 text-green-800'
    case 'Refunded': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}