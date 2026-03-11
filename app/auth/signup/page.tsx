'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, AlertCircle, UserCircle, Home, CheckCircle } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [role, setRole] = useState<'citizen' | 'owner'>('citizen')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = getSupabase()
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.name, role } },
    })
    if (err) { setError(err.message); setLoading(false); return }
    if (data.user) {
      if (data.session) {
        await supabase.from('users').upsert({ id: data.user.id, email: form.email, full_name: form.name, role, phone: form.phone || null })
        router.replace(role === 'owner' ? '/owner' : '/browse')
      } else { setEmailSent(true); setLoading(false) }
    } else { setLoading(false) }
  }

  if (emailSent) return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4">
      <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="w-full max-w-md bg-white rounded-3xl p-10 shadow-sm border border-black/6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-500"/>
        </div>
        <h2 className="text-2xl font-display font-semibold mb-2">Check your email</h2>
        <p className="text-muted-foreground text-sm mb-2">We sent a confirmation link to <strong className="text-gray-800">{form.email}</strong></p>
        <p className="text-muted-foreground text-sm mb-8">Click the link in your email to confirm, then sign in.</p>
        <Link href="/auth/login">
          <button className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-red-600 transition-colors">
            Go to Sign In
          </button>
        </Link>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/6">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span className="font-display font-semibold text-xl text-gray-900">LinkMate</span>
            </Link>
            <h1 className="text-3xl font-display font-semibold text-gray-900">Create account</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Join thousands finding their perfect home</p>
          </div>

          {/* Role picker */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">I want to...</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { r: 'citizen' as const, icon: UserCircle, title: 'Find a Room', desc: 'Browse & rent rooms' },
                { r: 'owner' as const, icon: Home, title: 'List a Room', desc: 'Post & manage rooms' },
              ].map(opt => (
                <button key={opt.r} type="button" onClick={() => setRole(opt.r)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${role === opt.r ? 'border-primary bg-red-50' : 'border-black/8 hover:border-black/20 bg-[#F7F7F7]'}`}>
                  <opt.icon className={`w-6 h-6 mb-2 ${role === opt.r ? 'text-primary' : 'text-gray-400'}`}/>
                  <div className={`font-semibold text-sm ${role === opt.r ? 'text-primary' : 'text-gray-800'}`}>{opt.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0"/>{error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {[
              { k:'name', label:'Full Name', type:'text', placeholder:'John Doe' },
              { k:'email', label:'Email', type:'email', placeholder:'you@example.com' },
              { k:'phone', label:'Phone (optional)', type:'tel', placeholder:'+91 98765 43210' },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                <input type={f.type} placeholder={f.placeholder}
                  value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)}
                  required={f.k !== 'phone'} className="ios-input"/>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} placeholder="Min 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  required minLength={6} className="ios-input pr-11"/>
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-500/20 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Creating account...</> : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:text-red-600">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
