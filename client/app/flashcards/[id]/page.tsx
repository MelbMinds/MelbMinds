"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowLeft, Plus, Edit, Trash2, Play, Upload, X } from "lucide-react"
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

interface FlashcardFolder {
  id: number
  name: string
  creator_name: string
  flashcard_count: number
  created_at: string
}

export default function FlashcardFolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [folder, setFolder] = useState<FlashcardFolder | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null)
  const [newFlashcard, setNewFlashcard] = useState({
    question: "",
    answer: "",
    questionImage: null as File | null,
    answerImage: null as File | null
  })
  const [editFlashcard, setEditFlashcard] = useState({
    question: "",
    answer: "",
    questionImage: null as File | null,
    answerImage: null as File | null
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user, tokens } = useUser()

  useEffect(() => {
    if (!user || !tokens?.access) return
    fetchFolderData()
  }, [user, tokens, id])

  const fetchFolderData = async () => {
    if (!tokens?.access) return
    
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:8000/api/flashcards/folders/${id}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`
        }
      })
      
      if (!res.ok) throw new Error("Failed to fetch folder")
      
      const data = await res.json()
      setFolder(data.folder)
      setFlashcards(data.flashcards)
    } catch (err) {
      setError("Failed to load flashcard folder")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFlashcard = async () => {
    if (!newFlashcard.question.trim() || !newFlashcard.answer.trim()) return
    
    setIsCreating(true)
    try {
      const formData = new FormData()
      formData.append('folder', id)
      formData.append('question', newFlashcard.question.trim())
      formData.append('answer', newFlashcard.answer.trim())
      
      if (newFlashcard.questionImage) {
        formData.append('question_image', newFlashcard.questionImage)
      }
      if (newFlashcard.answerImage) {
        formData.append('answer_image', newFlashcard.answerImage)
      }
      
      const res = await fetch("http://localhost:8000/api/flashcards/", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`
        },
        body: formData
      })
      
      if (!res.ok) throw new Error("Failed to create flashcard")
      
      const createdFlashcard = await res.json()
      setFlashcards(prev => [...prev, createdFlashcard])
      setNewFlashcard({
        question: "",
        answer: "",
        questionImage: null,
        answerImage: null
      })
      setShowCreateDialog(false)
      
      toast({
        title: "Success!",
        description: "Flashcard created successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create flashcard. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditFlashcard = async () => {
    if (!editingFlashcard || !editFlashcard.question.trim() || !editFlashcard.answer.trim()) return
    
    setIsEditing(true)
    try {
      const formData = new FormData()
      formData.append('question', editFlashcard.question.trim())
      formData.append('answer', editFlashcard.answer.trim())
      
      if (editFlashcard.questionImage) {
        formData.append('question_image', editFlashcard.questionImage)
      }
      if (editFlashcard.answerImage) {
        formData.append('answer_image', editFlashcard.answerImage)
      }
      
      const res = await fetch(`http://localhost:8000/api/flashcards/${editingFlashcard.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`
        },
        body: formData
      })
      
      if (!res.ok) throw new Error("Failed to update flashcard")
      
      const updatedFlashcard = await res.json()
      setFlashcards(prev => prev.map(card => 
        card.id === editingFlashcard.id ? updatedFlashcard : card
      ))
      setEditingFlashcard(null)
      setEditFlashcard({
        question: "",
        answer: "",
        questionImage: null,
        answerImage: null
      })
      
      toast({
        title: "Success!",
        description: "Flashcard updated successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update flashcard. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteFlashcard = async (flashcardId: number) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`http://localhost:8000/api/flashcards/${flashcardId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`
        }
      })
      
      if (!res.ok) throw new Error("Failed to delete flashcard")
      
      setFlashcards(prev => prev.filter(card => card.id !== flashcardId))
      
      toast({
        title: "Success!",
        description: "Flashcard deleted successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete flashcard. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const startEdit = (flashcard: Flashcard) => {
    setEditingFlashcard(flashcard)
    setEditFlashcard({
      question: flashcard.question,
      answer: flashcard.answer,
      questionImage: null,
      answerImage: null
    })
  }

  const handleImageUpload = (file: File | null, side: 'question' | 'answer', isEdit: boolean = false) => {
    if (isEdit) {
      setEditFlashcard(prev => ({
        ...prev,
        [side === 'question' ? 'questionImage' : 'answerImage']: file
      }))
    } else {
      setNewFlashcard(prev => ({
        ...prev,
        [side === 'question' ? 'questionImage' : 'answerImage']: file
      }))
    }
  }

  const removeImage = (side: 'question' | 'answer', isEdit: boolean = false) => {
    if (isEdit) {
      setEditFlashcard(prev => ({
        ...prev,
        [side === 'question' ? 'questionImage' : 'answerImage']: null
      }))
    } else {
      setNewFlashcard(prev => ({
        ...prev,
        [side === 'question' ? 'questionImage' : 'answerImage']: null
      }))
    }
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access flashcards</h1>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-blue mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading folder...</p>
        </div>
      </div>
    )
  }

  if (error || !folder) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || "Folder not found"}</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{folder.name}</h1>
          <p className="text-gray-600">{flashcards.length} flashcards</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/flashcards/${id}/practice`}>
            <Button disabled={flashcards.length === 0} className="bg-green-600 hover:bg-green-700 text-white">
              <Play className="w-4 h-4 mr-2" />
              Practice
            </Button>
          </Link>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Flashcard
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Flashcard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={newFlashcard.question}
                    onChange={(e) => setNewFlashcard(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter your question..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="question-image">Question Image (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="question-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'question')}
                    />
                    {newFlashcard.questionImage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage('question')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="answer">Answer</Label>
                  <Textarea
                    id="answer"
                    value={newFlashcard.answer}
                    onChange={(e) => setNewFlashcard(prev => ({ ...prev, answer: e.target.value }))}
                    placeholder="Enter your answer..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="answer-image">Answer Image (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="answer-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'answer')}
                    />
                    {newFlashcard.answerImage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage('answer')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateFlashcard}
                    disabled={!newFlashcard.question.trim() || !newFlashcard.answer.trim() || isCreating}
                    className="bg-deep-blue hover:bg-deep-blue/90"
                  >
                    {isCreating ? "Creating..." : "Create Flashcard"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {flashcards.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No flashcards yet</h3>
          <p className="text-gray-600 mb-4">Create your first flashcard to get started</p>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-deep-blue hover:bg-deep-blue/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Flashcard
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcards.map((flashcard) => (
            <Card key={flashcard.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Question:</h3>
                  <p className="text-gray-700 mb-2">{flashcard.question}</p>
                  {flashcard.question_image_url && (
                    <img 
                      src={flashcard.question_image_url} 
                      alt="Question" 
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Answer:</h3>
                  <p className="text-gray-700 mb-2">{flashcard.answer}</p>
                  {flashcard.answer_image_url && (
                    <img 
                      src={flashcard.answer_image_url} 
                      alt="Answer" 
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                </div>
                <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(flashcard)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Flashcard</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this flashcard? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteFlashcard(flashcard.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Flashcard Dialog */}
      <Dialog open={!!editingFlashcard} onOpenChange={() => setEditingFlashcard(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-question">Question</Label>
              <Textarea
                id="edit-question"
                value={editFlashcard.question}
                onChange={(e) => setEditFlashcard(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter your question..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-question-image">Question Image (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-question-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'question', true)}
                />
                {editFlashcard.questionImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeImage('question', true)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-answer">Answer</Label>
              <Textarea
                id="edit-answer"
                value={editFlashcard.answer}
                onChange={(e) => setEditFlashcard(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Enter your answer..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-answer-image">Answer Image (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-answer-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'answer', true)}
                />
                {editFlashcard.answerImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeImage('answer', true)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingFlashcard(null)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditFlashcard}
                disabled={!editFlashcard.question.trim() || !editFlashcard.answer.trim() || isEditing}
                className="bg-deep-blue hover:bg-deep-blue/90"
              >
                {isEditing ? "Updating..." : "Update Flashcard"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 