'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUpload } from '@/components/rooms/ImageUpload'
import { getSupabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks'
import { CITIES, ROOM_TYPES, AMENITIES_LIST } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

export default function EditRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = useRef(getSupabase()).current
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [room, setRoom] = useState<any>(null)
  const [form, setForm] = useState({ title:'', description:'', rent_price:'', location:'', city:'', room_type:'', num_beds:'1', is_available:true, amenities:[] as string[] })

  useEffect(() => {
    supabase.from('rooms').select('*,room_images(*)').eq('id', params.id).single().then(({ data }) => {
      if (data) {
        setRoom(data)
        setForm({ title:data.title, description:data.description, rent_price:String(data.rent_price), location:data.location, city:data.city, room_type:data.room_type, num_beds:String(data.num_beds), is_available:data.is_available, amenities:data.amenities||[] })
      }
      setLoading(false)
    })
  }, [params.id, supabase])

  const set = (k: string, v: any) => setForm(p => ({...p, [k]: v}))
  const toggleAmenity = (a: string) => set('amenities', form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('rooms').update({
      title:form.title.trim(), description:form.description.trim(), rent_price:Number(form.rent_price),
      location:form.location.trim(), city:form.city, room_type:form.room_type,
      num_beds:Number(form.num_beds), is_available:form.is_available, amenities:form.amenities,
    }).eq('id', params.id)
    if (error) { toast({ title:'Save failed', description:error.message, variant:'destructive' }) }
    else { toast({ title:'Changes saved! ✓' }); router.push('/owner') }
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Navbar/>
      <div className="pt-20 max-w-2xl mx-auto px-5 py-8">
        <Link href="/owner" className="flex items-center gap-2 text-muted-foreground hover:text-gray-900 mb-6 transition-colors text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Back to Dashboard
        </Link>
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
          <div className="bg-white rounded-3xl border border-black/6 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-black/6 bg-red-50">
              <h1 className="text-2xl font-display font-semibold text-gray-900">Edit Room</h1>
              <p className="text-muted-foreground text-sm mt-1 line-clamp-1">{room?.title}</p>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} required className="ios-input"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} required className="ios-input"/>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Area / Street *</label>
                  <input value={form.location} onChange={e => set('location', e.target.value)} required className="ios-input"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                  <select value={form.city} onChange={e => set('city', e.target.value)} required className="ios-input">
                    <option value="">Select city</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Type *</label>
                  <select value={form.room_type} onChange={e => set('room_type', e.target.value)} required className="ios-input">
                    <option value="">Select type</option>
                    {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Beds</label>
                  <input type="number" min="1" value={form.num_beds} onChange={e => set('num_beds', e.target.value)} className="ios-input"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rent (₹/mo)</label>
                  <input type="number" min="0" value={form.rent_price} onChange={e => set('rent_price', e.target.value)} className="ios-input"/>
                </div>
              </div>
              <label className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-black/6 cursor-pointer">
                <div>
                  <p className="font-medium text-sm text-gray-900">Available for Rent</p>
                  <p className="text-xs text-muted-foreground">Toggle off if occupied</p>
                </div>
                <Switch checked={form.is_available} onCheckedChange={v => set('is_available', v)}/>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AMENITIES_LIST.map(a => (
                    <label key={a} className={`flex items-center gap-2 p-2.5 rounded-2xl cursor-pointer text-sm transition-all border ${form.amenities.includes(a) ? 'bg-red-50 text-primary border-red-200' : 'bg-gray-50 border-black/6 hover:border-black/12'}`}>
                      <Checkbox checked={form.amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)}/>{a}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-500/20">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>Saving...</> : <><Save className="w-4 h-4"/>Save Changes</>}
              </button>
            </form>
          </div>

          {room && (
            <div className="mt-6 bg-white rounded-3xl border border-black/6 shadow-sm p-6">
              <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">Room Photos</h3>
              <ImageUpload roomId={params.id as string} existingImages={room.room_images || []}/>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
