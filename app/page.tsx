'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, MapPin, ArrowRight, ShieldCheck, Star, Zap, ChevronDown } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { RoomCard, RoomCardSkeleton } from '@/components/rooms/RoomCard'
import { getSupabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks'
import { CITIES } from '@/lib/utils'

// Real Unsplash room images for hero slideshow
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=80',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=80',
]

export default function HomePage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('')
  const [heroIdx, setHeroIdx] = useState(0)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = useRef(getSupabase()).current

  useEffect(() => {
    supabase.from('rooms').select('*,room_images(*),users(full_name,email,phone)')
      .eq('is_available', true).order('created_at', { ascending: false }).limit(8)
      .then(({ data }) => { if (data) setRooms(data); setLoading(false) })
  }, [supabase])

  // Hero image auto-cycle
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 4500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative h-[88vh] min-h-[560px] overflow-hidden">
        {/* Background images with crossfade */}
        {HERO_IMAGES.map((src, i) => (
          <div key={src} className={`absolute inset-0 transition-opacity duration-1000 ${i === heroIdx ? 'opacity-100' : 'opacity-0'}`}>
            <Image src={src} alt="" fill className="object-cover" priority={i === 0} sizes="100vw"/>
          </div>
        ))}
        {/* Gradient overlay */}
        <div className="absolute inset-0 hero-overlay" />

        {/* Dot indicators */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_IMAGES.map((_, i) => (
            <button key={i} onClick={() => setHeroIdx(i)}
              className={`rounded-full transition-all duration-300 ${i === heroIdx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`}/>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-5 text-center">
          <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.6}}>
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
              2,400+ verified rooms across India
            </span>
          </motion.div>

          <motion.h1 initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.6}}
            className="text-4xl sm:text-6xl lg:text-7xl font-display font-semibold text-white leading-[1.08] mb-5 max-w-3xl">
            Find your next<br/>home away from home.
          </motion.h1>

          <motion.p initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:0.2,duration:0.6}}
            className="text-white/70 text-lg mb-10 max-w-xl">
            Discover verified rooms, connect with trusted owners, and move in with confidence.
          </motion.p>

          {/* Search bar */}
          <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:0.3,duration:0.6}}
            className="w-full max-w-2xl">
            <div className="search-bar p-1.5">
              <div className="flex items-center flex-1 px-4 gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0"/>
                <input
                  list="cities-list"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Search by city..."
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 py-2"
                />
                <datalist id="cities-list">{CITIES.map(c => <option key={c} value={c}/>)}</datalist>
              </div>
              <button
                onClick={() => router.push(`/browse${city ? `?city=${encodeURIComponent(city)}` : ''}`)}
                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-red-600 transition-colors shadow-sm shrink-0">
                <Search className="w-4 h-4"/> Search
              </button>
            </div>
          </motion.div>

          {/* Quick city links */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}
            className="flex flex-wrap gap-2 justify-center mt-5">
            <span className="text-white/40 text-sm">Popular:</span>
            {['Mumbai','Bangalore','Delhi','Pune','Hyderabad'].map(c => (
              <button key={c} onClick={() => router.push(`/browse?city=${c}`)}
                className="text-white/60 hover:text-white text-sm transition-colors">
                {c}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div animate={{y:[0,6,0]}} transition={{repeat:Infinity,duration:2}}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 z-10">
          <ChevronDown className="w-5 h-5"/>
        </motion.div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="bg-white border-y border-black/6">
        <div className="max-w-5xl mx-auto px-5 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            {v:'2,400+',l:'Rooms Listed'},
            {v:'1,800+',l:'Happy Tenants'},
            {v:'20+',l:'Cities'},
            {v:'600+',l:'Verified Owners'},
          ].map((s,i) => (
            <motion.div key={s.l} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.08}}>
              <div className="text-2xl sm:text-3xl font-display font-semibold text-primary">{s.v}</div>
              <div className="text-muted-foreground text-sm mt-0.5">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURED ROOMS ── */}
      <section className="py-16 px-5 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-1">Featured</p>
            <h2 className="text-3xl font-display font-semibold text-gray-900">Latest Rooms</h2>
            <p className="text-muted-foreground text-sm mt-1">Handpicked spaces just for you</p>
          </div>
          <Link href="/browse">
            <button className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-red-600 transition-colors">
              View All <ArrowRight className="w-4 h-4"/>
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_,i) => <RoomCardSkeleton key={i}/>)}
          </div>
        ) : rooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {rooms.map((r,i) => <RoomCard key={r.id} room={r} userId={user?.id} index={i}/>)}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-5xl mb-4">🏠</div>
            <p className="font-medium">No rooms yet — be the first to list one!</p>
            <Link href="/auth/signup">
              <button className="mt-4 px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                List a Room
              </button>
            </Link>
          </div>
        )}

        <div className="text-center mt-10">
          <Link href="/browse">
            <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-white font-semibold hover:bg-red-600 transition-colors shadow-md shadow-red-500/20">
              Browse All Rooms <ArrowRight className="w-4 h-4"/>
            </button>
          </Link>
        </div>
      </section>

      {/* ── WHY LINKMATE ── */}
      <section className="bg-white py-16 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-semibold text-gray-900 mb-2">Why Choose LinkMate?</h2>
            <p className="text-muted-foreground">We make finding your next home simple and secure.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'Verified Listings', desc: 'Every listing is reviewed by our team to ensure safety and accuracy for our community.', color: 'bg-red-50 text-primary' },
              { icon: Star, title: 'Trusted Owners', desc: 'Connect directly with verified property owners. No middlemen, no hidden fees.', color: 'bg-amber-50 text-amber-600' },
              { icon: Zap, title: 'Instant Connect', desc: 'Send enquiries directly to owners and get replies fast — all from one place.', color: 'bg-blue-50 text-blue-600' },
            ].map((f, i) => (
              <motion.div key={f.title} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}
                className="bg-[#F7F7F7] rounded-3xl p-8 text-center">
                <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mx-auto mb-5`}>
                  <f.icon className="w-7 h-7"/>
                </div>
                <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-5 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-semibold text-gray-900 mb-2">How LinkMate Works</h2>
          <p className="text-muted-foreground">Three simple steps to your perfect room</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-black/8 z-0"/>
          {[
            {n:'1',t:'Search & Filter',d:'Find rooms by city, price range, type and amenities in seconds.'},
            {n:'2',t:'View & Enquire',d:'Explore photos and details. Send a direct enquiry to the owner.'},
            {n:'3',t:'Connect & Move',d:'Get a response from the owner and move into your perfect room.'},
          ].map((s,i) => (
            <motion.div key={s.n} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.15}}
              className="text-center relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-display font-semibold mx-auto mb-5 shadow-lg shadow-red-500/25">
                {s.n}
              </div>
              <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">{s.t}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-5 pb-16">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{opacity:0,scale:0.97}} whileInView={{opacity:1,scale:1}} viewport={{once:true}}
            className="relative rounded-3xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&q=80"
              alt="Modern apartment"
              width={1400} height={400}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/35 flex items-center px-10">
              <div>
                <h2 className="text-3xl font-display font-semibold text-white mb-2">Ready to find your room?</h2>
                <p className="text-white/70 mb-6 max-w-md">Join LinkMate and discover thousands of verified rooms across India.</p>
                <div className="flex gap-3">
                  <Link href="/auth/signup">
                    <button className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-red-600 transition-colors shadow-lg">
                      Get Started Free
                    </button>
                  </Link>
                  <Link href="/browse">
                    <button className="px-6 py-3 rounded-full bg-white/15 backdrop-blur-sm text-white font-semibold border border-white/25 hover:bg-white/25 transition-colors">
                      Browse Rooms
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-black/6">
        <div className="max-w-7xl mx-auto px-5 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <span className="font-display font-semibold text-lg">LinkMate</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">Finding the perfect place to live shouldn&apos;t be hard. LinkMate connects you with verified hosts and amazing spaces.</p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 uppercase tracking-wider text-gray-500">Quick Links</p>
              {[['Find a Room','/browse'],['List a Room','/auth/signup'],['Sign In','/auth/login']].map(([l,h]) => (
                <Link key={h} href={h} className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1">{l}</Link>
              ))}
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 uppercase tracking-wider text-gray-500">Company</p>
              {[['About Us','#'],['Safety Tips','#'],['Contact Support','#']].map(([l,h]) => (
                <a key={l} href={h} className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1">{l}</a>
              ))}
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 uppercase tracking-wider text-gray-500">Cities</p>
              {['Mumbai','Bangalore','Delhi','Pune','Hyderabad'].map(c => (
                <Link key={c} href={`/browse?city=${c}`} className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1">{c}</Link>
              ))}
            </div>
          </div>
          <div className="border-t border-black/6 pt-6 text-center text-sm text-muted-foreground">
            © 2024 LinkMate Technologies. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
