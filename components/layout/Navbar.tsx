'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LayoutDashboard, LogOut, Heart, Plus, Shield, Search } from 'lucide-react'
import { useAuth } from '@/lib/hooks'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Detect if we're on a hero page (transparent nav) vs interior page (white nav)
  const isHeroPage = pathname === '/'

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  const handleSignOut = async () => { await signOut(); router.push('/') }
  const dashLink = profile?.role === 'admin' ? '/admin' : profile?.role === 'owner' ? '/owner' : '/browse'
  const initial = (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()

  const navBg = isHeroPage
    ? scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-black/5' : 'bg-transparent'
    : 'bg-white border-b border-black/8 shadow-sm'

  const textColor = isHeroPage && !scrolled ? 'text-white' : 'text-gray-800'
  const mutedText = isHeroPage && !scrolled ? 'text-white/70' : 'text-gray-500'

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span className={`font-display font-semibold text-lg tracking-tight ${textColor}`}>LinkMate</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { href: '/', label: 'Home' },
            { href: '/browse', label: 'Find a Room' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                pathname === l.href
                  ? isHeroPage && !scrolled ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'
                  : `${mutedText} hover:${isHeroPage && !scrolled ? 'text-white bg-white/10' : 'text-gray-900 bg-gray-100'}`
              }`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!loading && (user ? (
            <>
              {profile?.role === 'owner' && (
                <Link href="/owner/add" className="hidden sm:flex">
                  <button className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-primary text-white shadow-sm hover:bg-red-600 transition-colors`}>
                    <Plus className="w-3.5 h-3.5"/> List Room
                  </button>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm hover:scale-105 transition-transform shadow-md">
                    {initial}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-black/8 shadow-xl rounded-2xl p-1">
                  <div className="px-3 py-2.5 border-b border-black/6 mb-1">
                    <p className="font-semibold text-sm">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile?.role} account</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href={dashLink} className="cursor-pointer rounded-xl flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                      <LayoutDashboard className="w-4 h-4 text-muted-foreground"/> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === 'citizen' && (
                    <DropdownMenuItem asChild>
                      <Link href="/browse/favorites" className="cursor-pointer rounded-xl flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                        <Heart className="w-4 h-4 text-muted-foreground"/> Saved Rooms
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {profile?.role === 'owner' && (
                    <DropdownMenuItem asChild>
                      <Link href="/owner/add" className="cursor-pointer rounded-xl flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                        <Plus className="w-4 h-4 text-muted-foreground"/> Add New Room
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {profile?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer rounded-xl flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                        <Shield className="w-4 h-4 text-muted-foreground"/> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="my-1"/>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer rounded-xl flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 focus:bg-red-50 focus:text-red-500">
                    <LogOut className="w-4 h-4"/> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/auth/login">
                <button className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isHeroPage && !scrolled ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}>
                  Sign In
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="px-5 py-2 rounded-full text-sm font-semibold bg-primary text-white shadow-sm hover:bg-red-600 transition-colors">
                  Get Started
                </button>
              </Link>
            </div>
          ))}

          <button onClick={() => setOpen(!open)} className={`md:hidden p-2 rounded-xl transition-colors ${isHeroPage && !scrolled ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}>
            {open ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="md:hidden bg-white border-t border-black/6 px-5 py-4 space-y-1 shadow-lg">
            {[{href:'/',label:'Home'},{href:'/browse',label:'Find a Room'}].map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href={dashLink} onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-2xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
                  <LayoutDashboard className="w-4 h-4"/> Dashboard
                </Link>
                {profile?.role === 'owner' && (
                  <Link href="/owner/add" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-2xl text-primary hover:bg-red-50 text-sm font-medium">
                    <Plus className="w-4 h-4"/> List a Room
                  </Link>
                )}
                <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 text-sm font-medium">
                  <LogOut className="w-4 h-4"/> Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link href="/auth/login" className="flex-1" onClick={() => setOpen(false)}>
                  <button className="w-full py-3 rounded-2xl border border-black/10 text-sm font-medium text-gray-700">Sign In</button>
                </Link>
                <Link href="/auth/signup" className="flex-1" onClick={() => setOpen(false)}>
                  <button className="w-full py-3 rounded-2xl bg-primary text-white text-sm font-semibold">Get Started</button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
