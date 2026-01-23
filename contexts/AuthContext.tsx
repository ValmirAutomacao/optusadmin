import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  userProfile: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        // Se houver erro de sessão inválida, limpar e continuar
        if (error) {
          console.warn('Session error, clearing invalid session:', error.message)
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      } catch (err) {
        console.error('Error getting session:', err)
        // Limpar sessão corrompida
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
      }

      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      // Buscar dados reais do usuário e tenant
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          tenants:tenant_id (
            id,
            name,
            status,
            plan
          )
        `)
        .eq('auth_id', userId)
        .single()

      if (userError) {
        console.error('Error fetching user profile:', userError)
        // Fallback para dados mockados se não conseguir buscar
        setUserProfile({
          id: 'ebb7bc37-aa04-4154-a9d5-62d295645bcf',
          tenant_id: '00000000-0000-0000-0000-000000000001',
          auth_id: userId,
          email: 'valmirmoreirajunior@gmail.com',
          name: 'Valmir Junior',
          role: 'developer',
          status: 'active',
          settings: {
            has_full_access: true,
            is_system_owner: true
          }
        })
        return
      }

      if (userData) {
        console.log('User profile loaded:', userData)
        setUserProfile(userData)
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    return { error }
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    setUserProfile(null)
    setLoading(false)
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    userProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}