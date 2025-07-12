"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

export type User = {
  [key: string]: any;
  name: string;
  email: string;
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
    if (storedTokens) setTokensState(JSON.parse(storedTokens))
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
    if (tokens) localStorage.setItem("tokens", JSON.stringify(tokens))
    else localStorage.removeItem("tokens")
  }

  const logout = () => {
    setUser(null, null)
    setTokens(null)
    router.push("/auth")
  }

  return (
    <UserContext.Provider value={{ user, setUser, logout, tokens, setTokens }}>
      {children}
    </UserContext.Provider>
  )
} 