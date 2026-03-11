'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, Building2 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { RoomCard, RoomCardSkeleton } from '@/components/rooms/RoomCard'
import { getSupabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks'
import { CITIES, ROOM_TYPES } from '@/lib/utils'

function BrowseContent() {
  const sp = useSearchParams()
  const { user } = useAuth()
  const supabase = useRef(getSupabase()).current
  const [all, setAll] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState(sp.get('city') || '')
  const [type, setType] = useState('')
  const [avail, setAvail] = useState('')
  const [minP, setMinP] = useState('')
  const [maxP, setMaxP] = useState('')
  const [advanced, setAdvanced] = useState(false)

  useEffect(() => {
    supabase.from('rooms').select('*,room_images(*),users(full_name,email,phone)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const d = data || []
        setAll(d)
        setFiltered(city ? d.filter((r: any) => r.city === city) : d)
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let r = [...all]
    if (search) { const s = search.toLowerCase(); r = r.filter(x => x.title?.toLowerCase().includes(s) || x.location?.toLowerCase().includes(s) || x.city?.toLowerCase().includes(s)) }
    if (city) r = r.filter(x => x.city === city)
    if (type) r = r.filter(x => x.room_type === type)
    if (avail === 'true') r = r.filter(x => x.is_available)
    if (avail === 'false') r = r.filter(x => !x.is_available)
    if (minP) r = r.filter(x => x.rent_price >= Number(minP))
    if (maxP) r = r.filter(x => x.rent_price <= Number(maxP))
    setFiltered(r)
  }, [search, city, type, avail, minP, maxP, all])

  const hasFilters = search || city || type || avail || minP || maxP
  const clearAll = () => { setSearch(''); setCity(''); setType(''); setAvail(''); setMinP(''); setMaxP('') }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Navbar/>
      <div className="pt-20 max-w-7xl mx-auto px-5 py-8">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="mb-8">
          <h1 className="text-4xl font-display font-semibold text-gray-900 mb-1">Browse Rooms</h1>
          <p className="text-muted-foreground text-sm">{loading ? 'Loading...' : `${filtered.length} room${filtered.length !== 1 ? 's' : ''} found`}</p>
        </motion.div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl p-4 border border-black/6 shadow-sm mb-8">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, location..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-black/8 text-sm outline-none focus:border-primary focus:bg-white transition-colors"/>
            </div>
            <select value={city} onChange={e => setCity(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-gray-50 border border-black/8 text-sm outline-none focus:border-primary text-gray-700 min-w-36">
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => setAdvanced(!advanced)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${advanced ? 'border-primary text-primary bg-red-50' : 'border-black/8 bg-gray-50 text-gray-600 hover:border-black/20'}`}>
              <SlidersHorizontal className="w-4 h-4"/> Filters
            </button>
            {hasFilters && (
              <button onClick={clearAll} className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-gray-50 border border-black/8 text-sm text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors">
                <X className="w-3.5 h-3.5"/> Clear
              </button>
            )}
          </div>

          {advanced && (
            <div className="mt-4 pt-4 border-t border-black/6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select value={type} onChange={e => setType(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-gray-50 border border-black/8 text-sm outline-none focus:border-primary text-gray-700">
                <option value="">All Types</option>
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" placeholder="Min Price (₹)" value={minP} onChange={e => setMinP(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-gray-50 border border-black/8 text-sm outline-none focus:border-primary"/>
              <input type="number" placeholder="Max Price (₹)" value={maxP} onChange={e => setMaxP(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-gray-50 border border-black/8 text-sm outline-none focus:border-primary"/>
              <select value={avail} onChange={e => setAvail(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-gray-50 border border-black/8 text-sm outline-none focus:border-primary text-gray-700">
                <option value="">Any Status</option>
                <option value="true">Available</option>
                <option value="false">Occupied</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array(9).fill(0).map((_,i) => <RoomCardSkeleton key={i}/>)}</div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((r,i) => <RoomCard key={r.id} room={r} userId={user?.id} index={i}/>)}
          </div>
        ) : (
          <div className="text-center py-24 text-muted-foreground">
            <Building2 className="w-14 h-14 mx-auto mb-4 opacity-20"/>
            <h3 className="text-xl font-display font-semibold mb-2 text-gray-800">No rooms found</h3>
            <p className="text-sm">Try adjusting or clearing your filters.</p>
            {hasFilters && <button className="mt-5 px-6 py-2.5 rounded-full border border-black/10 text-sm font-medium hover:bg-gray-50 transition-colors" onClick={clearAll}>Clear Filters</button>}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>}>
      <BrowseContent/>
    </Suspense>
  )
}
