/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║      << C.H.A.O.S.V3 - CODEX >> APPLICATION LAYOUT         ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ Root layout configuration for the CHAOSV3 platform         ║
 * ║ Sets up global providers for auth, theming, and styling    ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║      << C.H.A.O.S.V3 - CODEX >> APPLICATION LAYOUT         ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ Root layout configuration for the CHAOSV3 platform         ║
 * ║ Sets up global providers for auth, theming, and styling    ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { MessagingProvider } from "@/components/messaging-provider"

const inter = Inter({ subsets: ["latin"] })

// CIPHER-X: Application metadata configuration
export const metadata = {
  title: "C.H.A.O.S.V3 - Communication Hub for Animated Online Socializing",
  description: "A cross-platform MSN-inspired chat platform with modern features",
  generator: 'CHAOSV3 Team'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // OMEGA-MATRIX: Application shell with global providers
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* CIPHER-X: Nested providers with authentication and route protection */}
        {/* CIPHER-X: Nested provider architecture - Auth > Messaging > Theme > Routes */}
        <AuthProvider>
          <MessagingProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
              {/* OMEGA-MATRIX: Protection layer for authenticated routes */}
              <ProtectedRoute>
                {children}
              </ProtectedRoute>
            </ThemeProvider>
          </MessagingProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
