// DisputeResolution - Admin dispute resolution
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { Loader2, AlertTriangle, CheckCircle, XCircle, Scale, Eye, FileText, MessageSquare, Shield, Clock } from 'lucide-react'

export default function DisputeResolution() {
  const { t } = useTranslation('common')
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, open, resolved
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [resolving, setResolving] = useState(null)

  useEffect(() => {
    fetchDisputes()
  }, [filter])

  const fetchDisputes = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('disputes')
        .select(`
          *,
          orders!inner(
            id, quantity, total_cost, status,
            buyer_id, listing_id,
            buyers!inner(full_name, phone),
            produce_listings!inner(crop_type, farmers!inner(full_name, phone))
          ),
          raised_by_user:users!disputes_raised_by_fkey(full_name, phone)
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter.charAt(0).toUpperCase() + filter.slice(1))
      }

      const { data, error } = await query
      if (error) throw error
      setDisputes(data || [])
    } catch (err) {
      console.error('Failed to fetch disputes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (disputeId, resolution) => {
    if (!confirm(`Mark dispute as resolved with "${resolution}"?`)) return
    
    setResolving(disputeId)
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ 
          status: 'Resolved',
          resolution,
          resolved_at: new Date().toISOString()
        })
        .eq('id', disputeId)

      if (error) throw error
      fetchDisputes()
      setSelectedDispute(null)
    } catch (err) {
      console.error('Failed to resolve:', err)
    } finally {
      setResolving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const getStatusBadge = (status) => (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
      status === 'Open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
    }`}>
      {status}
    </span>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dispute Resolution</h1>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-40">
            <option value="all">All Disputes</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Disputes</p>
          <p className="text-2xl font-bold text-gray-900">{disputes.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Open</p>
          <p className="text-2xl font-bold text-red-600">
            {disputes.filter(d => d.status === 'Open').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-bold text-green-600">
            {disputes.filter(d => d.status === 'Resolved').length}
          </p>
        </div>
      </div>

      {/* Disputes List */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="pb-3 font-semibold">Dispute ID</th>
              <th className="pb-3 font-semibold">Order</th>
              <th className="pb-3 font-semibold">Crop</th>
              <th className="pb-3 font-semibold">Raised By</th>
              <th className="pb-3 font-semibold">Reason</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {disputes.map((dispute) => {
              const order = dispute.orders
              const listing = order?.produce_listings
              const buyer = order?.buyers
              const farmer = listing?.farmers
              const raisedBy = dispute.raised_by_user

              return (
                <tr key={dispute.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDispute(dispute)}>
                  <td className="py-4 font-mono text-sm">{dispute.id.slice(0, 8)}...</td>
                  <td className="py-4 font-mono text-sm">{order?.id?.slice(0, 8)}...</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                      {listing?.crop_type}
                    </span>
                  </td>
                  <td className="py-4">
                    <p className="font-medium">{raisedBy?.full_name}</p>
                    <p className="text-sm text-gray-500">{raisedBy?.phone}</p>
                  </td>
                  <td className="py-4">
                    <p className="text-sm text-gray-600 max-w-xs truncate">{dispute.reason}</p>
                  </td>
                  <td className="py-4">{getStatusBadge(dispute.status)}</td>
                  <td className="py-4 text-sm text-gray-500">
                    {new Date(dispute.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    {dispute.status === 'Open' && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResolve(dispute.id, 'refund') }}
                          disabled={resolving === dispute.id}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          Refund Buyer
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResolve(dispute.id, 'release') }}
                          disabled={resolving === dispute.id}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Release to Farmer
                        </button>
                      </div>
                    )}
                    {dispute.status === 'Resolved' && (
                      <span className={`text-sm font-medium ${
                        dispute.resolution === 'refund' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {dispute.resolution === 'refund' ? 'Refunded' : 'Released'}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {disputes.length === 0 && (
        <div className="card text-center py-12">
          <Scale className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No disputes found</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Dispute Details</h2>
              <button onClick={() => setSelectedDispute(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Dispute ID</p>
                  <p className="font-mono">{selectedDispute.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p>{getStatusBadge(selectedDispute.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono">{selectedDispute.orders?.id?.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Crop</p>
                  <p>{selectedDispute.orders?.produce_listings?.crop_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Raised By</p>
                  <p>{selectedDispute.raised_by_user?.full_name} ({selectedDispute.raised_by_user?.phone})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p>{new Date(selectedDispute.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-2">Reason</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedDispute.reason}</p>
              </div>

              {selectedDispute.evidence_urls && selectedDispute.evidence_urls.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-2">Evidence</h3>
                  <div className="flex gap-4">
                    {selectedDispute.evidence_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm hover:bg-primary-100">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Evidence {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedDispute.status === 'Resolved' && (
                <div className="border-t pt-6 bg-green-50 rounded-xl p-4">
                  <h3 className="font-semibold mb-2">Resolution</h3>
                  <p className="text-green-700">
                    {selectedDispute.resolution === 'refund' 
                      ? 'Funds refunded to buyer. Stock released back to farmer.' 
                      : 'Funds released to farmer. Order marked complete.'}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Resolved on {new Date(selectedDispute.resolved_at).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedDispute.status === 'Open' && (
                <div className="border-t pt-6 flex gap-4">
                  <button
                    onClick={() => handleResolve(selectedDispute.id, 'refund')}
                    disabled={resolving === selectedDispute.id}
                    className="btn-primary flex-1"
                  >
                    {resolving === selectedDispute.id ? <Loader2 className="animate-spin w-5 h-5" /> : 'Refund Buyer'}
                  </button>
                  <button
                    onClick={() => handleResolve(selectedDispute.id, 'release')}
                    disabled={resolving === selectedDispute.id}
                    className="btn-primary flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Release to Farmer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}