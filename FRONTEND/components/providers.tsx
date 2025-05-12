/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║    << C.H.A.O.S.V3 - CODEX >> CLIENT PROVIDERS WRAPPER    ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ Dedicated client-side providers wrapper                    ║
 * ║ Separates client components from server components         ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

"use client"

import React from 'react'
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { MessagingProvider } from "@/components/messaging-provider"

/**
 * OMEGA-MATRIX: Client Component Providers
 * Centralizes all client-side providers to avoid React Server Component issues
 * Follows proper provider nesting order: Auth > Messaging > Theme > Routes
 */
export function Providers({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <AuthProvider>
      <MessagingProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </ThemeProvider>
      </MessagingProvider>
    </AuthProvider>
  )
}
