'use client'

import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

const PUBLIC_PATHS = ['/login', '/signup', '/']

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading, user } = useAuth()
  const pathname = usePathname()

  const isPublicPage = PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== '/' && pathname?.startsWith(p + '/'))
  )

  // Public pages (login/signup): render children only, no sidebar/header
  if (isPublicPage) {
    return <>{children}</>
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  // Authenticated: render with sidebar + header
  if (user) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // Not authenticated and not on a public page:
  // Render children anyway (middleware handles redirect)
  return <>{children}</>
}
