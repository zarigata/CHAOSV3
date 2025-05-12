/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║     << C.H.A.O.S.V3 - CODEX >> CONNECTION TEST PAGE        ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ System diagnostic page for testing backend connectivity     ║
 * ║ Tests API, WebSocket and Database connections              ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

"use client"

import { ConnectionTest } from "@/components/connection-test"

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-6">
      <div className="max-w-screen-lg mx-auto">
        <h1 className="text-3xl font-bold text-center mb-10 text-blue-900">
          C.H.A.O.S.V3 System Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Connection Diagnostics</h2>
          <p className="text-gray-600 mb-6">
            This page allows you to test the connections between the frontend, backend API, 
            WebSocket server, and MongoDB database. Use the test button below to verify 
            that all components of the system are functioning correctly.
          </p>
          
          <ConnectionTest />
        </div>
        
        <div className="text-center text-sm text-gray-500 mt-8">
          C.H.A.O.S.V3 Diagnostic Panel | <a href="/" className="text-blue-600 hover:underline">Return to Dashboard</a>
        </div>
      </div>
    </div>
  )
}
