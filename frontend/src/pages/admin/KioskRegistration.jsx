// KioskRegistration - Admin kiosk management
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { Loader2, Building2, MapPin, User, Shield, Plus, Edit, Trash2, CheckCircle, XCircle, Eye, Save, X } from 'lucide-react'

export default function KioskRegistration() {
  const { t } = useTranslation('common')
  const [kiosks, setKiosks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingKiosk, setEditingKiosk] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    address: '',
    latitude: '',
    longitude: '',
    operator_name: '',
    operator_phone: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const DISTRICTS = [
    'Bangalore Urban', 'Bangalore Rural', 'Mysore', 'Hubli', 'Dharwad',
    'Mangalore', 'Belgaum', 'Gulbarga', 'Bidar', 'Raichur', 'Koppal',
    'Bellary', 'Chitradurga', 'Davangere', 'Shimoga', 'Tumkur', 'Kolar'
  ]

  useEffect(() => {
    fetchKiosks()
  }, [])

  const fetchKiosks = async () => {
    setLoading(true)
    try {
      // Using a mock table - in production, create kiosks table
      // For now, mock data
      setKiosks([
        { id: '1', name: 'AgriMart Kiosk Bangalore', district: 'Bangalore Urban', address: 'K R Market, Bangalore', operator_name: 'Rajesh Kumar', operator_phone: '9876543210', is_active: true, created_at: '2024-01-15' },
        { id: '2', name: 'AgriMart Kiosk Mysore', district: 'Mysore', address: 'Mysore APMC, Mysore', operator_name: 'Suresh Patel', operator_phone: '9876543211', is_active: true, created_at: '2024-02-20' },
        { id: '3', name: 'AgriMart Kiosk Hubli', district: 'Hubli', address: 'Hubli APMC, Hubli', operator_name: 'Mahesh Rao', operator_phone: '9876543212', is_active: false, created_at: '2024-03-10' },
      ])
    } catch (err) {
      console.error('Failed to fetch kiosks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      // Mock save
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (editingKiosk) {
        setKiosks(kiosks.map(k => k.id === editingKiosk.id ? { ...k, ...formData } : k))
        setMessage({ type: 'success', text: 'Kiosk updated successfully!' })
      } else {
        const newKiosk = { id: Date.now().toString(), ...formData, created_at: new Date().toISOString().split('T')[0] }
        setKiosks([newKiosk, ...kiosks])
        setMessage({ type: 'success', text: 'Kiosk registered successfully!' })
      }
      closeForm()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this kiosk?')) return
    try {
      setKiosks(kiosks.filter(k => k.id !== id))
      setMessage({ type: 'success', text: 'Kiosk deleted successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  const openForm = (kiosk = null) => {
    if (kiosk) {
      setEditingKiosk(kiosk)
      setFormData({ ...kiosk })
    } else {
      setEditingKiosk(null)
      setFormData({
        name: '', district: '', address: '', latitude: '', longitude: '',
        operator_name: '', operator_phone: '', is_active: true,
      })
    }
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingKiosk(null)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kiosk Registration</h1>
        <button onClick={() => openForm()} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Register Kiosk
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Kiosks</p>
          <p className="text-2xl font-bold text-gray-900">{kiosks.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {kiosks.filter(k => k.is_active).length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-red-600">
            {kiosks.filter(k => !k.is_active).length}
          </p>
        </div>
      </div>

      {/* Kiosks List */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="pb-3 font-semibold">Kiosk</th>
              <th className="pb-3 font-semibold">Location</th>
              <th className="pb-3 font-semibold">Operator</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Registered</th>
              <th className="pb-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {kiosks.map((kiosk) => (
              <tr key={kiosk.id} className="hover:bg-gray-50">
                <td className="py-4">
                  <p className="font-medium">{kiosk.name}</p>
                </td>
                <td className="py-4">
                  <p className="text-sm text-gray-600">{kiosk.address}</p>
                  <p className="text-xs text-gray-500">{kiosk.district}</p>
                </td>
                <td className="py-4">
                  <p className="font-medium">{kiosk.operator_name}</p>
                  <p className="text-sm text-gray-500">{kiosk.operator_phone}</p>
                </td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    kiosk.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {kiosk.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-4 text-sm text-gray-500">
                  {new Date(kiosk.created_at).toLocaleDateString()}
                </td>
                <td className="py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openForm(kiosk)}
                      className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(kiosk.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {kiosks.length === 0 && (
        <div className="card text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No kiosks registered yet</p>
          <button onClick={() => openForm()} className="btn-primary mt-4">
            Register First Kiosk
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingKiosk ? 'Edit Kiosk' : 'Register New Kiosk'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kiosk Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="">Select district</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="input-field"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operator Name</label>
                  <input
                    type="text"
                    value={formData.operator_name}
                    onChange={(e) => setFormData({...formData, operator_name: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operator Phone</label>
                  <input
                    type="tel"
                    value={formData.operator_phone}
                    onChange={(e) => setFormData({...formData, operator_phone: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active Kiosk
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={closeForm} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message.text && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  )
}