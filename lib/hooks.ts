'use client'
import { useState, useEffect, useRef } from 'react'
import { getSupabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  role: 'citizen' | 'owner' | 'admin'
  phone: string | null
  avatar_url: string | null
}

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useRef(getSupabase()).current

  useEffect(() => {
    let cancelled = false

    async function fetchProfile(uid: string) {
      // Retry up to 5 times — DB trigger may not have created the row yet
      for (let i = 0; i < 5; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 500))
        const { data } = await supabase.from('users').select('*').eq('id', uid).single()
        if (cancelled) return
        if (data) {
          setProfile(data)
          setLoading(false)
          return
        }
      }
      // Profile still missing after retries — set loading false so UI isn't stuck
      if (!cancelled) setLoading(false)
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return { user, profile, loading, signOut }
}

export function useFavorites(userId?: string) {
  const [favorites, setFavorites] = useState<string[]>([])
  const supabase = useRef(getSupabase()).current

  useEffect(() => {
    if (!userId) return
    supabase
      .from('favorites')
      .select('room_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) setFavorites(data.map((f: any) => f.room_id))
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const toggleFavorite = async (roomId: string) => {
    if (!userId) return
    if (favorites.includes(roomId)) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('room_id', roomId)
      setFavorites(p => p.filter(id => id !== roomId))
    } else {
      await supabase.from('favorites').insert({ user_id: userId, room_id: roomId })
      setFavorites(p => [...p, roomId])
    }
  }

  return { favorites, toggleFavorite }
}
