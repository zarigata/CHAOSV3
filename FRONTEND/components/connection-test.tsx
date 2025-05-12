/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║        << C.H.A.O.S.V3 - CODEX >> CONNECTION TESTER       ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ Component to test connectivity to backend and database     ║
 * ║ Monitors socket and API status as well as MongoDB state    ║
 * ║ Provides visual indicators for easy troubleshooting        ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

"use client"

import React, { useState, useEffect } from "react"
import io, { Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// CIPHER-X: Environment configuration and constants
const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1")
  : "http://localhost:5000/api/v1"
const SOCKET_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000")
  : "http://localhost:5000"

// CIPHER-X: Component state interfaces
interface StatusState {
  apiConnected: boolean
  socketConnected: boolean
  dbConnected: boolean
  apiLatency: number | null
  socketLatency: number | null
  lastMessage: string | null
  testing: boolean
  error: string | null
}

// CIPHER-X: Main connection test component
export function ConnectionTest() {
  // OMEGA-MATRIX: State trackers for all system connections
  const [status, setStatus] = useState<StatusState>({
    apiConnected: false,
    socketConnected: false,
    dbConnected: false,
    apiLatency: null,
    socketLatency: null,
    lastMessage: null,
    testing: false,
    error: null
  })
  
  const [socket, setSocket] = useState<Socket | null>(null)
  const [progress, setProgress] = useState(0)
  const [testComplete, setTestComplete] = useState(false)

  // CIPHER-X: Socket initialization and cleanup
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [socket])

  // CIPHER-X: Run comprehensive connection test
  const runConnectionTest = async () => {
    setStatus((prev: StatusState) => ({ ...prev, testing: true, error: null }))
    setProgress(0)
    setTestComplete(false)
    
    // OMEGA-MATRIX: Progressive test sequence
    const steps = [
      testAPIConnection,
      testSocketConnection,
      testDatabaseConnection
    ]
    
    for (let i = 0; i < steps.length; i++) {
      try {
        // CIPHER-X: Execute test step with progress tracking
        await steps[i]()
        setProgress(Math.round(((i + 1) / steps.length) * 100))
      } catch (error: any) {
        setStatus((prev: StatusState) => ({ 
          ...prev, 
          testing: false,
          error: `Test failed at step ${i + 1}: ${error.message}`
        }))
        setProgress(Math.round(((i + 1) / steps.length) * 100))
        setTestComplete(true)
        return
      }
    }
    
    setStatus((prev: StatusState) => ({ ...prev, testing: false }))
    setTestComplete(true)
  }

  // CIPHER-X: Test REST API connectivity
  const testAPIConnection = async () => {
    try {
      const startTime = performance.now()
      const response = await fetch(`${API_URL}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const endTime = performance.now()
      
      setStatus((prev: StatusState) => ({ 
        ...prev, 
        apiConnected: true,
        apiLatency: Math.round(endTime - startTime),
        lastMessage: data.message
      }))
    } catch (error) {
      setStatus((prev: StatusState) => ({ ...prev, apiConnected: false }))
      throw new Error(`API connection failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // CIPHER-X: Test WebSocket connectivity
  const testSocketConnection = async () => {
    return new Promise<void>((resolve, reject) => {
      try {
        // OMEGA-MATRIX: Socket connection with timeout safeguard
        const socketInstance = io(SOCKET_URL, {
          transports: ['websocket'],
          timeout: 5000,
        })
        
        const startTime = performance.now()
        const timeoutId = setTimeout(() => {
          socketInstance.disconnect()
          reject(new Error('Socket connection timeout'))
        }, 5000)
        
        socketInstance.on('connect', () => {
          const endTime = performance.now()
          clearTimeout(timeoutId)
          
          setStatus((prev: StatusState) => ({ 
            ...prev, 
            socketConnected: true,
            socketLatency: Math.round(endTime - startTime),
          }))
          
          setSocket(socketInstance)
          resolve()
        })
        
        socketInstance.on('connect_error', (err: Error) => {
          clearTimeout(timeoutId)
          socketInstance.disconnect()
          reject(new Error(`Socket connection error: ${err.message}`))
        })
        
        socketInstance.on('disconnect', () => {
          setStatus((prev: StatusState) => ({ ...prev, socketConnected: false }))
        })
        
      } catch (error) {
        reject(new Error(`Socket setup failed: ${error instanceof Error ? error.message : String(error)}`))
      }
    })
  }

  // CIPHER-X: Test database connectivity through API
  const testDatabaseConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/test/db`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Database test API error: ${response.status}`)
      }

      const data = await response.json()
      
      setStatus((prev: StatusState) => ({ 
        ...prev, 
        dbConnected: data.dbConnected,
        lastMessage: data.message
      }))
      
      if (!data.dbConnected) {
        throw new Error('Database is not connected')
      }
    } catch (error) {
      setStatus((prev: StatusState) => ({ ...prev, dbConnected: false }))
      throw new Error(`Database connection test failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // CIPHER-X: Status badge component with dynamic styling
  const StatusBadge = ({ connected, label }: { connected: boolean, label: string }) => (
    <Badge className={connected ? "bg-green-500" : "bg-red-500"}>
      {label}: {connected ? "✓ Connected" : "✗ Disconnected"}
    </Badge>
  )

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
        <CardTitle className="text-xl font-bold tracking-tight">C.H.A.O.S.V3 Connection Tester</CardTitle>
        <CardDescription className="text-blue-100">Test backend connectivity and MongoDB status</CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium">Connection Status:</h3>
          <div className="flex flex-wrap gap-2">
            <StatusBadge connected={status.apiConnected} label="API" />
            <StatusBadge connected={status.socketConnected} label="WebSocket" />
            <StatusBadge connected={status.dbConnected} label="MongoDB" />
          </div>
        </div>
        
        {(status.apiLatency !== null || status.socketLatency !== null) && (
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-medium">Performance:</h3>
            <div className="grid grid-cols-2 gap-2">
              {status.apiLatency !== null && (
                <div className="bg-gray-100 p-2 rounded">
                  <span className="text-xs text-gray-500">API Latency:</span>
                  <p className="font-mono">{status.apiLatency} ms</p>
                </div>
              )}
              
              {status.socketLatency !== null && (
                <div className="bg-gray-100 p-2 rounded">
                  <span className="text-xs text-gray-500">Socket Latency:</span>
                  <p className="font-mono">{status.socketLatency} ms</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {status.testing && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Testing in progress...</h3>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {status.error && (
          <Alert variant="destructive">
            <AlertTitle>Test Failed</AlertTitle>
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}
        
        {testComplete && !status.error && (
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle>Test Completed Successfully</AlertTitle>
            <AlertDescription>
              All services are connected and working properly.
              {status.lastMessage && <p className="mt-1 text-sm">Server says: "{status.lastMessage}"</p>}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-4 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          API: {API_URL} | Socket: {SOCKET_URL}
        </div>
        <Button 
          onClick={runConnectionTest} 
          disabled={status.testing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {status.testing ? "Testing..." : "Run Connection Test"}
        </Button>
      </CardFooter>
    </Card>
  )
}
