'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = getSupabase()
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    const userId = data.user.id
    let role = 'citizen'
    for (let i = 0; i < 5; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 500))
      const { data: prof } = await supabase.from('users').select('role').eq('id', userId).single()
      if (prof?.role) { role = prof.role; break }
    }
    if (role === 'admin') router.replace('/admin')
    else if (role === 'owner') router.replace('/owner')
    else router.replace('/browse')
  }

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
            <h1 className="text-3xl font-display font-semibold text-gray-900">Welcome back</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Sign in to your account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0"/>{error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required className="ios-input"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required className="ios-input pr-11"/>
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-500/20 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Signing in...</> : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            No account?{' '}
            <Link href="/auth/signup" className="text-primary font-medium hover:text-red-600">Sign up free</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
