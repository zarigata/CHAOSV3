/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║       << C.H.A.O.S.V3 - CODEX >> LOGIN INTERFACE          ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ Authentication UI component with Windows XP styling        ║
 * ║ Provides login and registration capabilities               ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ChaosLogo } from './chaos-logo'
import { Alert, AlertDescription } from './ui/alert'
import { ReloadIcon } from '@radix-ui/react-icons'

// CIPHER-X: Login form component with Windows XP-inspired styling
export function LoginForm() {
  // OMEGA-MATRIX: Router for navigation after login
  const router = useRouter()
  
  // OMEGA-MATRIX: Access authentication context
  const { login, register, isAuthenticated, loading, error, setError } = useAuth()
  
  // OMEGA-MATRIX: Form state management
  const [activeTab, setActiveTab] = useState<string>('login')
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    displayName: '' 
  })
  
  // CIPHER-X: Clear error message when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setError(null)
  }
  
  // CIPHER-X: Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginData.email || !loginData.password) {
      setError('Email and password are required')
      return
    }
    
    const success = await login(loginData.email, loginData.password)
    
    if (success) {
      router.push('/')
    }
  }
  
  // CIPHER-X: Handle registration form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!registerData.username || !registerData.email || !registerData.password) {
      setError('All fields are required')
      return
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(registerData.username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }
    
    const success = await register(
      registerData.username, 
      registerData.email, 
      registerData.password,
      registerData.displayName || undefined
    )
    
    if (success) {
      router.push('/')
    }
  }
  
  // CIPHER-X: Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/')
    return null
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Windows XP-style card with blue header */}
        <Card className="border-2 border-[#0078D7] shadow-xl">
          <CardHeader className="bg-gradient-to-r from-[#245EDC] to-[#1C3E9C] text-white">
            <div className="flex items-center gap-2">
              <ChaosLogo className="w-8 h-8" />
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">C.H.A.O.S.V3</CardTitle>
                <CardDescription className="text-blue-100">Modern MSN-Inspired Chat Platform</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          {/* Login/Register tabs */}
          <Tabs defaultValue="login" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full bg-[#ECE9D8] border-b border-gray-300">
              <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow">
                Register
              </TabsTrigger>
            </TabsList>
            
            {/* Error message */}
            {error && (
              <Alert variant="destructive" className="mt-4 mx-4 bg-red-50 text-red-800 border border-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Login form */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="pt-6 pb-4 space-y-4 bg-white">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="border-gray-300 focus:border-blue-500"
                      disabled={loading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-gray-700">Password</Label>
                      <a href="#" className="text-xs text-blue-600 hover:underline">Forgot password?</a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="••••••••"
                      className="border-gray-300 focus:border-blue-500"
                      disabled={loading}
                      required
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="bg-[#F0F0F0] border-t border-gray-200">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#0078D7] hover:bg-[#106EBE]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : 'Sign In'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            {/* Register form */}
            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <CardContent className="pt-6 pb-4 space-y-4 bg-white">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-700">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      placeholder="cooluser123"
                      className="border-gray-300 focus:border-blue-500"
                      disabled={loading}
                      required
                    />
                    <p className="text-xs text-gray-500">Letters, numbers, and underscores only</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-gray-700">Display Name (Optional)</Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={registerData.displayName}
                      onChange={(e) => setRegisterData({ ...registerData, displayName: e.target.value })}
                      placeholder="Cool User"
                      className="border-gray-300 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="registerEmail" className="text-gray-700">Email</Label>
                    <Input
                      id="registerEmail"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="border-gray-300 focus:border-blue-500"
                      disabled={loading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword" className="text-gray-700">Password</Label>
                    <Input
                      id="registerPassword"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      placeholder="••••••••"
                      className="border-gray-300 focus:border-blue-500"
                      disabled={loading}
                      required
                    />
                    <p className="text-xs text-gray-500">Minimum 6 characters</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="border-gray-300 focus:border-blue-500"
                      disabled={loading}
                      required
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="bg-[#F0F0F0] border-t border-gray-200">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#0078D7] hover:bg-[#106EBE]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : 'Create Account'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        
        <div className="text-center mt-4 text-sm text-gray-600">
          © 2025 CHAOSV3 • <a href="/test" className="text-blue-600 hover:underline">System Diagnostics</a>
        </div>
      </div>
    </div>
  )
}
