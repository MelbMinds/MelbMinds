"use client"
import { useState, useEffect } from "react"
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
import { useIsMobile } from "@/hooks/use-mobile"
import { Menu, X } from "lucide-react"

export default function Header() {
  const { user, logout } = useUser()
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false)
    }
  }, [isMobile, mobileMenuOpen])

  // Handle keyboard navigation and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    // Prevent body from scrolling when mobile menu is open
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const navItems = isMobile ? (
    <>
      <Link href="/discover" onClick={() => setMobileMenuOpen(false)} className="w-full">
        <Button variant="ghost" className="text-deep-blue hover:bg-soft-gray px-4 w-full justify-start h-14 text-lg font-medium">
          Discover Groups
        </Button>
      </Link>
      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full">
        <Button variant="ghost" className="text-deep-blue hover:bg-soft-gray px-4 w-full justify-start h-14 text-lg font-medium">
          Dashboard
        </Button>
      </Link>
      <Link href="/create-group" onClick={() => setMobileMenuOpen(false)} className="w-full">
        <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif px-4 w-full h-14 text-lg font-medium">
          Create Group
        </Button>
      </Link>
    </>
  ) : (
    <>
      <Link href="/discover">
        <Button variant="ghost" className="text-deep-blue hover:bg-soft-gray px-4">
          Discover Groups
        </Button>
      </Link>
      <Link href="/dashboard">
        <Button variant="ghost" className="text-deep-blue hover:bg-soft-gray px-4">
          Dashboard
        </Button>
      </Link>
      <Link href="/create-group">
        <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif px-4">
          Create Group
        </Button>
      </Link>
    </>
  )

  const userMenu = user ? (
    isMobile ? (
      <div className="space-y-3">
        <div className="flex items-center space-x-3 px-2 py-2">
          <Avatar className="h-12 w-12 bg-[#f3f6fa] text-[#003366]">
            <AvatarFallback className="font-serif font-bold text-xl">{user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-lg">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="w-full">
          <Button variant="ghost" className="text-deep-blue hover:bg-soft-gray px-4 w-full justify-start h-14 text-lg font-medium">
            Profile
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 w-full justify-start h-14 text-lg font-medium"
          onClick={() => {
            setMobileMenuOpen(false)
            logout()
          }}
        >
          Logout
        </Button>
      </div>
    ) : (
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
    )
  ) : (
    <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className={isMobile ? "w-full" : ""}>
      <Button 
        className={`bg-deep-blue hover:bg-deep-blue/90 text-white font-serif px-4 ${
          isMobile ? "w-full h-14 text-lg font-medium" : ""
        }`}
      >
        Sign In
      </Button>
    </Link>
  )

  return (
    <nav className="border-b border-gray-200 bg-white w-full z-50 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-serif font-bold text-deep-blue">MelbMinds</h1>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8">
            {navItems}
            {userMenu}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              className="p-2" 
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black z-40 md:hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'opacity-50 backdrop-blur-sm' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <div 
        id="mobile-menu"
        className={`fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } shadow-xl flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-serif font-bold text-deep-blue">Menu</h2>
          <Button 
            variant="ghost" 
            className="p-1 h-10 w-10 rounded-full flex items-center justify-center" 
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </Button>
        </div>
        
        <div className="flex flex-col p-4 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            {navItems}
          </div>
          <div className="pt-4 mt-2 border-t">
            {userMenu}
          </div>
        </div>
      </div>
    </nav>
  )
}