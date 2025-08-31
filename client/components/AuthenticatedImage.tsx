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
      
      // Convert HTTP URLs to HTTPS for production, but preserve HTTP for localhost
      const secureUrl = src.startsWith('http://localhost') ? src : src.replace(/^http:\/\//i, 'https://')
      console.log('AuthenticatedImage loading:', secureUrl)

      try {
        const response = await apiRequest(secureUrl, {}, tokens, refreshToken)
        
        console.log('Image response status:', response.status)
        
        if (!response.ok) {
          // Try to get error details
          try {
            const errorText = await response.text()
            console.error('Image loading error response:', errorText)
          } catch (e) {
            console.error('Could not read error response')
          }
          
          throw new Error(`Failed to load image: ${response.status} ${response.statusText}`)
        }

        const blob = await response.blob()
        console.log('Image loaded, size:', blob.size)
        
        const dataUrl = URL.createObjectURL(blob)
        setImageSrc(dataUrl)
      } catch (err) {
        console.error('Error loading image:', err)
        setError(true)
      }
    }

    loadImage()
    
    // Clean up object URL on unmount or when src changes
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc)
      }
    }
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