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

  const signUp = async (phone, password, role) => {
    const cleanedPhone = normalizePhone(phone)
    const res = await supabase.auth.signUp({
      phone: cleanedPhone,
      password,
      options: {
        data: { role }
      }
    })
    if (res.error) console.error('Supabase signUp error:', res.error, res.data)
    return res
  }

  const signIn = async (phone, password) => {
    const cleanedPhone = normalizePhone(phone)
    const res = await supabase.auth.signInWithPassword({
      phone: cleanedPhone,
      password
    })
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
    const payload = { [idField]: user.id, ...profileData }

    const res = await supabase.from(table).insert(payload).select().single()
    if (res.error) {
      console.error('createProfile error:', res.error)
      // If table missing (404), fallback to a local profile so app can proceed
      if (res.status === 404) {
        const localProfile = { role, ...profileData }
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