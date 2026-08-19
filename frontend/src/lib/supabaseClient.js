// Singleton Supabase Client
// Exactly one instance imported everywhere
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars. Check .env file.')
}

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
  }
})

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper to get user profile (farmer/buyer)
export const getUserProfile = async (userId) => {
  // Try farmer first
  const farmerRes = await supabase
    .from('farmers')
    .select('*')
    .eq('farmer_id', userId)
    .single()

  if (!farmerRes.error && farmerRes.data) return { ...farmerRes.data, role: 'farmer' }

  // Try buyer
  const buyerRes = await supabase
    .from('buyers')
    .select('*')
    .eq('buyer_id', userId)
    .single()

  if (!buyerRes.error && buyerRes.data) return { ...buyerRes.data, role: 'buyer' }

  // If tables do not exist or no rows found, return null
  if (farmerRes.error && farmerRes.status === 404) {
    console.warn('Farmers table not found (404)')
  }
  if (buyerRes.error && buyerRes.status === 404) {
    console.warn('Buyers table not found (404)')
  }

  return null
}

export default supabase