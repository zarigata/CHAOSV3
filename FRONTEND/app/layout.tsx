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

// OMEGA-MATRIX: Import client-side providers wrapper
import { Providers } from "../components/providers"

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
        {/* CIPHER-X: Using a single Providers component to avoid client/server component confusion */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
