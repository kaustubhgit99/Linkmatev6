'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { RoomCard, RoomCardSkeleton } from '@/components/rooms/RoomCard'
import { getSupabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks'

export default function FavoritesPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = useRef(getSupabase()).current

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase.from('favorites').select('room_id,rooms(*,room_images(*),users(full_name,email,phone))').eq('user_id', user.id)
      .then(({ data }) => { if (data) setRooms(data.map((f: any) => f.rooms).filter(Boolean)); setLoading(false) })
  }, [user, supabase])

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Navbar/>
      <div className="pt-20 max-w-7xl mx-auto px-5 py-8">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-red-400 fill-red-400"/>
          <div>
            <h1 className="text-4xl font-display font-semibold text-gray-900">Saved Rooms</h1>
            <p className="text-muted-foreground text-sm">{rooms.length} saved</p>
          </div>
        </motion.div>

        {!user ? (
          <div className="text-center py-24">
            <Heart className="w-14 h-14 mx-auto mb-4 text-gray-200"/>
            <h3 className="text-xl font-display font-semibold text-gray-800 mb-2">Sign in to see favourites</h3>
            <Link href="/auth/login">
              <button className="mt-4 px-6 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-red-600 transition-colors">Sign In</button>
            </Link>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array(6).fill(0).map((_,i) => <RoomCardSkeleton key={i}/>)}</div>
        ) : rooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((r,i) => <RoomCard key={r.id} room={r} userId={user?.id} index={i}/>)}
          </div>
        ) : (
          <div className="text-center py-24 text-muted-foreground">
            <Heart className="w-14 h-14 mx-auto mb-4 text-gray-200"/>
            <h3 className="text-xl font-display font-semibold text-gray-800 mb-2">No saved rooms yet</h3>
            <p className="text-sm mb-6">Tap the heart on any room to save it here.</p>
            <Link href="/browse">
              <button className="px-6 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-red-600 transition-colors">Browse Rooms</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
