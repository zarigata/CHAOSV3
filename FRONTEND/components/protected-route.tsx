/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║     << C.H.A.O.S.V3 - CODEX >> ROUTE PROTECTION LAYER     ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ Client-side authentication guard for protected routes      ║
 * ║ Redirects unauthenticated users to the login page          ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

"use client"

import { useAuth } from './auth-provider'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { ReloadIcon } from '@radix-ui/react-icons'

// CIPHER-X: Path configuration for authentication enforcement
const PUBLIC_PATHS = ['/login', '/test']

// CIPHER-X: Protected route wrapper component
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // OMEGA-MATRIX: Access authentication state and navigation
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // CIPHER-X: Handle authentication state changes
  useEffect(() => {
    if (!loading) {
      const isPublicPath = PUBLIC_PATHS.includes(pathname)
      
      if (!isAuthenticated && !isPublicPath) {
        // Redirect to login if accessing protected route while unauthenticated
        router.push('/login')
      } else if (isAuthenticated && pathname === '/login') {
        // Redirect to dashboard if accessing login while authenticated
        router.push('/')
      }
    }
  }, [isAuthenticated, loading, pathname, router])
  
  // CIPHER-X: Show loading indicator during authentication check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center space-y-4">
          <ReloadIcon className="h-8 w-8 text-blue-500 animate-spin" />
          <div className="text-gray-600">Initializing CHAOSV3...</div>
        </div>
      </div>
    )
  }
  
  // CIPHER-X: Allow public paths regardless of authentication status
  const isPublicPath = PUBLIC_PATHS.includes(pathname)
  
  // CIPHER-X: Control rendering based on authentication state
  if (isPublicPath || isAuthenticated) {
    return <>{children}</>
  }
  
  // CIPHER-X: Show nothing temporarily while redirecting (avoids flicker)
  return null
}
