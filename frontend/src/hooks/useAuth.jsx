// Auth Hook
import { useState, useEffect, useContext, createContext } from 'react'
import { supabase, getUserProfile } from '../lib/supabaseClient'

const AuthContext = createContext(null)
const DEFAULT_COUNTRY = import.meta.env.VITE_DEFAULT_COUNTRY_CODE || '91'

function normalizePhone(phone) {
  if (!phone) return phone
  let cleaned = phone.replace(/[^\d+]/g, '')
  if (!cleaned.startsWith('+')) {
    cleaned = cleaned.replace(/^0+/, '')
    cleaned = `+${DEFAULT_COUNTRY}${cleaned}`
  }
  return cleaned
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getUserProfile(session.user.id).then(setProfile)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const profileData = await getUserProfile(session.user.id)
        setProfile(profileData)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (identifier, password, role) => {
    const isEmail = identifier.includes('@')
    const payload = isEmail ? { email: identifier, password } : { phone: normalizePhone(identifier), password }
    
    const res = await supabase.auth.signUp({
      ...payload,
      options: {
        data: { role }
      }
    })
    if (res.error) console.error('Supabase signUp error:', res.error, res.data)
    
    // Auto sign-in to bypass verification code step
    if (!res.error) {
      const signInRes = await supabase.auth.signInWithPassword(payload)
      if (signInRes.data?.session) {
        setUser(signInRes.data.session.user)
      }
    }
    return res
  }

  const signIn = async (identifier, password) => {
    const isEmail = identifier.includes('@')
    const payload = isEmail ? { email: identifier, password } : { phone: normalizePhone(identifier), password }
    
    const res = await supabase.auth.signInWithPassword(payload)
    if (res.error) console.error('Supabase signIn error:', res.error, res.data)
    return res
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: 'Not authenticated' }
    
    const table = profile?.role === 'farmer' ? 'farmers' : 'buyers'
    const idField = profile?.role === 'farmer' ? 'farmer_id' : 'buyer_id'
    
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq(idField, user.id)
      .select()
      .single()
    
    if (!error && data) {
      setProfile({ ...profile, ...data })
    }
    return { data, error }
  }

  const createProfile = async (role, profileData = {}) => {
    if (!user) return { error: 'Not authenticated' }
    const table = role === 'farmer' ? 'farmers' : 'buyers'
    const idField = role === 'farmer' ? 'farmer_id' : 'buyer_id'

    // Provide minimal required fields for the profile to satisfy NOT NULL constraints
    const defaults = role === 'farmer'
      ? { full_name: '', district: '' }
      : { full_name: '', buyer_type: 'Consumer' }

    const payload = { [idField]: user.id, ...defaults, ...profileData }

    // Ensure a corresponding row exists in public.users (for FK constraints)
    try {
      const userUpsert = await supabase.from('users').upsert({ 
        id: user.id, 
        phone: user.phone || null, 
        email: user.email || null,
        role 
      }, { onConflict: 'id' }).select()
      if (userUpsert.error) console.warn('users upsert warning:', userUpsert.error)
    } catch (e) {
      console.error('users upsert failed:', e)
    }

    const res = await supabase.from(table).insert(payload).select().single()
    if (res.error) {
      console.error('createProfile error:', res.error)
      // If table missing (404), fallback to a local profile so app can proceed
      if (res.status === 404) {
        const localProfile = { role, ...defaults, ...profileData }
        setProfile(localProfile)
        return { data: localProfile, error: null }
      }
      return { data: null, error: res.error }
    }

    setProfile({ ...res.data, role })
    return { data: res.data, error: null }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      createProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}