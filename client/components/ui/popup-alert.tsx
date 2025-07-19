"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface PopupAlertProps {
  message: string | null
  onClose: () => void
}

export function PopupAlert({ message, onClose }: PopupAlertProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [message])

  if (!isVisible || !message) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 text-center">
          <div className="mb-6">
            <Alert variant="destructive" className="border-0 p-0">
              <AlertDescription className="text-base font-medium">
                CANT be using bad words, twin!
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex justify-center">
            <Button onClick={onClose} className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">
              Got it
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 