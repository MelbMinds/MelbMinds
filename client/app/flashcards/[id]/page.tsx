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
import { toastSuccess, toastFail } from "@/components/ui/use-toast"
import Link from "next/link"
import { use } from "react"
import { apiRequest } from "@/lib/api"
import AuthenticatedImage from "@/components/AuthenticatedImage"

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
  group: number
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
    answerImage: null as File | null,
    removeQuestionImage: false,
    removeAnswerImage: false
  })
  const [fileInputKey, setFileInputKey] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user, tokens, refreshToken } = useUser()

  useEffect(() => {
    // Only try API if we have authentication
    if (!user || !tokens?.access) {
      setError("Please log in to view flashcards");
      setLoading(false);
      return;
    }
    
    fetchFolderData()
  }, [user, tokens, id])

  const fetchFolderData = async () => {
    if (!tokens?.access) return
    
    setLoading(true)
    setError(null)
    
    try {
      console.log(`Fetching flashcard folder with ID: ${id}`);
      const res = await apiRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/flashcards/folders/${id}/`, {}, tokens, refreshToken)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Received folder data:', data);
        setFolder(data.folder)
        setFlashcards(data.flashcards)
        setError(null)
      } else {
        const errorText = await res.text();
        console.error('API error:', res.status, errorText);
        throw new Error("Failed to fetch folder")
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError("Failed to load flashcard folder")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFlashcard = async () => {
    // Allow creation if either text or image is present for question and answer
    const hasQuestionContent = newFlashcard.question.trim() || newFlashcard.questionImage;
    const hasAnswerContent = newFlashcard.answer.trim() || newFlashcard.answerImage;
    if (!hasQuestionContent || !hasAnswerContent) return;
    
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
      
      const res = await apiRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/flashcards/`, {
        method: 'POST',
        body: formData
      }, tokens, refreshToken)
      
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
      
      toastSuccess({
        title: "Success!",
        description: "Flashcard created successfully.",
      })
    } catch (err) {
      toastFail({
        title: "Error",
        description: "Failed to create flashcard. Please try again.",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditFlashcard = async () => {
    // Check if there's content for question (text or image)
    const hasQuestionContent = editFlashcard.question.trim() || 
      editFlashcard.questionImage || 
      (editingFlashcard?.question_image_url && !editFlashcard.removeQuestionImage)
    
    // Check if there's content for answer (text or image)
    const hasAnswerContent = editFlashcard.answer.trim() || 
      editFlashcard.answerImage || 
      (editingFlashcard?.answer_image_url && !editFlashcard.removeAnswerImage)
    
    if (!editingFlashcard || !hasQuestionContent || !hasAnswerContent) return
    
    console.log('handleEditFlashcard called with state:', editFlashcard)
    
    setIsEditing(true)
    try {
      const formData = new FormData()
      formData.append('question', editFlashcard.question.trim() || '')
      formData.append('answer', editFlashcard.answer.trim() || '')
      
      if (editFlashcard.questionImage) {
        console.log('Adding question image to FormData:', editFlashcard.questionImage.name)
        formData.append('question_image', editFlashcard.questionImage)
      } else if (editFlashcard.removeQuestionImage) {
        console.log('Removing question image')
        formData.append('question_image', '') // Empty string to remove image
      }
      
      if (editFlashcard.answerImage) {
        console.log('Adding answer image to FormData:', editFlashcard.answerImage.name)
        formData.append('answer_image', editFlashcard.answerImage)
      } else if (editFlashcard.removeAnswerImage) {
        console.log('Removing answer image')
        formData.append('answer_image', '') // Empty string to remove image
      }
      
      const res = await apiRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/flashcards/${editingFlashcard.id}/`, {
        method: 'PUT',
        body: formData
      }, tokens, refreshToken)
      
      if (!res.ok) {
        const errorData = await res.text()
        console.error('Backend error response:', errorData)
        throw new Error(`Failed to update flashcard: ${res.status} ${res.statusText}`)
      }
      
      const updatedFlashcard = await res.json()
      console.log('Backend returned updated flashcard:', updatedFlashcard)
      
      // Force refresh by adding timestamp to image URLs to bust cache
      const cacheBustedFlashcard = {
        ...updatedFlashcard,
        question_image_url: updatedFlashcard.question_image_url ? 
          `${updatedFlashcard.question_image_url}?t=${Date.now()}&v=${Math.random()}` : undefined,
        answer_image_url: updatedFlashcard.answer_image_url ? 
          `${updatedFlashcard.answer_image_url}?t=${Date.now()}&v=${Math.random()}` : undefined
      }
      
      setFlashcards(prev => prev.map(card => 
        card.id === editingFlashcard.id ? cacheBustedFlashcard : card
      ))
      setEditingFlashcard(null)
      setEditFlashcard({
        question: "",
        answer: "",
        questionImage: null,
        answerImage: null,
        removeQuestionImage: false,
        removeAnswerImage: false
      })
      
      toastSuccess({
        title: "Success!",
        description: "Flashcard updated successfully.",
      })
    } catch (err) {
      toastFail({
        title: "Error",
        description: "Failed to update flashcard. Please try again.",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteFlashcard = async (flashcardId: number) => {
    setIsDeleting(true)
    try {
      const res = await apiRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/flashcards/${flashcardId}/`, {
        method: 'DELETE'
      }, tokens, refreshToken)
      
      if (!res.ok) throw new Error("Failed to delete flashcard")
      
      setFlashcards(prev => prev.filter(card => card.id !== flashcardId))
      
      toastSuccess({
        title: "Success!",
        description: "Flashcard deleted successfully.",
      })
    } catch (err) {
      toastFail({
        title: "Error",
        description: "Failed to delete flashcard. Please try again.",
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
      answerImage: null,
      removeQuestionImage: false,
      removeAnswerImage: false
    })
    // Reset file input key to ensure clean state
    setFileInputKey(prev => prev + 1)
  }

  const handleImageUpload = (file: File | null, side: 'question' | 'answer', isEdit: boolean = false) => {
    console.log(`handleImageUpload called:`, { file: file?.name, side, isEdit })
    
    if (!file) {
      // Handle file removal
      if (isEdit) {
        setEditFlashcard(prev => {
          const newState = {
            ...prev,
            [side === 'question' ? 'questionImage' : 'answerImage']: null,
            [side === 'question' ? 'removeQuestionImage' : 'removeAnswerImage']: false
          }
          console.log(`Updated editFlashcard state:`, newState)
          return newState
        })
      } else {
        setNewFlashcard(prev => ({
          ...prev,
          [side === 'question' ? 'questionImage' : 'answerImage']: null
        }))
      }
      return
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const fileExtension = file.name.toLowerCase().split('.').pop()
    
    if (fileExtension === 'heic' || fileExtension === 'heif') {
      toastFail({
        title: "Unsupported Image Format",
        description: "HEIC/HEIF images are not supported. Please convert to JPEG or PNG format.",
      })
      return
    }
    
    if (!validTypes.includes(file.type) && !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
      toastFail({
        title: "Invalid Image Format",
        description: "Please select a valid image file (JPEG, PNG, GIF, or WebP).",
      })
      return
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toastFail({
        title: "File Too Large",
        description: "Image must be smaller than 5MB. Please compress the image and try again.",
      })
      return
    }
    
    if (isEdit) {
      setEditFlashcard(prev => {
        const newState = {
          ...prev,
          [side === 'question' ? 'questionImage' : 'answerImage']: file,
          [side === 'question' ? 'removeQuestionImage' : 'removeAnswerImage']: false
        }
        console.log(`Updated editFlashcard state:`, newState)
        return newState
      })
      // Reset file input key to force re-render
      setFileInputKey(prev => prev + 1)
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
        [side === 'question' ? 'questionImage' : 'answerImage']: null,
        [side === 'question' ? 'removeQuestionImage' : 'removeAnswerImage']: true
      }))
    } else {
      setNewFlashcard(prev => ({
        ...prev,
        [side === 'question' ? 'questionImage' : 'answerImage']: null
      }))
    }
  }

  // Check if there are any changes in the edit form
  const hasChanges = () => {
    if (!editingFlashcard) return false
    
    // Check text changes
    const questionChanged = editFlashcard.question !== editingFlashcard.question
    const answerChanged = editFlashcard.answer !== editingFlashcard.answer
    
    // Check image changes
    const questionImageChanged = editFlashcard.questionImage !== null || editFlashcard.removeQuestionImage
    const answerImageChanged = editFlashcard.answerImage !== null || editFlashcard.removeAnswerImage
    
    return questionChanged || answerChanged || questionImageChanged || answerImageChanged
  }

  // Get the current image display for edit mode
  const getCurrentImageDisplay = (side: 'question' | 'answer') => {
    // If there's a new image selected, show that (highest priority)
    if (editFlashcard[side === 'question' ? 'questionImage' : 'answerImage']) {
      return {
        type: 'new' as const,
        file: editFlashcard[side === 'question' ? 'questionImage' : 'answerImage']
      }
    }
    
    // If image is marked for removal, show nothing
    if (editFlashcard[side === 'question' ? 'removeQuestionImage' : 'removeAnswerImage']) {
      return null
    }
    
    // If there's an existing image and it's not marked for removal, show it
    if (editingFlashcard?.[side === 'question' ? 'question_image_url' : 'answer_image_url']) {
      return {
        type: 'existing' as const,
        url: editingFlashcard[side === 'question' ? 'question_image_url' : 'answer_image_url']
      }
    }
    
    return null
  }

  // Create object URL for new image preview
  const getImagePreviewUrl = (file: File | null) => {
    if (!file) return null
    return URL.createObjectURL(file)
  }

  // Cleanup object URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      // Cleanup any object URLs when component unmounts
      if (editFlashcard.questionImage) {
        URL.revokeObjectURL(URL.createObjectURL(editFlashcard.questionImage))
      }
      if (editFlashcard.answerImage) {
        URL.revokeObjectURL(URL.createObjectURL(editFlashcard.answerImage))
      }
    }
  }, [editFlashcard.questionImage, editFlashcard.answerImage])

  useEffect(() => {
    const handlePaste = async (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isTextInput = active && (
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        (active as HTMLElement).isContentEditable
      );
      if (isTextInput) return; // Let default paste happen
      if ((showCreateDialog || editingFlashcard) && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        // For create dialog
        if (showCreateDialog) {
          if (!newFlashcard.questionImage) {
            await handlePasteImage('question');
          } else if (!newFlashcard.answerImage) {
            await handlePasteImage('answer');
          }
        }
        // For edit dialog
        if (editingFlashcard) {
          if (!editFlashcard.questionImage && !editFlashcard.removeQuestionImage) {
            await handlePasteImage('question', true);
          } else if (!editFlashcard.answerImage && !editFlashcard.removeAnswerImage) {
            await handlePasteImage('answer', true);
          }
        }
      }
    };
    window.addEventListener('keydown', handlePaste);
    return () => window.removeEventListener('keydown', handlePaste);
  }, [showCreateDialog, editingFlashcard, newFlashcard, editFlashcard]);

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

  const handlePasteImage = async (field: 'question' | 'answer', isEdit = false) => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], `${field}-image.png`, { type });
            if (isEdit) {
              if (field === 'question') setEditFlashcard(prev => ({ ...prev, questionImage: file, removeQuestionImage: false }));
              if (field === 'answer') setEditFlashcard(prev => ({ ...prev, answerImage: file, removeAnswerImage: false }));
            } else {
              if (field === 'question') setNewFlashcard(prev => ({ ...prev, questionImage: file }));
              if (field === 'answer') setNewFlashcard(prev => ({ ...prev, answerImage: file }));
            }
            return;
          }
        }
      }
      toastFail({ title: 'No image found in clipboard', description: 'Please copy an image to your clipboard first.' });
    } catch (e) {
      toastFail({ title: 'Clipboard error', description: 'Could not access clipboard or no image found.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/group/${folder.group}`}>
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
                  <div className="space-y-2">
                    {/* Current image display */}
                    {(() => {
                      if (newFlashcard.questionImage && newFlashcard.questionImage instanceof File) {
                        return (
                          <div className="border rounded-lg p-2 bg-gray-50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-700">New Image:</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeImage('question')}
                                className="h-6 px-2"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600 truncate">{newFlashcard.questionImage.name}</div>
                              <img
                                src={URL.createObjectURL(newFlashcard.questionImage)}
                                alt="Preview"
                                className="w-full h-20 object-contain rounded bg-white"
                                onLoad={e => {
                                  const target = e.target as HTMLImageElement;
                                  if (target.src.startsWith('blob:')) {
                                    setTimeout(() => URL.revokeObjectURL(target.src), 1000);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-2">
                          <Input
                            id="question-image"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={e => handleImageUpload(e.target.files?.[0] || null, 'question')}
                          />
                          { !newFlashcard.questionImage && (
                            <Button type="button" variant="outline" onClick={() => handlePasteImage('question')}>Paste Image</Button>
                          ) }
                        </div>
                      );
                    })()}
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
                  <div className="space-y-2">
                    {/* Current image display */}
                    {(() => {
                      if (newFlashcard.answerImage && newFlashcard.answerImage instanceof File) {
                        return (
                          <div className="border rounded-lg p-2 bg-gray-50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-700">New Image:</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeImage('answer')}
                                className="h-6 px-2"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600 truncate">{newFlashcard.answerImage.name}</div>
                              <img
                                src={URL.createObjectURL(newFlashcard.answerImage)}
                                alt="Preview"
                                className="w-full h-20 object-contain rounded bg-white"
                                onLoad={e => {
                                  const target = e.target as HTMLImageElement;
                                  if (target.src.startsWith('blob:')) {
                                    setTimeout(() => URL.revokeObjectURL(target.src), 1000);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-2">
                          <Input
                            id="answer-image"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={e => handleImageUpload(e.target.files?.[0] || null, 'answer')}
                          />
                          { !newFlashcard.answerImage && (
                            <Button type="button" variant="outline" onClick={() => handlePasteImage('answer')}>Paste Image</Button>
                          ) }
                        </div>
                      );
                    })()}
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
                    disabled={(!newFlashcard.question.trim() && !newFlashcard.questionImage) || (!newFlashcard.answer.trim() && !newFlashcard.answerImage) || isCreating}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No flashcards found</h3>
          <p className="text-gray-600 mb-4">
            {folder?.name ? `The folder "${folder.name}" appears to be empty.` : 'This folder does not contain any flashcards yet.'}
          </p>
          <p className="text-sm text-gray-500">
            Flashcards should be automatically created when the folder is made. Please try creating a new folder.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcards.map((flashcard, index) => (
            <Card key={flashcard.id || `flashcard-${index}`} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Question:</h3>
                  {flashcard.question && (
                    <p className="text-gray-700 mb-2 break-words">{flashcard.question}</p>
                  )}
                  {flashcard.question_image_url && (
                    <AuthenticatedImage
                      key={`question-${flashcard.id}-${flashcard.question_image_url}`}
                      src={flashcard.question_image_url}
                      alt="Question"
                      className="w-full h-48 object-contain rounded-lg mb-2 bg-gray-50"
                      tokens={tokens}
                      refreshToken={refreshToken}
                    />
                  )}
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Answer:</h3>
                  {flashcard.answer && (
                    <p className="text-gray-700 mb-2">{flashcard.answer}</p>
                  )}
                  {flashcard.answer_image_url && (
                    <AuthenticatedImage
                      key={`answer-${flashcard.id}-${flashcard.answer_image_url}`}
                      src={flashcard.answer_image_url}
                      alt="Answer"
                      className="w-full h-48 object-contain rounded-lg mb-2 bg-gray-50"
                      tokens={tokens}
                      refreshToken={refreshToken}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-question">Question</Label>
              <Textarea
                id="edit-question"
                value={editFlashcard.question}
                onChange={(e) => setEditFlashcard(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter your question..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-question-image">Question Image (optional)</Label>
              <div className="space-y-2">
                {/* Current image display */}
                {(() => {
                  const currentImage = getCurrentImageDisplay('question')
                  if (currentImage) {
                    return (
                      <div className="border rounded-lg p-2 bg-gray-50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {currentImage.type === 'new' ? 'New Image:' : 'Current Image:'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeImage('question', true)}
                            className="h-6 px-2"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        {currentImage.type === 'new' ? (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600 truncate">
                              {currentImage.file?.name}
                            </div>
                            <img
                              src={getImagePreviewUrl(currentImage.file) || ''}
                              alt="Preview"
                              className="w-full h-20 object-contain rounded bg-white"
                              onLoad={(e) => {
                                // Clean up object URL when image loads
                                const target = e.target as HTMLImageElement
                                if (target.src.startsWith('blob:')) {
                                  setTimeout(() => URL.revokeObjectURL(target.src), 1000)
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <AuthenticatedImage
                            src={currentImage.url || ''}
                            alt="Question"
                            className="w-full h-20 object-contain rounded bg-white"
                            tokens={tokens}
                            refreshToken={refreshToken}
                          />
                        )}
                      </div>
                    )
                  }
                  return null
                })()}
                
                {/* File input - only show when no image is present */}
                {!getCurrentImageDisplay('question') && (
                  <div className="flex items-center gap-2">
                                      <Input
                    key={`question-${fileInputKey}`}
                    id="edit-question-image"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={(e) => {
                      handleImageUpload(e.target.files?.[0] || null, 'question', true)
                    }}
                  />
                    <span className="text-sm text-gray-500">No image selected</span>
                  </div>
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
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-answer-image">Answer Image (optional)</Label>
              <div className="space-y-2">
                {/* Current image display */}
                {(() => {
                  const currentImage = getCurrentImageDisplay('answer')
                  if (currentImage) {
                    return (
                      <div className="border rounded-lg p-2 bg-gray-50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {currentImage.type === 'new' ? 'New Image:' : 'Current Image:'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeImage('answer', true)}
                            className="h-6 px-2"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        {currentImage.type === 'new' ? (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600 truncate">
                              {currentImage.file?.name}
                            </div>
                            <img
                              src={getImagePreviewUrl(currentImage.file) || ''}
                              alt="Preview"
                              className="w-full h-20 object-contain rounded bg-white"
                              onLoad={(e) => {
                                // Clean up object URL when image loads
                                const target = e.target as HTMLImageElement
                                if (target.src.startsWith('blob:')) {
                                  setTimeout(() => URL.revokeObjectURL(target.src), 1000)
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <AuthenticatedImage
                            src={currentImage.url || ''}
                            alt="Answer"
                            className="w-full h-20 object-contain rounded bg-white"
                            tokens={tokens}
                            refreshToken={refreshToken}
                          />
                        )}
                      </div>
                    )
                  }
                  return null
                })()}
                
                {/* File input - only show when no image is present */}
                {!getCurrentImageDisplay('answer') && (
                  <div className="flex items-center gap-2">
                                      <Input
                    key={`answer-${fileInputKey}`}
                    id="edit-answer-image"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={(e) => {
                      handleImageUpload(e.target.files?.[0] || null, 'answer', true)
                    }}
                  />
                    <span className="text-sm text-gray-500">No image selected</span>
                  </div>
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
                disabled={(() => {
                  // Check if there's content for question (text or image)
                  const hasQuestionContent = editFlashcard.question.trim() || 
                    editFlashcard.questionImage || 
                    (editingFlashcard?.question_image_url && !editFlashcard.removeQuestionImage)
                  
                  // Check if there's content for answer (text or image)
                  const hasAnswerContent = editFlashcard.answer.trim() || 
                    editFlashcard.answerImage || 
                    (editingFlashcard?.answer_image_url && !editFlashcard.removeAnswerImage)
                  
                  return !hasQuestionContent || !hasAnswerContent || isEditing || !hasChanges()
                })()}
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