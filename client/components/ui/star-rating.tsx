"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  className?: string
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = "md",
  showValue = false,
  className 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [isHovering, setIsHovering] = useState(false)

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    if (readonly) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const halfWidth = rect.width / 2
    
    const newRating = x < halfWidth ? starIndex + 0.5 : starIndex + 1
    setHoverRating(newRating)
  }

  const handleStarHover = (event: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    if (readonly) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const halfWidth = rect.width / 2
    
    const newRating = x < halfWidth ? starIndex + 0.5 : starIndex + 1
    setHoverRating(newRating)
  }

  const handleMouseLeave = () => {
    if (readonly) return
    setHoverRating(null)
    setIsHovering(false)
  }

  const handleClick = (event: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    if (readonly || !onRatingChange) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const halfWidth = rect.width / 2
    
    const newRating = x < halfWidth ? starIndex + 0.5 : starIndex + 1
    onRatingChange(newRating)
  }

  const displayRating = isHovering ? hoverRating : rating

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div 
        className="flex items-center"
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsHovering(true)}
      >
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const starValue = starIndex + 1
          const isFilled = displayRating >= starValue
          const isHalfFilled = displayRating >= starIndex + 0.5 && displayRating < starValue
          
          return (
            <div
              key={starIndex}
              className="relative cursor-pointer"
              onMouseMove={(e) => handleStarHover(e, starIndex)}
              onClick={(e) => handleClick(e, starIndex)}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors duration-200",
                  isFilled 
                    ? "fill-yellow-400 text-yellow-400" 
                    : isHalfFilled 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-gray-300",
                  readonly && "cursor-default"
                )}
              />
              {isHalfFilled && (
                <div className="absolute inset-0 overflow-hidden">
                  <Star
                    className={cn(
                      sizeClasses[size],
                      "fill-yellow-400 text-yellow-400"
                    )}
                    style={{ clipPath: 'inset(0 50% 0 0)' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-600 ml-2">
          {displayRating?.toFixed(1) || "0.0"}
        </span>
      )}
    </div>
  )
} 