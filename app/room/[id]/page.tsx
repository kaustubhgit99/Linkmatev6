'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Bed, Heart, ArrowLeft, CheckCircle, Shield, ChevronLeft, ChevronRight, Share2, X, Phone, Send, Loader2, User } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { getSupabase } from '@/lib/supabase'
import { useAuth, useFavorites } from '@/lib/hooks'
import { formatPrice, formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

// ── Contact Form Modal ──────────────────────────────────────────────────────
function ContactModal({ owner, roomTitle, roomId, onClose }: { owner: any; roomTitle: string; roomId: string; onClose: () => void }) {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    message: `Hi, I am interested in your listing "${roomTitle}". Please contact me.`,
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = useRef(getSupabase()).current

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) return
    setLoading(true)
    const { error } = await supabase.from('enquiries').insert({
      room_id: roomId,
      owner_id: owner.id,
      sender_id: user?.id || null,
      sender_name: form.name,
      sender_phone: form.phone,
      message: form.message,
    })
    if (error) {
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}>
        <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} exit={{opacity:0,y:60}} transition={{type:'spring',damping:28,stiffness:300}}
          className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-lg shadow-md">
                {owner.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{owner.full_name}</p>
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <Shield className="w-3 h-3"/>Verified Owner
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4"/>
            </button>
          </div>

          <div className="px-6 py-5">
            {sent ? (
              <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500"/>
                </div>
                <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">Enquiry Sent!</h3>
                <p className="text-muted-foreground text-sm mb-1">Your message has been sent to <strong>{owner.full_name}</strong>.</p>
                <p className="text-muted-foreground text-sm mb-6">They will contact you at the phone number you provided.</p>
                {owner.phone && (
                  <a href={`tel:${owner.phone}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors">
                    <Phone className="w-4 h-4"/> Call Owner Now
                  </a>
                )}
              </motion.div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-5">
                  Fill in your details and the owner will reach out to you directly.
                </p>
                <form onSubmit={send} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Your Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                      <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                        placeholder="Full Name" required
                        className="ios-input pl-9 text-sm"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Your Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                      <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                        placeholder="+91 98765 43210" type="tel" required
                        className="ios-input pl-9 text-sm"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Message</label>
                    <textarea value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))}
                      rows={3} required placeholder="Your message..."
                      className="ios-input text-sm"/>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-500/20">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Sending...</> : <><Send className="w-4 h-4"/>Send Enquiry</>}
                  </button>
                  {!user && (
                    <p className="text-center text-xs text-muted-foreground pt-1">
                      <Link href="/auth/login" className="text-primary font-medium">Sign in</Link> to track your enquiries
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main Room Detail Page ───────────────────────────────────────────────────
export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [showContact, setShowContact] = useState(false)
  const { user } = useAuth()
  const { favorites, toggleFavorite } = useFavorites(user?.id)
  const supabase = useRef(getSupabase()).current

  useEffect(() => {
    supabase.from('rooms').select('*,room_images(*),users(id,full_name,phone,avatar_url)').eq('id', params.id).single()
      .then(({ data }) => { setRoom(data); setLoading(false) })
  }, [params.id, supabase])

  if (loading) return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
      <Navbar/>
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!room) return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Navbar/>
      <div className="pt-24 text-center px-4">
        <h2 className="text-2xl font-display font-semibold mb-4">Room not found</h2>
        <Link href="/browse"><button className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-red-600 transition-colors">Browse Rooms</button></Link>
      </div>
    </div>
  )

  const imgs = room.room_images || []
  const isFav = favorites.includes(room.id)
  const share = () => { navigator.clipboard?.writeText(window.location.href); toast({ title: 'Link copied!' }) }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Navbar/>

      {showContact && room.users && (
        <ContactModal owner={room.users} roomTitle={room.title} roomId={room.id} onClose={() => setShowContact(false)}/>
      )}

      <div className="pt-20 max-w-6xl mx-auto px-5 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-gray-900 mb-6 transition-colors text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Back to listings
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">

            {/* Gallery */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
              <div className="relative h-72 sm:h-[420px] rounded-3xl overflow-hidden bg-gray-100">
                {imgs.length > 0 ? (
                  <Image src={imgs[imgIdx]?.url} alt={room.title} fill className="object-cover transition-all duration-300"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                    <span className="text-7xl">🏠</span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${room.is_available ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {room.is_available ? '● Available' : '○ Occupied'}
                  </span>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  {user && (
                    <button onClick={() => toggleFavorite(room.id)}
                      className={`w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center transition-all hover:scale-110 ${isFav ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                      <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`}/>
                    </button>
                  )}
                  <button onClick={share} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all hover:scale-110">
                    <Share2 className="w-5 h-5"/>
                  </button>
                </div>
                {imgs.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors">
                      <ChevronLeft className="w-5 h-5 text-gray-700"/>
                    </button>
                    <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors">
                      <ChevronRight className="w-5 h-5 text-gray-700"/>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {imgs.map((_: any, i: number) => (
                        <button key={i} onClick={() => setImgIdx(i)}
                          className={`rounded-full transition-all ${i === imgIdx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/60'}`}/>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {imgs.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {imgs.map((img: any, i: number) => (
                    <button key={img.id} onClick={() => setImgIdx(i)}
                      className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 transition-all ${i === imgIdx ? 'ring-2 ring-primary' : 'opacity-55 hover:opacity-90'}`}>
                      <Image src={img.url} alt="" fill className="object-cover"/>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details card */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
              className="bg-white rounded-3xl p-6 border border-black/6 shadow-sm">
              <div className="flex items-start justify-between mb-5 gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-display font-semibold text-gray-900 mb-2">{room.title}</h1>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4 text-primary"/>{room.location}, {room.city}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-primary">{formatPrice(room.rent_price)}</div>
                  <div className="text-muted-foreground text-xs">/month</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="chip flex items-center gap-1.5"><Bed className="w-3.5 h-3.5 text-primary"/>{room.num_beds} Bed{room.num_beds > 1 ? 's' : ''}</span>
                <span className="chip">{room.room_type}</span>
                <span className="chip">Listed {formatDate(room.created_at)}</span>
              </div>
              <div className="mb-5">
                <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">About this room</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{room.description || 'No description provided.'}</p>
              </div>
              {room.amenities?.length > 0 && (
                <div>
                  <h3 className="font-display font-semibold text-lg text-gray-900 mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((a: string) => (
                      <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-primary rounded-2xl text-sm font-medium">
                        <CheckCircle className="w-3.5 h-3.5"/>{a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div>
            <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:0.15}}
              className="bg-white rounded-3xl p-6 border border-black/6 shadow-sm sticky top-24">
              <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">Owner Details</h3>

              {room.users ? (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold shadow-md shadow-red-500/20">
                      {room.users.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{room.users.full_name}</div>
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium mt-0.5">
                        <Shield className="w-3 h-3"/>Verified Owner
                      </div>
                    </div>
                  </div>

                  {/* Owner phone — call link, no email shown */}
                  {room.users.phone && (
                    <a href={`tel:${room.users.phone}`}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-green-50 hover:text-green-700 transition-colors text-sm font-medium mb-4 border border-black/6">
                      <Phone className="w-4 h-4 text-green-600 shrink-0"/>
                      <span>{room.users.phone}</span>
                    </a>
                  )}

                  {/* Room quick stats */}
                  <div className="space-y-2 text-sm mb-5 pb-5 border-b border-black/6">
                    {[
                      ['Type', room.room_type],
                      ['Beds', String(room.num_beds)],
                      ['City', room.city],
                      ['Status', room.is_available ? '✓ Available' : '✗ Occupied'],
                      ['Rent/mo', formatPrice(room.rent_price)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-muted-foreground">{k}</span>
                        <span className={`font-medium ${k === 'Status' ? (room.is_available ? 'text-green-600' : 'text-red-500') : k === 'Rent/mo' ? 'text-primary' : 'text-gray-900'}`}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA — opens modal */}
                  <button onClick={() => setShowContact(true)}
                    className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-red-600 transition-colors shadow-md shadow-red-500/20">
                    Contact Owner
                  </button>
                  {!user && (
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      <Link href="/auth/login" className="text-primary font-medium">Sign in</Link> to save this room
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Owner info not available</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
