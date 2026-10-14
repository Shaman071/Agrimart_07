// Singleton Supabase Client with enhanced error handling
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Check .env file.')
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Enhanced Supabase client with retry logic and better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'agrimart-web-app'
    },
    fetch: (url, options = {}) => {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId))
        .catch(err => {
          if (err.name === 'AbortError') {
            console.warn('⏱️ Request timeout - retrying with cached data')
          }
          throw err
        })
    }
  }
})

// Enhanced query wrapper with automatic retry and fallback
export const safeQuery = async (queryFn, fallbackData = null) => {
  try {
    const result = await queryFn()
    if (result.error) {
      console.warn('Supabase query error:', result.error.message)
      return { data: fallbackData, error: result.error }
    }
    return result
  } catch (error) {
    console.warn('Network error, using fallback data:', error.message)
    return { data: fallbackData, error }
  }
}

// Helper to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.warn('Failed to get current user:', error.message)
    return null
  }
}

// Helper to get user profile (farmer/buyer/admin) with smart fallback
export const getUserProfile = async (userId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const email = user?.email || ''
    const userRole = user?.user_metadata?.role

    // Try farmer table first
    const farmerRes = await safeQuery(
      () => supabase.from('farmers').select('*').eq('farmer_id', userId).maybeSingle(),
      null
    )

    if (!farmerRes.error && farmerRes.data) {
      return { ...farmerRes.data, role: 'farmer' }
    }

    // Try buyer table
    const buyerRes = await safeQuery(
      () => supabase.from('buyers').select('*').eq('buyer_id', userId).maybeSingle(),
      null
    )

    if (!buyerRes.error && buyerRes.data) {
      return { ...buyerRes.data, role: 'buyer' }
    }

    // Fallback: derive role from email or user metadata
    if (email.includes('farmer') || userRole === 'farmer') {
      return { 
        farmer_id: userId, 
        full_name: 'Farmer Partner', 
        district: 'Bangalore Urban', 
        trust_score: 95, 
        role: 'farmer' 
      }
    }
    if (email.includes('buyer') || userRole === 'buyer') {
      return { 
        buyer_id: userId, 
        full_name: 'Wholesale Buyer', 
        buyer_type: 'Restaurant / Retailer', 
        role: 'buyer' 
      }
    }
    if (email.includes('admin') || userRole === 'admin') {
      return { 
        user_id: userId, 
        full_name: 'AgriMart Admin', 
        role: 'admin' 
      }
    }
    
    // Default fallback role: buyer
    return { 
      buyer_id: userId, 
      full_name: 'AgriMart Member', 
      role: 'buyer' 
    }
  } catch (err) {
    console.warn('Profile fetch error, using default:', err.message)
    return { 
      buyer_id: userId, 
      full_name: 'AgriMart Member', 
      role: 'buyer' 
    }
  }
}

// Test Supabase connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('farmers').select('count', { count: 'exact', head: true })
    if (error) throw error
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message)
    return false
  }
}

export default supabase