// UserVerification - Admin user verification
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { Loader2, User, Shield, CheckCircle, XCircle, Search, Filter, Eye, AlertCircle } from 'lucide-react'

export default function UserVerification() {
  const { t } = useTranslation('common')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, verified, rejected
  const [search, setSearch] = useState('')
  const [verifying, setVerifying] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          farmers(full_name, district, is_verified, trust_score, kyc_document_url, land_size),
          buyers(full_name, buyer_type, biz_name, trust_score, address)
        `)
        .order('created_at', { ascending: false })

      if (filter === 'pending') {
        query = query.or('farmers.is_verified.eq.false,buyers.is_verified.eq.false')
      } else if (filter === 'verified') {
        query = query.or('farmers.is_verified.eq.true,buyers.is_verified.eq.true')
      }

      const { data, error } = await query
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (userId, role, verify) => {
    setVerifying(userId)
    try {
      const table = role === 'farmer' ? 'farmers' : 'buyers'
      const idField = role === 'farmer' ? 'farmer_id' : 'buyer_id'
      
      const { error } = await supabase
        .from(table)
        .update({ is_verified: verify })
        .eq(idField, userId)

      if (error) throw error
      fetchUsers()
    } catch (err) {
      console.error('Failed to verify user:', err)
    } finally {
      setVerifying(null)
    }
  }

  const getRole = (user) => {
    if (user.farmers) return 'farmer'
    if (user.buyers) return 'buyer'
    return user.role
  }

  const getProfile = (user) => user.farmers || user.buyers

  const filteredUsers = users.filter(u => {
    const profile = getProfile(u)
    if (!profile) return false
    const name = profile.full_name?.toLowerCase() || ''
    const phone = u.phone?.toLowerCase() || ''
    return name.includes(search.toLowerCase()) || phone.includes(search.toLowerCase())
  })

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Verification</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-64"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-40">
            <option value="all">All Users</option>
            <option value="pending">Pending Verification</option>
            <option value="verified">Verified</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="pb-3 font-semibold">User</th>
              <th className="pb-3 font-semibold">Role</th>
              <th className="pb-3 font-semibold">Profile</th>
              <th className="pb-3 font-semibold">Trust Score</th>
              <th className="pb-3 font-semibold">KYC</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map((user) => {
              const role = getRole(user)
              const profile = getProfile(user)
              const isVerified = profile?.is_verified || false
              const hasKyc = role === 'farmer' && profile?.kyc_document_url

              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium">{profile?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{user.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      role === 'farmer' ? 'bg-green-100 text-green-800' :
                      role === 'buyer' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {role}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-gray-600">
                    {role === 'farmer' 
                      ? `${profile?.district} • ${profile?.land_size} acres`
                      : `${profile?.buyer_type} • ${profile?.biz_name || 'Individual'}`
                    }
                  </td>
                  <td className="py-4">
                    <span className="font-medium">{profile?.trust_score || 50}</span>
                  </td>
                  <td className="py-4">
                    {hasKyc ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Uploaded</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>
                    )}
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-4">
                    {!isVerified && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerify(user.id, role, true)}
                          disabled={verifying === user.id}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {verifying === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleVerify(user.id, role, false)}
                          disabled={verifying === user.id}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {isVerified && (
                      <span className="text-green-600 text-sm">✓ Verified</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="card text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No users found matching your criteria</p>
        </div>
      )}
    </div>
  )
}