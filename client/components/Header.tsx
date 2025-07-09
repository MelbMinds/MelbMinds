"use client"
import React from "react"
import { useUser } from "@/components/UserContext"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function Header() {
  const { user, logout } = useUser()
  const [open, setOpen] = React.useState(false)
  if (!user) return null
  return (
    <div className="absolute top-4 right-6 z-50">
      <div className="relative">
        <button onClick={() => setOpen((v) => !v)}>
          <Avatar>
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg border p-4">
            <div className="font-semibold mb-2">{user.name}</div>
            <div className="text-xs text-gray-500 mb-2">{user.email}</div>
            <button
              className="text-sm text-blue-600 hover:underline mb-2 w-full text-left"
              onClick={() => { window.location.href = '/profile'; setOpen(false); }}
            >
              Profile
            </button>
            <button className="text-sm text-red-500 hover:underline w-full text-left" onClick={logout}>Logout</button>
          </div>
        )}
      </div>
    </div>
  )
} 