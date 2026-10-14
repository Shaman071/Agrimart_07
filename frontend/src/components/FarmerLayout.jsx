// Farmer Layout - Voice-first, high-contrast, large touch targets
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, LogOut, User, Home, Mic, Package, Truck, CreditCard, Settings, Bell, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const navigation = [
  { name: 'dashboard', href: '/farmer/dashboard', icon: Home, label: 'Dashboard' },
  { name: 'kisanVani', href: '/farmer/kisan-vani', icon: Mic, label: 'KisanVani Voice' },
  { name: 'inventory', href: '/farmer/inventory', icon: Package, label: 'Inventory Manager' },
  { name: 'orders', href: '/farmer/orders', icon: Package, label: 'Order Hub' },
  { name: 'dispatch', href: '/farmer/dispatch', icon: Truck, label: 'Dispatch Manager' },
  { name: 'wallet', href: '/farmer/wallet', icon: CreditCard, label: 'Wallet & Payouts' },
  { name: 'cropDoctor', href: '/farmer/crop-doctor', icon: HelpCircle, label: 'Crop Doctor' },
  { name: 'profile', href: '/farmer/profile', icon: User, label: 'Profile' },
]

export default function FarmerLayout() {
  const { t } = useTranslation('farmer')
  const location = useLocation()
  const { user, profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-farmer-bg">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg border-2 border-farmer-accent"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="w-8 h-8 text-farmer-text" /> : <Menu className="w-8 h-8 text-farmer-text" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r-2 border-farmer-accent transform transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Farmer navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b-2 border-farmer-accent bg-farmer-bg">
            <Link to="/farmer/dashboard" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-farmer-accent rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">A</span>
              </div>
              <span className="text-2xl font-bold text-farmer-text">AgriMart</span>
            </Link>
            <p className="text-sm text-farmer-text/70 mt-2">Welcome, {profile?.full_name || 'Farmer'}!</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto" role="navigation" aria-label="Farmer main navigation">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-4 px-4 py-4 rounded-xl text-farmer-lg font-semibold transition-all border-2 ${
                    isActive
                      ? 'bg-farmer-accent text-white shadow-lg border-farmer-accent'
                      : 'text-farmer-text border-transparent hover:bg-farmer-accent/10 hover:border-farmer-accent/50'
                  }`}
                >
                  <Icon className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Quick Stats */}
          <div className="p-4 border-t-2 border-farmer-accent bg-farmer-bg/50">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-white p-3 rounded-xl border border-farmer-accent/30 text-center">
                <p className="text-2xl font-bold text-farmer-accent">{profile?.trust_score || 50}</p>
                <p className="text-xs text-farmer-text/70">Trust Score</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-farmer-accent/30 text-center">
                <p className="text-2xl font-bold text-farmer-text">{profile?.is_verified ? '✓' : '○'}</p>
                <p className="text-xs text-farmer-text/70">{profile?.is_verified ? 'Verified' : 'Not Verified'}</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-t-2 border-farmer-accent">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-farmer-accent rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-farmer-text truncate">{profile?.full_name || 'Farmer'}</p>
                <p className="text-sm text-farmer-text/70">{profile?.district}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="lg:pl-72 min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b-2 border-farmer-accent">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <h1 className="text-farmer-xl text-farmer-text">
              {navigation.find(n => location.pathname === n.href || location.pathname.startsWith(n.href + '/'))?.label || 'AgriMart'}
            </h1>
            <div className="flex items-center space-x-3">
              <button className="relative p-2 text-farmer-text hover:bg-farmer-accent/10 rounded-xl">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-xl hover:bg-farmer-accent/10"
                >
                  <div className="w-10 h-10 bg-farmer-accent rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border-2 border-farmer-accent py-2 z-50">
                    <Link
                      to="/farmer/profile"
                      className="block px-4 py-3 text-farmer-text hover:bg-farmer-accent/10 font-medium"
                    >
                      <Settings className="w-5 h-5 inline-block mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-farmer-text hover:bg-farmer-accent/10 font-medium flex items-center"
                    >
                      <LogOut className="w-5 h-5 inline-block mr-2" />
                      Logout
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