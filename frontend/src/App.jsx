// Main App with Routing
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import FarmerLayout from './components/FarmerLayout'
import BuyerLayout from './components/BuyerLayout'
import AdminLayout from './components/AdminLayout'
import LoadingScreen from './components/ui/LoadingScreen'

// Landing + Auth
import LandingPage from './pages/auth/LandingPage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import RoleSelect from './pages/auth/RoleSelect'
import Verify from './pages/auth/Verify'

// Farmer Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard'
import KisanVaniVoiceAction from './pages/farmer/KisanVaniVoiceAction'
import InventoryManager from './pages/farmer/InventoryManager'
import CreateListing from './pages/farmer/CreateListing'
import OrderHub from './pages/farmer/OrderHub'
import DispatchManager from './pages/farmer/DispatchManager'
import WalletPayouts from './pages/farmer/WalletPayouts'
import FarmerProfile from './pages/farmer/FarmerProfile'
import CropDoctor from './pages/farmer/CropDoctor'

// Buyer Pages
import MarketCatalog from './pages/buyer/MarketCatalog'
import ListingDetail from './pages/buyer/ListingDetail'
import NegotiationCart from './pages/buyer/NegotiationCart'
import ActiveOrders from './pages/buyer/ActiveOrders'
import BusinessProfile from './pages/buyer/BusinessProfile'
import DemandChatbot from './pages/buyer/DemandChatbot'

// Admin Pages
import SystemMetrics from './pages/admin/SystemMetrics'
import UserVerification from './pages/admin/UserVerification'
import EscrowManager from './pages/admin/EscrowManager'
import DisputeResolution from './pages/admin/DisputeResolution'
import KioskRegistration from './pages/admin/KioskRegistration'
import FraudDetection from './pages/admin/FraudDetection'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()
  
  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." showConnectionStatus={true} />
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Determine user role
  const userRole = profile?.role || (user.email?.includes('farmer') ? 'farmer' : (user.email?.includes('admin') ? 'admin' : 'buyer'))
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'farmer') return <Navigate to="/farmer/dashboard" replace />
    if (userRole === 'buyer') return <Navigate to="/buyer/market" replace />
    if (userRole === 'admin') return <Navigate to="/admin/metrics" replace />
    return <Navigate to="/" replace />
  }
  
  return children
}

// Root redirect: unauthenticated → landing, authenticated → role dashboard directly
function RootRedirect() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <LoadingScreen message="Initializing AgriMart..." showConnectionStatus={true} />
  }

  if (!user) return <LandingPage />
  
  const userRole = profile?.role || (user.email?.includes('farmer') ? 'farmer' : (user.email?.includes('admin') ? 'admin' : 'buyer'))
  if (userRole === 'farmer') return <Navigate to="/farmer/dashboard" replace />
  if (userRole === 'buyer') return <Navigate to="/buyer/market" replace />
  if (userRole === 'admin') return <Navigate to="/admin/metrics" replace />
  
  return <LandingPage />
}

function App() {
  return (
    <Routes>
      {/* Root: Landing or Dashboard */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/role-select" element={<RoleSelect />} />
      
      {/* Farmer Routes */}
      <Route element={
        <ProtectedRoute allowedRoles={['farmer']}>
          <FarmerLayout />
        </ProtectedRoute>
      }>
        <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
        <Route path="/farmer/kisan-vani" element={<KisanVaniVoiceAction />} />
        <Route path="/farmer/voice-action" element={<KisanVaniVoiceAction />} />
        <Route path="/farmer/inventory" element={<InventoryManager />} />
        <Route path="/farmer/create-listing" element={<CreateListing />} />
        <Route path="/farmer/orders" element={<OrderHub />} />
        <Route path="/farmer/dispatch" element={<DispatchManager />} />
        <Route path="/farmer/wallet" element={<WalletPayouts />} />
        <Route path="/farmer/profile" element={<FarmerProfile />} />
        <Route path="/farmer/crop-doctor" element={<CropDoctor />} />
      </Route>
      
      {/* Buyer Routes */}
      <Route element={
        <ProtectedRoute allowedRoles={['buyer']}>
          <BuyerLayout />
        </ProtectedRoute>
      }>
        <Route path="/buyer/market" element={<MarketCatalog />} />
        <Route path="/buyer/listing/:id" element={<ListingDetail />} />
        <Route path="/buyer/cart" element={<NegotiationCart />} />
        <Route path="/buyer/orders" element={<ActiveOrders />} />
        <Route path="/buyer/profile" element={<BusinessProfile />} />
        <Route path="/buyer/chatbot" element={<DemandChatbot />} />
      </Route>
      
      {/* Admin Routes */}
      <Route element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="/admin/metrics" element={<SystemMetrics />} />
        <Route path="/admin/verification" element={<UserVerification />} />
        <Route path="/admin/escrow" element={<EscrowManager />} />
        <Route path="/admin/disputes" element={<DisputeResolution />} />
        <Route path="/admin/kiosks" element={<KioskRegistration />} />
        <Route path="/admin/fraud" element={<FraudDetection />} />
      </Route>
      
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App