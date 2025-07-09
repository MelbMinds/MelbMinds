"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

export type User = {
  [key: string]: any;
  name: string;
  email: string;
};

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error("useUser must be used within a UserProvider")
  return context
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Load user from localStorage if available
    const stored = localStorage.getItem("user")
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const setAndStoreUser = (user: User | null) => {
    setUser(user)
    if (user) localStorage.setItem("user", JSON.stringify(user))
    else localStorage.removeItem("user")
  }

  const logout = () => {
    setAndStoreUser(null)
    router.push("/auth")
  }

  return (
    <UserContext.Provider value={{ user, setUser: setAndStoreUser, logout }}>
      {children}
    </UserContext.Provider>
  )
} 