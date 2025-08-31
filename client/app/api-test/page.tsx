"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"

export default function ApiTestPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testApiConnection = async () => {
    setLoading(true)
    setTestResults([])
    
    try {
      // Test 1: Direct fetch to stats endpoint
      addResult("🧪 Testing stats endpoint...")
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/summary/`)
      addResult(`📊 Stats response: ${statsResponse.status} ${statsResponse.statusText}`)
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        addResult(`✅ Stats data: ${JSON.stringify(statsData)}`)
      } else {
        addResult(`❌ Stats failed: ${await statsResponse.text()}`)
      }

      // Test 2: Environment variables
      addResult(`🌍 Environment: NEXT_PUBLIC_API_URL = ${process.env.NEXT_PUBLIC_API_URL}`)
      addResult(`🌍 Environment: NEXT_PUBLIC_ENVIRONMENT = ${process.env.NEXT_PUBLIC_ENVIRONMENT}`)

      // Test 3: Groups endpoint
      addResult("🧪 Testing groups endpoint...")
      const groupsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/`)
      addResult(`👥 Groups response: ${groupsResponse.status} ${groupsResponse.statusText}`)
      
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        addResult(`✅ Found ${groupsData.length} groups`)
      } else {
        addResult(`❌ Groups failed: ${await groupsResponse.text()}`)
      }

    } catch (error) {
      addResult(`💥 Error: ${error}`)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    testApiConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <Button onClick={testApiConnection} disabled={loading}>
              {loading ? "Testing..." : "Run Tests Again"}
            </Button>
          </div>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.length === 0 && loading && (
              <div>Running API tests...</div>
            )}
            {testResults.map((result, index) => (
              <div key={index} className="mb-1">{result}</div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="space-y-2">
            <a href="http://localhost:8000/api/stats/summary/" target="_blank" rel="noopener noreferrer" 
               className="block text-blue-600 hover:underline">
              🔗 Direct API: Stats Summary
            </a>
            <a href="http://localhost:8000/api/groups/" target="_blank" rel="noopener noreferrer" 
               className="block text-blue-600 hover:underline">
              🔗 Direct API: Groups List
            </a>
            <a href="/" className="block text-blue-600 hover:underline">
              🏠 Back to Homepage
            </a>
            <a href="/discover" className="block text-blue-600 hover:underline">
              🔍 Discover Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
