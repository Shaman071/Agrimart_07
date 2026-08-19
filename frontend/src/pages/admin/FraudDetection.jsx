// FraudDetection - Admin fraud monitoring
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { Loader2, AlertTriangle, Shield, Search, Filter, Eye, User, Flag, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function FraudDetection() {
  const { t } = useTranslation('common')
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, high, medium, low
  const [search, setSearch] = useState('')
  const [scanning, setScanning] = useState(false)
  const [selectedFlag, setSelectedFlag] = useState(null)

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    setLoading(true)
    try {
      // In production, call backend /fraud/score-account for all users
      // For now, mock data based on users table
      const { data: users } = await supabase
        .from('users')
        .select(`
          *,
          farmers(full_name, district, trust_score, is_verified, kyc_document_url),
          buyers(full_name, buyer_type, trust_score, address, gstin)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (users) {
        const mockFlags = users.map(user => {
          const role = user.farmers ? 'farmer' : user.buyers ? 'buyer' : 'unknown'
          const profile = user.farmers || user.buyers
          const trustScore = profile?.trust_score || 50
          
          let riskLevel = 'MINIMAL'
          let score = 10
          const reasons = []

          if (trustScore < 20) { riskLevel = 'HIGH'; score = 80; reasons.push('LOW_TRUST_SCORE') }
          else if (trustScore < 40) { riskLevel = 'MEDIUM'; score = 45; reasons.push('LOW_TRUST_SCORE') }
          else if (trustScore < 60) { riskLevel = 'LOW'; score = 25; }

          if (!profile?.is_verified && role === 'farmer') {
            riskLevel = riskLevel === 'MINIMAL' ? 'LOW' : riskLevel
            score = Math.max(score, 30)
            reasons.push('INCOMPLETE_FARMER_PROFILE')
          }

          if (role === 'buyer' && !profile?.address) {
            riskLevel = riskLevel === 'MINIMAL' ? 'LOW' : riskLevel
            score = Math.max(score, 25)
            reasons.push('INCOMPLETE_BUYER_PROFILE')
          }

          // Random chance for demo
          if (Math.random() < 0.1) {
            riskLevel = 'HIGH'
            score = 85
            reasons.push('MULTIPLE_ACCOUNTS_24H')
          }

          return {
            id: user.id,
            user_id: user.id,
            phone: user.phone,
            role,
            name: profile?.full_name,
            risk_level: riskLevel,
            score,
            reasons,
            created_at: user.created_at,
            details: { trustScore, verified: profile?.is_verified }
          }
        }).filter(f => f.risk_level !== 'MINIMAL')
          .sort((a, b) => b.score - a.score)

        setFlags(mockFlags)
      }
    } catch (err) {
      console.error('Failed to fetch fraud flags:', err)
    } finally {
      setLoading(false)
    }
  }

  const scanUser = async (userId, role) => {
    setScanning(true)
    try {
      const session = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE}/fraud/score-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({ user_id: userId, role })
      })
      const data = await response.json()
      alert(`Fraud Score: ${data.score} (${data.risk_level})\nReasons: ${data.reason_codes.join(', ')}`)
    } catch (err) {
      alert('Scan failed: ' + err.message)
    } finally {
      setScanning(false)
    }
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-blue-100 text-blue-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const filteredFlags = flags.filter(f => {
    if (filter !== 'all' && f.risk_level.toLowerCase() !== filter) return false
    const name = f.name?.toLowerCase() || ''
    const phone = f.phone?.toLowerCase() || ''
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
        <h1 className="text-2xl font-bold text-gray-900">Fraud Detection</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-64"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-40">
            <option value="all">All Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
          <button onClick={fetchFlags} disabled={scanning} className="btn-secondary">
            <TrendingUp className="w-4 h-4 mr-2" />
            Rescan All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card border-l-4 border-red-500">
          <p className="text-sm text-gray-500">High Risk</p>
          <p className="text-2xl font-bold text-red-600">
            {flags.filter(f => f.risk_level === 'HIGH').length}
          </p>
        </div>
        <div className="card border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Medium Risk</p>
          <p className="text-2xl font-bold text-yellow-600">
            {flags.filter(f => f.risk_level === 'MEDIUM').length}
          </p>
        </div>
        <div className="card border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Low Risk</p>
          <p className="text-2xl font-bold text-blue-600">
            {flags.filter(f => f.risk_level === 'LOW').length}
          </p>
        </div>
        <div className="card border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Total Flagged</p>
          <p className="text-2xl font-bold text-gray-900">{flags.length}</p>
        </div>
      </div>

      {/* Reason Code Legend */}
      <div className="card">
        <h3 className="font-semibold mb-3">Reason Codes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {[
            { code: 'PRICE_BELOW_MEDIAN_40PCT', desc: 'Price >40% below median' },
            { code: 'MULTIPLE_ACCOUNTS_24H', desc: '≥3 accounts/device/24h' },
            { code: 'LOW_TRUST_SCORE', desc: 'Trust score < 20' },
            { code: 'INCOMPLETE_FARMER_PROFILE', desc: 'Missing farmer info' },
            { code: 'INCOMPLETE_BUYER_PROFILE', desc: 'Missing buyer info' },
            { code: 'SUSPICIOUS_PHONE_PATTERN', desc: 'Fake phone pattern' },
            { code: 'NEW_ACCOUNT_HIGH_VALUE', desc: 'New acct, high value' },
            { code: 'POTENTIAL_DUPLICATE_LISTING', desc: 'Duplicate listing' },
          ].map(r => (
            <div key={r.code} className="p-2 bg-gray-50 rounded-lg">
              <p className="font-mono text-xs text-gray-600">{r.code}</p>
              <p className="text-xs text-gray-500">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Flags Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="pb-3 font-semibold">User</th>
              <th className="pb-3 font-semibold">Role</th>
              <th className="pb-3 font-semibold">Risk Level</th>
              <th className="pb-3 font-semibold">Score</th>
              <th className="pb-3 font-semibold">Reasons</th>
              <th className="pb-3 font-semibold">Trust Score</th>
              <th className="pb-3 font-semibold">Verified</th>
              <th className="pb-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredFlags.map((flag) => (
              <tr key={flag.id} className="hover:bg-gray-50">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium">{flag.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{flag.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    flag.role === 'farmer' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {flag.role}
                  </span>
                </td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(flag.risk_level)}`}>
                    {flag.risk_level}
                  </span>
                </td>
                <td className="py-4 font-mono text-lg">{flag.score}</td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-1">
                    {flag.reasons.map((r, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-4">{flag.details.trustScore}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    flag.details.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {flag.details.verified ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="py-4">
                  <button
                    onClick={() => scanUser(flag.user_id, flag.role)}
                    disabled={scanning}
                    className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
                  >
                    {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rescan'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredFlags.length === 0 && (
        <div className="card text-center py-12">
          <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No fraud flags detected</h3>
          <p className="text-gray-500">All users appear legitimate. Run a rescan to check again.</p>
        </div>
      )}
    </div>
  )
}