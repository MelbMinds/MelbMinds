"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"

export type User = {
  id: number;
  name: string;
  email: string;
  [key: string]: any;
};

interface AuthTokens {
  access: string;
  refresh: string;
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null, tokens?: AuthTokens | null) => void
  logout: () => void
  tokens: AuthTokens | null
  setTokens: (tokens: AuthTokens | null) => void
  refreshToken: () => Promise<boolean>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error("useUser must be used within a UserProvider")
  return context
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null)
  const [tokens, setTokensState] = useState<AuthTokens | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Load user and tokens from localStorage if available
    const stored = localStorage.getItem("user")
    const storedTokens = localStorage.getItem("tokens")
    if (stored) setUserState(JSON.parse(stored))
    if (storedTokens) {
      const tokens = JSON.parse(storedTokens)
      setTokensState(tokens)
      apiClient.setTokens(tokens)
    }
  }, [])

  const setUser = (user: User | null, tokensArg?: AuthTokens | null) => {
    setUserState(user)
    if (user) localStorage.setItem("user", JSON.stringify(user))
    else localStorage.removeItem("user")
    if (tokensArg !== undefined) {
      setTokens(tokensArg)
    }
  }

  const setTokens = (tokens: AuthTokens | null) => {
    setTokensState(tokens)
    apiClient.setTokens(tokens)
    if (tokens) localStorage.setItem("tokens", JSON.stringify(tokens))
    else localStorage.removeItem("tokens")
  }

  const refreshToken = async (): Promise<boolean> => {
    if (!tokens?.refresh) return false
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: tokens.refresh,
        }),
      })
      
      if (response.ok) {
        const newTokens = await response.json()
        setTokens(newTokens)
        return true
      } else {
        // Refresh token is invalid, logout user
        logout()
        return false
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
      logout()
      return false
    }
  }

  const logout = () => {
    setUser(null, null)
    setTokens(null)
    router.push("/auth")
  }

  return (
    <UserContext.Provider value={{ user, setUser, logout, tokens, setTokens, refreshToken }}>
      {children}
    </UserContext.Provider>
  )
}