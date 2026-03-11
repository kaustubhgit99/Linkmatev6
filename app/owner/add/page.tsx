'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUpload } from '@/components/rooms/ImageUpload'
import { getSupabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks'
import { CITIES, ROOM_TYPES, AMENITIES_LIST } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

export default function AddRoomPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const supabase = useRef(getSupabase()).current
  const [step, setStep] = useState<'form'|'photos'|'done'>('form')
  const [roomId, setRoomId] = useState<string|null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title:'', description:'', rent_price:'', location:'', city:'', room_type:'', num_beds:'1', is_available:true, amenities:[] as string[]
  })

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
    if (!authLoading && profile && profile.role !== 'owner' && profile.role !== 'admin') router.push('/browse')
  }, [user, profile, authLoading, router])

  const set = (k: string, v: any) => setForm(p => ({...p, [k]: v}))
  const toggleAmenity = (a: string) => set('amenities', form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push('/auth/login'); return }
    if (!form.city || !form.room_type) { toast({ title:'Missing fields', description:'Please select a city and room type', variant:'destructive' }); return }
    setSubmitting(true)
    const { data, error } = await supabase.from('rooms').insert({
      owner_id: user.id,
      title: form.title.trim(), description: form.description.trim(),
      rent_price: Number(form.rent_price), location: form.location.trim(),
      city: form.city, room_type: form.room_type, num_beds: Number(form.num_beds),
      is_available: form.is_available, amenities: form.amenities,
    }).select().single()
    if (error) { toast({ title:'Failed to create room', description:error.message, variant:'destructive' }); setSubmitting(false); return }
    setRoomId(data.id)
    toast({ title:'Room created! 🎉', description:'Now add some photos to attract tenants.' })
    setStep('photos')
    setSubmitting(false)
  }

  if (authLoading) return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  const stepNum = step === 'form' ? 1 : step === 'photos' ? 2 : 3

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Navbar/>
      <div className="pt-20 max-w-2xl mx-auto px-5 py-8">
        <Link href="/owner" className="flex items-center gap-2 text-muted-foreground hover:text-gray-900 mb-6 transition-colors text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Back to Dashboard
        </Link>

        {/* Progress steps */}
        <div className="flex items-center gap-3 mb-8">
          {[{n:1,l:'Details'},{n:2,l:'Photos'},{n:3,l:'Done'}].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                s.n === stepNum ? 'bg-primary text-white shadow-md shadow-red-500/25'
                : s.n < stepNum ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-400'}`}>
                {s.n < stepNum ? <CheckCircle className="w-4 h-4"/> : s.n}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${s.n === stepNum ? 'text-gray-900' : 'text-muted-foreground'}`}>{s.l}</span>
              {i < 2 && <div className="w-8 h-px bg-gray-200 mx-1"/>}
            </div>
          ))}
        </div>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
          {step === 'form' && (
            <div className="bg-white rounded-3xl border border-black/6 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-black/6 bg-red-50">
                <h1 className="text-2xl font-display font-semibold text-gray-900">Add New Room</h1>
                <p className="text-muted-foreground text-sm mt-1">Fill in the details to list your room</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic */}
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Title *</label>
                    <input placeholder="e.g. Cozy 1BHK near Metro Station" value={form.title} onChange={e => set('title', e.target.value)} required className="ios-input"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                    <textarea placeholder="Describe your room — size, surroundings, what makes it special..." rows={4} value={form.description} onChange={e => set('description', e.target.value)} required className="ios-input"/>
                  </div>
                </section>

                {/* Location */}
                <section className="space-y-4 pt-4 border-t border-black/6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Area / Street Address *</label>
                      <input placeholder="e.g. Koramangala 5th Block" value={form.location} onChange={e => set('location', e.target.value)} required className="ios-input"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                      <select value={form.city} onChange={e => set('city', e.target.value)} required
                        className="ios-input">
                        <option value="">Select city</option>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Room details */}
                <section className="space-y-4 pt-4 border-t border-black/6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Room Details</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Type *</label>
                      <select value={form.room_type} onChange={e => set('room_type', e.target.value)} required className="ios-input">
                        <option value="">Select type</option>
                        {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">No. of Beds *</label>
                      <input type="number" min="1" max="10" value={form.num_beds} onChange={e => set('num_beds', e.target.value)} required className="ios-input"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Rent (₹) *</label>
                      <input type="number" min="500" placeholder="e.g. 12000" value={form.rent_price} onChange={e => set('rent_price', e.target.value)} required className="ios-input"/>
                    </div>
                  </div>
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-black/6 cursor-pointer">
                    <div>
                      <p className="font-medium text-sm text-gray-900">Available for Rent</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Toggle off if currently occupied</p>
                    </div>
                    <Switch checked={form.is_available} onCheckedChange={v => set('is_available', v)}/>
                  </label>
                </section>

                {/* Amenities */}
                <section className="space-y-4 pt-4 border-t border-black/6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amenities <span className="font-normal normal-case tracking-normal">(select all that apply)</span></h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AMENITIES_LIST.map(a => (
                      <label key={a} className={`flex items-center gap-2 p-2.5 rounded-2xl cursor-pointer transition-all text-sm border ${form.amenities.includes(a) ? 'bg-red-50 text-primary border-red-200' : 'bg-gray-50 border-black/6 hover:border-black/12'}`}>
                        <Checkbox checked={form.amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)}/>
                        {a}
                      </label>
                    ))}
                  </div>
                </section>

                <button type="submit" disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-500/20">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin"/>Creating listing...</> : 'Continue → Add Photos'}
                </button>
              </form>
            </div>
          )}

          {step === 'photos' && roomId && (
            <div className="bg-white rounded-3xl border border-black/6 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-black/6 bg-red-50">
                <h2 className="text-2xl font-display font-semibold text-gray-900">Add Photos</h2>
                <p className="text-muted-foreground text-sm mt-1">Listings with photos get 3× more inquiries</p>
              </div>
              <div className="p-6">
                <ImageUpload roomId={roomId}/>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep('done')} className="flex-1 py-3 rounded-2xl border border-black/10 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Skip for now</button>
                  <button onClick={() => setStep('done')} className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-red-600 transition-colors">Done! View Listing →</button>
                </div>
              </div>
            </div>
          )}

          {step === 'done' && roomId && (
            <div className="bg-white rounded-3xl border border-black/6 shadow-sm p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-green-500"/>
              </div>
              <h2 className="text-3xl font-display font-semibold text-gray-900 mb-2">Room Listed! 🎉</h2>
              <p className="text-muted-foreground mb-8">Your room is now live and visible to thousands of users.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/owner/add"><button className="px-6 py-3 rounded-full border border-black/10 text-sm font-medium hover:bg-gray-50 transition-colors">Add Another Room</button></Link>
                <Link href={`/room/${roomId}`}><button className="px-6 py-3 rounded-full border border-black/10 text-sm font-medium hover:bg-gray-50 transition-colors">View Listing</button></Link>
                <Link href="/owner"><button className="px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold hover:bg-red-600 transition-colors">Go to Dashboard</button></Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
