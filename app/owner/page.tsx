'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, HomeIcon, Eye, Edit3, Trash2, ToggleLeft, ToggleRight, TrendingUp, DollarSign, AlertCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Badge } from '@/components/ui/badge'
import { getSupabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks'
import { formatPrice } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

export default function OwnerDashboard() {
  const [rooms, setRooms] = useState<any[]>([])
  const [roomsLoading, setRoomsLoading] = useState(true)
  const { user, profile, loading: authLoading } = useAuth()
  const supabase = useRef(getSupabase()).current
  const router = useRouter()
  const fetchedRef = useRef(false)

  const fetchRooms = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('rooms').select('*,room_images(*)').eq('owner_id', uid).order('created_at', { ascending: false })
    if (error) console.error(error)
    setRooms(data || [])
    setRoomsLoading(false)
  }, [supabase])

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/auth/login'); return }
    if (profile && profile.role !== 'owner' && profile.role !== 'admin') { router.replace('/browse'); return }
    if (!fetchedRef.current) { fetchedRef.current = true; fetchRooms(user.id) }
  }, [authLoading, user, profile, fetchRooms, router])

  if (authLoading) return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!user) return null
  if (profile && profile.role !== 'owner' && profile.role !== 'admin') return (
    <div className="min-h-screen bg-[#F7F7F7]"><Navbar/>
      <div className="pt-24 max-w-md mx-auto px-4 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500"/>
        <h2 className="text-2xl font-display font-semibold mb-2">Owner Access Only</h2>
        <p className="text-muted-foreground mb-6">You need an owner account to manage listings.</p>
        <Link href="/auth/signup"><button className="px-6 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-red-600 transition-colors">Create Owner Account</button></Link>
      </div>
    </div>
  )

  const stats = [
    { l:'Total Listings', v:rooms.length, icon:HomeIcon, c:'text-blue-600', bg:'bg-blue-50' },
    { l:'Available', v:rooms.filter(r=>r.is_available).length, icon:TrendingUp, c:'text-green-600', bg:'bg-green-50' },
    { l:'Occupied', v:rooms.filter(r=>!r.is_available).length, icon:HomeIcon, c:'text-amber-600', bg:'bg-amber-50' },
    { l:'Monthly Value', v:formatPrice(rooms.filter(r=>r.is_available).reduce((s,r)=>s+r.rent_price,0)), icon:DollarSign, c:'text-primary', bg:'bg-red-50' },
  ]

  const deleteRoom = async (id: string) => {
    if (!confirm('Delete this listing permanently?')) return
    const { error } = await supabase.from('rooms').delete().eq('id', id)
    if (error) { toast({ title:'Error', description:error.message, variant:'destructive' }); return }
    setRooms(p => p.filter(r => r.id !== id))
    toast({ title:'Room deleted' })
  }
  const toggleAvail = async (id: string, cur: boolean) => {
    await supabase.from('rooms').update({ is_available: !cur }).eq('id', id)
    setRooms(p => p.map(r => r.id === id ? {...r, is_available: !cur} : r))
    toast({ title:`Marked as ${!cur ? 'available' : 'occupied'}` })
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Navbar/>
      <div className="pt-20 max-w-7xl mx-auto px-5 py-8">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-semibold text-gray-900">My Listings</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage all your room listings</p>
          </div>
          <Link href="/owner/add">
            <button className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-red-600 transition-colors shadow-md shadow-red-500/20">
              <Plus className="w-4 h-4"/> Add New Room
            </button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.l} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
              className="bg-white rounded-2xl p-5 border border-black/6 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.c}`}/>
              </div>
              <div className="text-2xl font-display font-semibold text-gray-900">{s.v}</div>
              <div className="text-muted-foreground text-xs mt-0.5">{s.l}</div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
          className="bg-white rounded-2xl border border-black/6 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-black/6 flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-gray-900">Room Listings</h2>
            <span className="text-sm text-muted-foreground">{rooms.length} listing{rooms.length !== 1 ? 's' : ''}</span>
          </div>

          {roomsLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading your listings...</div>
          ) : rooms.length === 0 ? (
            <div className="p-12 text-center">
              <HomeIcon className="w-14 h-14 mx-auto mb-4 text-gray-200"/>
              <p className="text-gray-700 font-medium mb-1">No listings yet</p>
              <p className="text-sm text-muted-foreground mb-6">Add your first room to start getting inquiries</p>
              <Link href="/owner/add">
                <button className="px-6 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-red-600 transition-colors">
                  <Plus className="w-4 h-4 inline mr-1.5"/>Add Your First Room
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/6 bg-gray-50">
                    <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">Room</th>
                    <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left hidden sm:table-cell">City</th>
                    <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">Rent</th>
                    <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left hidden md:table-cell">Photos</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/4">
                  {rooms.map(room => (
                    <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900 line-clamp-1 max-w-44">{room.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{room.room_type} · {room.num_beds} bed</div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">{room.city}</td>
                      <td className="px-5 py-4 font-semibold text-primary">{formatPrice(room.rent_price)}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => toggleAvail(room.id, room.is_available)} className="flex items-center gap-1.5 group">
                          {room.is_available
                            ? <ToggleRight className="w-5 h-5 text-green-500"/>
                            : <ToggleLeft className="w-5 h-5 text-gray-300"/>
                          }
                          <Badge variant={room.is_available ? 'success' : 'warning'} className="text-xs group-hover:opacity-80 transition-opacity">
                            {room.is_available ? 'Available' : 'Occupied'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground hidden md:table-cell text-xs">
                        {room.room_images?.length || 0} photo{room.room_images?.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/room/${room.id}`}>
                            <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><Eye className="w-4 h-4"/></button>
                          </Link>
                          <Link href={`/owner/edit/${room.id}`}>
                            <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"><Edit3 className="w-4 h-4"/></button>
                          </Link>
                          <button onClick={() => deleteRoom(room.id)} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
