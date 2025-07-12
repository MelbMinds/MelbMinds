import type React from "react"
import type { Metadata } from "next"
import { Inter, DM_Serif_Display } from "next/font/google"
import "./globals.css"
import { UserProvider } from "@/components/UserContext"
import Header from "@/components/Header"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const dmSerifDisplay = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
})

export const metadata: Metadata = {
  title: "MelbMinds - University of Melbourne Study Groups",
  description:
    "Connect with University of Melbourne students through collaborative study groups. Built for UniMelb, by UniMelb students.",
  keywords: "University of Melbourne, study groups, collaborative learning, student community",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmSerifDisplay.variable} font-sans`}>
        <UserProvider>
          <Header />
          {children}
          <Toaster />
        </UserProvider>
      </body>
    </html>
  )
}
