"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useUser } from "@/components/UserContext"
import Header from "@/components/Header"

export default function HomeNavbar() {
  const { user } = useUser()
  return (
    <div className="flex items-center space-x-6">
      <Link href="/discover">
        <Button variant="ghost" className="text-deep-blue hover:bg-soft-gray font-medium">
          Discover Groups
        </Button>
      </Link>
      {user ? (
        <Header />
      ) : (
        <Link href="/auth">
          <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-medium">Sign In</Button>
        </Link>
      )}
    </div>
  )
} 