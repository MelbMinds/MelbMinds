"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, RotateCcw, Shuffle, SkipBack, SkipForward } from "lucide-react"
import { useUser } from "@/components/UserContext"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { use } from "react"

interface Flashcard {
  id: number
  question: string
  answer: string
  question_image_url?: string
  answer_image_url?: string
  created_at: string
}

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isRandomized, setIsRandomized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, tokens } = useUser()

  useEffect(() => {
    if (!user || !tokens?.access) return
    fetchFlashcards()
  }, [user, tokens, id])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case ' ':
          event.preventDefault()
          handleFlip()
          break
        case 'ArrowLeft':
          event.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          event.preventDefault()
          handleNext()
          break
        case 'Escape':
          event.preventDefault()
          window.history.back()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, flashcards.length])

  const fetchFlashcards = async () => {
    if (!tokens?.access) return
    
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:8000/api/flashcards/folders/${id}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`
        }
      })
      
      if (!res.ok) throw new Error("Failed to fetch flashcards")
      
      const data = await res.json()
      setFlashcards(data.flashcards)
    } catch (err) {
      setError("Failed to load flashcards")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleRandomize = () => {
    if (flashcards.length === 0) return
    
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setFlashcards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsRandomized(true)
    
    toast({
      title: "Shuffled!",
      description: "Flashcards have been randomized for this session.",
    })
  }

  const handleReset = () => {
    fetchFlashcards()
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsRandomized(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to practice flashcards</h1>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-blue mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    )
  }

  if (error || flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "No flashcards found"}</p>
          <Link href={`/flashcards/${id}`}>
            <Button>Back to Folder</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentCard = flashcards[currentIndex]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/flashcards/${id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Practice Mode</h1>
              <p className="text-sm text-gray-600">
                Card {currentIndex + 1} of {flashcards.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="randomize"
                checked={isRandomized}
                onCheckedChange={handleRandomize}
              />
              <Label htmlFor="randomize">Randomize</Label>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center">
          {/* Flashcard */}
          <div className="w-full max-w-2xl mb-8">
            <div 
              className={`relative w-full aspect-[3/2] cursor-pointer transition-transform duration-500 transform-style-preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              onClick={handleFlip}
            >
              {/* Front of card */}
              <div className={`absolute inset-0 w-full h-full backface-hidden ${
                isFlipped ? 'opacity-0' : 'opacity-100'
              } transition-opacity duration-500`}>
                <div className="w-full h-full bg-white rounded-lg shadow-lg border border-gray-200 p-8 flex flex-col justify-center items-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                    {currentCard.question}
                  </h2>
                  {currentCard.question_image_url && (
                    <img 
                      src={currentCard.question_image_url} 
                      alt="Question" 
                      className="max-w-full max-h-48 object-contain rounded-lg"
                    />
                  )}
                  <p className="text-sm text-gray-500 mt-4">Click to reveal answer</p>
                </div>
              </div>

              {/* Back of card */}
              <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 ${
                isFlipped ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-500`}>
                <div className="w-full h-full bg-deep-blue text-white rounded-lg shadow-lg p-8 flex flex-col justify-center items-center">
                  <h2 className="text-xl font-semibold mb-4 text-center">
                    {currentCard.answer}
                  </h2>
                  {currentCard.answer_image_url && (
                    <img 
                      src={currentCard.answer_image_url} 
                      alt="Answer" 
                      className="max-w-full max-h-48 object-contain rounded-lg"
                    />
                  )}
                  <p className="text-sm text-blue-100 mt-4">Click to see question</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <SkipBack className="w-5 h-5 mr-2" />
              Previous
            </Button>
            
            <Button
              size="lg"
              onClick={handleFlip}
              className="bg-deep-blue hover:bg-deep-blue/90 text-white px-8"
            >
              {isFlipped ? 'Show Question' : 'Show Answer'}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
            >
              Next
              <SkipForward className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Keyboard shortcuts help */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-2">Keyboard shortcuts:</p>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
              <span>Spacebar - Flip card</span>
              <span>← → - Navigate</span>
              <span>Esc - Exit</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
} 