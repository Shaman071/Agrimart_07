// WalletPayouts - Farmer's wallet and payouts
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, DollarSign, Clock, CheckCircle, XCircle, Banknote, CreditCard, Plus } from 'lucide-react'

export default function WalletPayouts() {
  const { t } = useTranslation('farmer')
  const { profile } = useAuth()
  const [wallet, setWallet] = useState({ balance: 0, pending: 0, totalEarned: 0 })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBankForm, setShowBankForm] = useState(false)
  const [bankDetails, setBankDetails] = useState({ account_holder: '', account_number: '', ifsc: '', bank_name: '' })
  const [savingBank, setSavingBank] = useState(false)

  useEffect(() => {
    fetchWallet()
  }, [profile])

  const fetchWallet = async () => {
    if (!profile?.farmer_id) return
    setLoading(true)
    try {
      // Get released transactions (completed earnings)
      const { data: released } = await supabase
        .from('transactions')
        .select('amount, created_at, orders!inner(produce_listings!inner(farmer_id))')
        .eq('status', 'Released')
        .eq('orders.produce_listings.farmer_id', profile.farmer_id)

      // Get locked transactions (pending)
      const { data: locked } = await supabase
        .from('transactions')
        .select('amount, created_at, orders!inner(produce_listings!inner(farmer_id))')
        .eq('status', 'Locked')
        .eq('orders.produce_listings.farmer_id', profile.farmer_id)

      const balance = released?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const pending = locked?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const totalEarned = balance + pending

      setWallet({ balance, pending, totalEarned })

      // Fetch all transactions for history
      const { data: allTxns } = await supabase
        .from('transactions')
        .select(`
          *,
          orders!inner(
            id,
            total_cost,
            produce_listings!inner(crop_type, farmer_id)
          )
        `)
        .eq('orders.produce_listings.farmer_id', profile.farmer_id)
        .order('created_at', { ascending: false })
        .limit(50)

      setTransactions(allTxns || [])
    } catch (err) {
      console.error('Failed to fetch wallet:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveBankDetails = async () => {
    setSavingBank(true)
    try {
      const { error } = await supabase
        .from('farmers')
        .update({ bank_details: bankDetails })
        .eq('farmer_id', profile.farmer_id)
      
      if (error) throw error
      setShowBankForm(false)
    } catch (err) {
      console.error('Failed to save bank details:', err)
    } finally {
      setSavingBank(false)
    }
  }

  const requestPayout = async () => {
    // In production, integrate with Razorpay payouts
    alert('Payout request feature requires Razorpay integration. This is a demo.')
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
      <div className="farmer-card">
        <h1 className="text-2xl font-bold text-farmer-text">{t('wallet.title')}</h1>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="farmer-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-farmer-text/70 text-sm">{t('wallet.balance')}</p>
              <p className="text-3xl font-bold text-farmer-text">₹{wallet.balance.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="farmer-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-farmer-text/70 text-sm">{t('wallet.pending')}</p>
              <p className="text-3xl font-bold text-farmer-text">₹{wallet.pending.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="farmer-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-farmer-text/70 text-sm">{t('wallet.totalEarned')}</p>
              <p className="text-3xl font-bold text-farmer-text">₹{wallet.totalEarned.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Banknote className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="farmer-card">
        <div className="flex flex-wrap gap-4">
          <button onClick={requestPayout} className="farmer-btn">
            <CreditCard className="w-5 h-5" />
            {t('wallet.requestPayout')}
          </button>
          <button onClick={() => setShowBankForm(true)} className="farmer-btn bg-white text-farmer-text border-2 border-farmer-accent">
            <Plus className="w-5 h-5" />
            {t('wallet.updateBank')}
          </button>
        </div>
      </div>

      {/* Transactions */}
      <div className="farmer-card">
        <h2 className="text-farmer-xl text-farmer-text mb-4">{t('wallet.transactions')}</h2>
        {transactions.length === 0 ? (
          <p className="text-farmer-text/70 text-center py-8">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-farmer-accent/30 text-left text-sm text-farmer-text/70">
                  <th className="pb-3 font-semibold">{t('wallet.date')}</th>
                  <th className="pb-3 font-semibold">{t('wallet.description')}</th>
                  <th className="pb-3 font-semibold">{t('wallet.amount')}</th>
                  <th className="pb-3 font-semibold">{t('wallet.type')}</th>
                  <th className="pb-3 font-semibold">{t('wallet.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farmer-accent/20">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-farmer-bg/50">
                    <td className="py-3 text-sm text-farmer-text">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-sm text-farmer-text">
                      Order #{txn.orders?.id?.slice(0, 8)} - {txn.orders?.produce_listings?.crop_type}
                    </td>
                    <td className="py-3 font-medium text-farmer-text">
                      ₹{Number(txn.amount).toLocaleString()}
                    </td>
                    <td className="py-3 text-sm text-farmer-text/70">
                      {txn.status === 'Released' ? 'Payout' : txn.status === 'Locked' ? 'Escrow' : 'Refund'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        txn.status === 'Released' ? 'bg-green-100 text-green-800' :
                        txn.status === 'Locked' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bank Details Modal */}
      {showBankForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="farmer-card w-full max-w-md">
            <h2 className="text-farmer-xl text-farmer-text mb-4">{t('wallet.bankDetails')}</h2>
            <div className="space-y-4">
              <input
                placeholder="Account Holder Name"
                value={bankDetails.account_holder}
                onChange={(e) => setBankDetails({...bankDetails, account_holder: e.target.value})}
                className="input-field text-farmer-text bg-white"
              />
              <input
                placeholder="Account Number"
                value={bankDetails.account_number}
                onChange={(e) => setBankDetails({...bankDetails, account_number: e.target.value})}
                className="input-field text-farmer-text bg-white"
              />
              <input
                placeholder="IFSC Code"
                value={bankDetails.ifsc}
                onChange={(e) => setBankDetails({...bankDetails, ifsc: e.target.value})}
                className="input-field text-farmer-text bg-white"
              />
              <input
                placeholder="Bank Name"
                value={bankDetails.bank_name}
                onChange={(e) => setBankDetails({...bankDetails, bank_name: e.target.value})}
                className="input-field text-farmer-text bg-white"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveBankDetails} disabled={savingBank} className="farmer-btn flex-1">
                {savingBank ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowBankForm(false)} className="farmer-btn flex-1 bg-white text-farmer-text border-2 border-farmer-accent">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}