// Admin Layout - Dense analytical layout
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, LogOut, User, BarChart2, Users, Shield, AlertTriangle, Building2, Search, Settings } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const navigation = [
  { name: 'metrics', href: '/admin/metrics', icon: BarChart2, label: 'System Metrics' },
  { name: 'verification', href: '/admin/verification', icon: Users, label: 'User Verification' },
  { name: 'escrow', href: '/admin/escrow', icon: Shield, label: 'Escrow Manager' },
  { name: 'disputes', href: '/admin/disputes', icon: AlertTriangle, label: 'Dispute Resolution' },
  { name: 'kiosks', href: '/admin/kiosks', icon: Building2, label: 'Kiosk Registration' },
  { name: 'fraud', href: '/admin/fraud', icon: Search, label: 'Fraud Detection' },
]

export default function AdminLayout() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const { user, profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-admin-bg">
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg shadow-md text-white"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-700 transform transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-700">
            <Link to="/admin/metrics" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-white">AgriMart Admin</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600/20 text-primary-400 border-l-4 border-primary-500 pl-3'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Administrator</p>
                <p className="text-xs text-gray-500">System Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <main className="lg:pl-64 min-h-screen">
        <header className="sticky top-0 z-20 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <h1 className="text-lg font-semibold text-white">
              {navigation.find(n => location.pathname === n.href || location.pathname.startsWith(n.href + '/'))?.label || 'Admin Panel'}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center">
                      <LogOut className="w-4 h-4 inline-block mr-2" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}