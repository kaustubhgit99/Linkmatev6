import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware is intentionally kept minimal.
// Supabase v2 uses chunked cookies (sb-*-auth-token.0, .1, etc.)
// that are unreliable to parse in Edge middleware without the full
// @supabase/ssr package. Instead we let pages handle their own auth
// redirects (which they already do via useAuth + useEffect).
//
// The only thing middleware does here is a lightweight redirect away
// from auth pages when a Supabase session cookie is clearly present.

export function middleware(req: NextRequest) {
  // Do nothing — let client-side auth guards handle redirects.
  // This avoids the redirect loop caused by middleware mis-reading
  // Supabase's chunked cookie format.
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
