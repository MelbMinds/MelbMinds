"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser } from "@/components/UserContext"

export default function Header() {
  const { user, logout } = useUser()
  return (
    <nav className="border-b border-gray-200 bg-white w-full">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-serif font-bold text-deep-blue">MelbMinds</h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8">
            <Link href="/discover">
              <Button variant="ghost" className="text-deep-blue hover:bg-soft-gray px-4">Discover Groups</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-deep-blue hover:bg-soft-gray px-4">Dashboard</Button>
            </Link>
            <Link href="/create-group">
              <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif px-4">Create Group</Button>
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-10 w-10 rounded-full ml-2">
                    <Avatar className="h-10 w-10 bg-[#f3f6fa] text-[#003366]">
                      <AvatarFallback className="font-serif font-bold text-lg">{user.name[0]}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                  <div className="text-xs text-gray-500 px-2 pb-2">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-500">Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif px-4">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 