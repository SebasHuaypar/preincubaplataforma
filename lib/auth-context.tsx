'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getSupabase, Profile } from './supabase'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
    isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const sb = getSupabase()

        sb.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        })

        const { data: { subscription } } = sb.auth.onAuthStateChange(
            async (_event: string, session: Session | null) => {
                setUser(session?.user ?? null)
                if (session?.user) {
                    fetchProfile(session.user.id)
                } else {
                    setProfile(null)
                    setLoading(false)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(userId: string) {
        const sb = getSupabase()
        const { data, error } = await sb
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (!error && data) {
            setProfile(data as Profile)
        }
        setLoading(false)
    }

    async function signIn(email: string, password: string) {
        const sb = getSupabase()
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) {
            return { error: error.message }
        }
        return { error: null }
    }

    async function signOut() {
        const sb = getSupabase()
        await sb.auth.signOut()
        setUser(null)
        setProfile(null)
    }

    const isAdmin = profile?.role === 'admin'

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, isAdmin }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
