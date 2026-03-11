import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl font-display font-bold text-primary mb-4">404</div>
      <h1 className="text-3xl font-display font-semibold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/"
        className="px-8 py-3 rounded-full bg-primary text-white font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
        Go Home
      </Link>
    </div>
  )
}
