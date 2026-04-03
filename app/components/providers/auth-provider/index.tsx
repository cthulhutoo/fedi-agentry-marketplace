"use client"

import { User } from "@/lib/drizzle/schema"
import { createContext, useContext, useEffect, useState } from "react"
import { connect } from "./actions/connect"

interface AuthContextType {
  isLoading: boolean
  error: Error | null
  user: User | null
  nostrPubkey: string | null
  hasNostr: boolean
}

const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  error: null,
  user: null,
  nostrPubkey: null,
  hasNostr: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [nostrPubkey, setNostrPubkey] = useState<string | null>(null)
  const [hasNostr, setHasNostr] = useState(false)

  useEffect(() => {
    async function initAuth() {
      try {
        // Check for Nostr provider (injected by Fedi or browser extension)
        if (typeof window !== "undefined" && (window as any).nostr) {
          setHasNostr(true)
          const nostr = (window as any).nostr
          
          try {
            const pubkey = await nostr.getPublicKey()
            setNostrPubkey(pubkey)
            
            // Try to connect/login with this pubkey
            const connectionRes = await connect({ pubkey })
            
            if (connectionRes.success && "user" in connectionRes.data) {
              setUser(connectionRes.data.user)
            }
            // If no user found, we'll create one on first interaction
          } catch (e) {
            console.log("Nostr auth error:", e)
            // Continue without auth - user can still browse
          }
        }
        
        setIsLoading(false)
      } catch (e) {
        setError(e as Error)
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        error,
        user,
        nostrPubkey,
        hasNostr,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
