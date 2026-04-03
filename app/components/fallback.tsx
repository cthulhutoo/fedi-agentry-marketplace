"use client"

import { useState, useEffect } from "react"

export default function Fallback({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for WebLN and Nostr availability (injected by Fedi)
    const checkInjections = () => {
      const hasWebLN = typeof window !== "undefined" && "webln" in window
      const hasNostr = typeof window !== "undefined" && "nostr" in window

      if (hasWebLN || hasNostr) {
        setStatus("success")
      } else {
        // Still allow app to work - just not inside Fedi
        setStatus("success") // Allow standalone mode
      }
    }

    checkInjections()
  }, [])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking wallet connection...</p>
        </div>
      </div>
    )
  }

  if (status === "error" && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
          <p className="text-red-600 font-medium mb-2">Connection Error</p>
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
