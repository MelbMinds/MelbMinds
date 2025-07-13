"use client"

import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/api"

interface AuthenticatedImageProps {
  src: string
  alt: string
  className?: string
  tokens: { access: string; refresh: string } | null
  refreshToken: () => Promise<boolean>
}

export default function AuthenticatedImage({ src, alt, className, tokens, refreshToken }: AuthenticatedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      if (!src || !tokens) return

      try {
        const response = await apiRequest(src, {}, tokens, refreshToken)
        
        if (!response.ok) {
          throw new Error('Failed to load image')
        }

        const blob = await response.blob()
        const dataUrl = URL.createObjectURL(blob)
        setImageSrc(dataUrl)
      } catch (err) {
        console.error('Error loading image:', err)
        setError(true)
      }
    }

    loadImage()
  }, [src, tokens, refreshToken])

  if (error) {
    return null // Don't show anything if image fails to load
  }

  if (!imageSrc) {
    return (
      <div className={`${className} bg-gray-200 animate-pulse rounded-lg flex items-center justify-center`}>
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
    />
  )
} 