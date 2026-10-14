// WalletPayouts - Farmer's Wallet, Escrow Payouts & Bank Transfer Engine
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { 
  Loader2, DollarSign, Clock, CheckCircle, Banknote, CreditCard, 
  Plus, Shield, ArrowUpRight, CheckCircle2, Building, RefreshCw, Send
} from 'lucide-react'
import { useToast } from '../../components/ui/Toast'

export default function WalletPayouts() {
  const { profile } = useAuth()
  const { success: showSuccess, error: showError } = useToast()
  
  const [wallet, setWallet] = useState({ balance: 24500, pending: 7000, totalEarned: 31500 })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBankForm, setShowBankForm] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [processingPayout, setProcessingPayout] = useState(false)
  
  const [bankDetails, setBankDetails] = useState({
    account_holder: 'Ramesh Gowda',
    account_number: '918239018247',
    ifsc: 'SBIN0004819',
    bank_name: 'State Bank of India',
    upi_id: 'ramesh.gowda@upi'
  })

  useEffect(() => {
    fetchWallet()
  }, [profile])

  const fetchWallet = async () => {
    setLoading(true)
    let activeOrders = []
    
    // Load local active orders
    try {
      const stored = JSON.parse(localStorage.getItem('agrimart_active_orders') || '[]')
      activeOrders = stored
    } catch (e) {}

    // Load local bank details if available
    try {
      const savedBank = JSON.parse(localStorage.getItem('agrimart_bank_details'))
      if (savedBank) setBankDetails(savedBank)
    } catch (e) {}

    // Calculate balances from active orders
    let lockedEscrow = activeOrders.filter(o => o.status === 'Accepted' || o.status === 'Dispatched').reduce((sum, o) => sum + Number(o.total_cost || 0), 0)
    let completedEarnings = activeOrders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + Number(o.total_cost || 0), 0)

    // Baseline demo balance
    let currentBalance = 24500 + completedEarnings
    let pendingBalance = 7000 + lockedEscrow
    let totalLifetime = currentBalance + pendingBalance

    // Transactions list
    let txns = JSON.parse(localStorage.getItem('agrimart_transactions') || '[]')
    if (txns.length === 0) {
      txns = [
        {
          id: 'txn-101',
          created_at: new Date().toISOString(),
          description: 'Escrow Payout - Tomato (Grade A) Order #ord-demo-101',
          amount: 14000,
          type: 'Credit',
          status: 'Released'
        },
        {
          id: 'txn-102',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          description: 'Escrow Hold - Rice (Sona Masoori) Order #ord-demo-102',
          amount: 7000,
          type: 'Escrow Hold',
          status: 'Locked'
        },
        {
          id: 'txn-103',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          description: 'Withdrawal to SBI A/C ...8247',
          amount: 10500,
          type: 'Bank Payout',
          status: 'Completed'
        }
      ]
      localStorage.setItem('agrimart_transactions', JSON.stringify(txns))
    }

    setWallet({ balance: currentBalance, pending: pendingBalance, totalEarned: totalLifetime })
    setTransactions(txns)
    setLoading(false)
  }

  const saveBankDetails = () => {
    localStorage.setItem('agrimart_bank_details', JSON.stringify(bankDetails))
    showSuccess('🎉 Bank & UPI payment details updated successfully!')
    setShowBankForm(false)
  }

  const handleRequestPayout = () => {
    const amt = Number(payoutAmount)
    if (!amt || amt <= 0) {
      showError('Please enter a valid payout amount')
      return
    }
    if (amt > wallet.balance) {
      showError(`Payout amount exceeds available balance (Max: ₹${wallet.balance})`)
      return
    }

    setProcessingPayout(true)
    setTimeout(() => {
      const newBalance = wallet.balance - amt
      const newTxn = {
        id: `txn_${Date.now()}`,
        created_at: new Date().toISOString(),
        description: `Instant Payout to ${bankDetails.bank_name} (${bankDetails.account_number.slice(-4)})`,
        amount: amt,
        type: 'Bank Payout',
        status: 'Completed'
      }

      const updatedTxns = [newTxn, ...transactions]
      setTransactions(updatedTxns)
      localStorage.setItem('agrimart_transactions', JSON.stringify(updatedTxns))
      setWallet(prev => ({ ...prev, balance: newBalance }))

      setProcessingPayout(false)
      setShowPayoutModal(false)
      setPayoutAmount('')
      showSuccess(`🎉 Payout of ₹${amt.toLocaleString()} processed to ${bankDetails.bank_name}!`)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Kisan Escrow Wallet & Bank Payouts</h1>
          <p className="text-slate-500 text-sm">Real-time buyer escrow tracking and instant 1-click bank cashout</p>
        </div>

        <button
          onClick={fetchWallet}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Balance
        </button>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Available for Payout</p>
              <h2 className="text-3xl font-black font-mono mt-1">₹{wallet.balance.toLocaleString()}</h2>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>

          <button
            onClick={() => setShowPayoutModal(true)}
            className="w-full py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 text-emerald-700" /> Instant Bank Payout →
          </button>
        </div>

        {/* Locked Escrow Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Escrow Locked (Active Orders)</p>
              <h2 className="text-3xl font-black font-mono text-slate-900 mt-1">₹{wallet.pending.toLocaleString()}</h2>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" /> Released upon buyer delivery approval
          </p>
        </div>

        {/* Total Earned Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Lifetime Harvest Earnings</p>
              <h2 className="text-3xl font-black font-mono text-slate-900 mt-1">₹{wallet.totalEarned.toLocaleString()}</h2>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Banknote className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-bold">100% Direct APMC Mandi Settlement</p>
        </div>
      </div>

      {/* Bank Account Details Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Linked Bank & UPI Account</h4>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {bankDetails.bank_name} • A/C: ****{bankDetails.account_number.slice(-4)} • IFSC: {bankDetails.ifsc}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowBankForm(true)}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-colors border border-slate-200"
        >
          Update Bank Details
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-black text-slate-900 text-base">Escrow & Payout Transaction History</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Date</th>
                <th className="pb-3">Transaction Description</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Type</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 text-slate-500 font-mono">
                    {new Date(txn.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 text-slate-900 font-bold">{txn.description}</td>
                  <td className="py-3.5 font-mono font-black text-slate-900">
                    ₹{Number(txn.amount).toLocaleString()}
                  </td>
                  <td className="py-3.5 text-slate-500">{txn.type}</td>
                  <td className="py-3.5 text-right">
                    <span className={`px-3 py-1 rounded-full font-black text-[11px] ${
                      txn.status === 'Released' || txn.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Form Modal */}
      {showBankForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Update Bank & UPI Account</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={bankDetails.account_holder}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_holder: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Number</label>
                <input
                  type="text"
                  value={bankDetails.account_number}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={bankDetails.ifsc}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankDetails.bank_name}
                    onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveBankDetails}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Save Details
              </button>
              <button
                onClick={() => setShowBankForm(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Request Instant Bank Cashout</h3>
            
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900">
              Available Balance: <span className="font-mono text-sm font-black">₹{wallet.balance.toLocaleString()}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payout Amount (₹):</label>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Enter amount to transfer"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-mono font-bold text-slate-900"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Funds will be directly deposited to {bankDetails.bank_name} A/C ****{bankDetails.account_number.slice(-4)} via NEFT/UPI.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleRequestPayout}
                disabled={processingPayout}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                {processingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Confirm Cashout
              </button>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}