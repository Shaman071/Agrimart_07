// Professional Loading Screen Component
import { Loader2, Wifi, WifiOff } from 'lucide-react'
import { useState, useEffect } from 'react'

export function LoadingScreen({ message = 'Loading...', showConnectionStatus = false }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-md px-6">
        {/* Logo */}
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
          <span className="text-white font-black text-4xl">A</span>
        </div>

        {/* Brand */}
        <div>
          <h1 className="text-3xl font-black text-gray-900">AgriMart</h1>
          <p className="text-sm text-gray-500 mt-1">Direct Farm-to-Business Marketplace</p>
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          <p className="text-sm font-medium text-gray-700">{message}</p>
        </div>

        {/* Connection Status */}
        {showConnectionStatus && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${
            isOnline 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                No Internet Connection
              </>
            )}
          </div>
        )}

        {/* Loading Progress Dots */}
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}

export function LoadingSkeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}></div>
  )
}

export default LoadingScreen
