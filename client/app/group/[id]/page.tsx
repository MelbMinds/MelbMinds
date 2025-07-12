"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  MapPin,
  Video,
  Clock,
  Calendar,
  MessageCircle,
  UserPlus,
  Share2,
  Flag,
  Star,
  Upload,
  FileText,
  Brain,
  CalendarPlus,
  Send,
  Plus,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Bell,
  Download,
  Heart,
} from "lucide-react"
import Link from "next/link"
import { useUser } from "@/components/UserContext"
import { use } from "react"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export default function StudyGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAlert, setShowAlert] = useState(false)
  const { user, tokens } = useUser()
  const [joined, setJoined] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])

  // Add state for sessions
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionForm, setSessionForm] = useState({ date: '', time: '', location: '', description: '' })
  const [editingSession, setEditingSession] = useState<any>(null)
  const [sessionLoading, setSessionLoading] = useState(false)

  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newFileName, setNewFileName] = useState("")
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`http://localhost:8000/api/groups/${id}/`, {
          headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
        })
        if (!res.ok) throw new Error("Failed to fetch group")
        const data = await res.json()
        setGroup(data)
        setJoined(!!data.joined)
      } catch (err) {
        setError("Could not load group.")
      } finally {
        setLoading(false)
      }
    }
    fetchGroup()
  }, [id, tokens])

  // Fetch members
  useEffect(() => {
    if (group?.id) {
      fetch(`http://localhost:8000/api/groups/${group.id}/members/`)
        .then(res => res.json())
        .then(setMembers)
    }
  }, [group?.id])
  // Fetch chat messages if joined or is creator
  useEffect(() => {
    if (group?.id && (joined || isGroupCreator())) {
      fetch(`http://localhost:8000/api/groups/${group.id}/chat/`, {
        headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
      })
        .then(res => res.json())
        .then(setMessages)
    }
  }, [group?.id, joined, tokens])

  // Fetch sessions
  useEffect(() => {
    if (group?.id && (joined || isGroupCreator())) {
      const fetchSessions = () => {
        fetch(`http://localhost:8000/api/groups/${group.id}/sessions/`, {
          headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
        })
          .then(res => res.json())
          .then(setSessions)
      }
      
      fetchSessions()
      
      // Refresh sessions every 30 seconds to catch auto-deleted sessions
      const interval = setInterval(fetchSessions, 30000)
      
      return () => clearInterval(interval)
    }
  }, [group?.id, joined, tokens])

  useEffect(() => {
    if (group?.id && (joined || isGroupCreator())) {
      const fetchNotifications = () => {
        setLoadingNotifications(true)
        fetch(`http://localhost:8000/api/groups/${group.id}/notifications/`, {
          headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
        })
          .then(res => res.json())
          .then(setNotifications)
          .finally(() => setLoadingNotifications(false))
      }
      
      fetchNotifications()
      
      // Refresh notifications every 30 seconds to catch new notifications
      const interval = setInterval(fetchNotifications, 30000)
      
      return () => clearInterval(interval)
    }
  }, [group?.id, joined, tokens])

  // Fetch files
  useEffect(() => {
    if (group?.id && (joined || isGroupCreator())) {
      const fetchFiles = () => {
        setLoadingFiles(true)
        fetch(`http://localhost:8000/api/groups/${group.id}/files/`, {
          headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
        })
          .then(res => res.json())
          .then(setFiles)
          .finally(() => setLoadingFiles(false))
      }
      
      fetchFiles()
    }
  }, [group?.id, joined, tokens])

  const [message, setMessage] = useState("")
  const [hasRequested, setHasRequested] = useState(false)
  const [newFlashcard, setNewFlashcard] = useState({ front: "", back: "" })
  const [chatMessage, setChatMessage] = useState("")

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "Virtual":
        return <Video className="h-4 w-4" />
      case "In-person":
        return <MapPin className="h-4 w-4" />
      case "Hybrid":
        return <Users className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getFormatColor = (format: string) => {
    switch (format) {
      case "Virtual":
        return "bg-sky-blue/10 text-sky-blue border-sky-blue/20"
      case "In-person":
        return "bg-green-100 text-green-700 border-green-200"
      case "Hybrid":
        return "bg-gold/10 text-amber-700 border-gold/20"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleJoinRequest = async () => {
    if (user && group && user.email === group.creator_email) {
      setShowAlert(true)
      return
    }
    
    try {
      const res = await fetch(`http://localhost:8000/api/groups/${id}/join/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
        },
      })
      
      if (res.ok) {
        setHasRequested(true)
        setJoined(true)
        toast({
          title: 'Congratulations!',
          description: 'You have successfully joined the group.',
        })
        // Optionally refresh the group data to show updated member count
        window.setTimeout(() => window.location.reload(), 1200)
      } else {
        const data = await res.json()
        setError(data?.detail || 'Failed to join group')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  const isGroupCreator = () => {
    return user && group && user.email === group.creator_email
  }

  // Update handleSendMessage to POST to the chat API
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return
    if (!group?.id) return
    const res = await fetch(`http://localhost:8000/api/groups/${group.id}/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
      },
      body: JSON.stringify({ text: chatMessage })
    })
    if (res.ok) {
      setChatMessage("")
      // Refresh messages
      const data = await fetch(`http://localhost:8000/api/groups/${group.id}/chat/`, {
        headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
      }).then(r => r.json())
      setMessages(data)
    }
  }

  const handleCreateFlashcard = () => {
    if (newFlashcard.front.trim() && newFlashcard.back.trim()) {
      // Add flashcard
      setNewFlashcard({ front: "", back: "" })
    }
  }

  // Session CRUD handlers
  const handleSessionFormChange = (e: any) => {
    setSessionForm({ ...sessionForm, [e.target.name]: e.target.value })
  }
  const handleCreateSession = async (e: any) => {
    e.preventDefault()
    setSessionLoading(true)
    let { date, time, location, description } = sessionForm
    // Ensure time is in HH:MM:SS format
    if (time && time.length === 5) time = time + ':00'
    const payload = { date, time, location, description }
    console.log('Session creation payload:', payload)
    const res = await fetch(`http://localhost:8000/api/groups/${group.id}/sessions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
      },
      body: JSON.stringify(payload)
    })
    setSessionLoading(false)
    if (res.ok) {
      setSessionForm({ date: '', time: '', location: '', description: '' })
      fetch(`http://localhost:8000/api/groups/${group.id}/sessions/`, {
        headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
      })
        .then(res => res.json())
        .then(setSessions)
      toast({ title: 'Session created!' })
    } else {
      const err = await res.json()
      console.error('Session creation error:', err)
      toast({ title: 'Error creating session', variant: 'destructive' })
    }
  }
  const handleEditSession = (session: any) => {
    setEditingSession(session)
    setSessionForm({
      date: session.date,
      time: session.time,
      location: session.location,
      description: session.description || ''
    })
  }
  const handleUpdateSession = async (e: any) => {
    e.preventDefault()
    setSessionLoading(true)
    const res = await fetch(`http://localhost:8000/api/sessions/${editingSession.id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
      },
      body: JSON.stringify(sessionForm)
    })
    setSessionLoading(false)
    if (res.ok) {
      setEditingSession(null)
      setSessionForm({ date: '', time: '', location: '', description: '' })
      fetch(`http://localhost:8000/api/groups/${group.id}/sessions/`, {
        headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
      })
        .then(res => res.json())
        .then(setSessions)
      toast({ title: 'Session updated!' })
    } else {
      toast({ title: 'Error updating session', variant: 'destructive' })
    }
  }
  const handleDeleteSession = async (sessionId: number) => {
    if (!window.confirm('Delete this session?')) return
    setSessionLoading(true)
    const res = await fetch(`http://localhost:8000/api/sessions/${sessionId}/`, {
      method: 'DELETE',
      headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
    })
    setSessionLoading(false)
    if (res.ok) {
      setSessions(sessions.filter(s => s.id !== sessionId))
      toast({ title: 'Session deleted!' })
    } else {
      toast({ title: 'Error deleting session', variant: 'destructive' })
    }
  }

  const handleClearNotifications = async () => {
    if (!window.confirm('Clear all notifications?')) return
    setLoadingNotifications(true)
    const res = await fetch(`http://localhost:8000/api/groups/${group.id}/notifications/clear/`, {
      method: 'DELETE',
      headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
    })
    setLoadingNotifications(false)
    if (res.ok) {
      setNotifications([])
      toast({ title: 'All notifications cleared!' })
    } else {
      toast({ title: 'Error clearing notifications', variant: 'destructive' })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    // Set the initial filename without extension for editing
    const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "")
    setNewFileName(nameWithoutExtension)
    setShowRenameDialog(true)
    // Reset the input
    event.target.value = ''
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    setUploadingFile(true)
    setShowRenameDialog(false)
    
    // Get the file extension from the original file
    const fileExtension = selectedFile.name.split('.').pop()
    const finalFileName = newFileName.trim() + (fileExtension ? `.${fileExtension}` : '')
    
    // Create a new File object with the renamed filename
    const renamedFile = new File([selectedFile], finalFileName, { type: selectedFile.type })
    
    const formData = new FormData()
    formData.append('file', renamedFile)

    try {
      const res = await fetch(`http://localhost:8000/api/groups/${group.id}/files/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
        },
        body: formData,
      })

      if (res.ok) {
        const newFile = await res.json()
        setFiles(prev => [newFile, ...prev])
        toast({ title: 'File uploaded successfully!' })
      } else {
        const error = await res.json()
        toast({ title: 'Error uploading file', description: error.detail, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error uploading file', variant: 'destructive' })
    } finally {
      setUploadingFile(false)
      setSelectedFile(null)
      setNewFileName("")
    }
  }

  const handleCancelUpload = () => {
    setShowRenameDialog(false)
    setSelectedFile(null)
    setNewFileName("")
  }

  const handleFileDownload = async (file: any) => {
    try {
      const res = await fetch(`http://localhost:8000/api/files/${file.id}/download/`, {
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
        },
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.original_filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast({ title: 'Error downloading file', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error downloading file', variant: 'destructive' })
    }
  }

  const handleFileDelete = async (file: any) => {
    if (!window.confirm(`Delete "${file.original_filename}"?`)) return

    try {
      const res = await fetch(`http://localhost:8000/api/files/${file.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
        },
      })

      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== file.id))
        toast({ title: 'File deleted successfully!' })
      } else {
        toast({ title: 'Error deleting file', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error deleting file', variant: 'destructive' })
    }
  }

  const handleFileReport = async (file: any) => {
    if (!window.confirm(`Report "${file.original_filename}"? This will notify administrators.`)) return

    try {
      const res = await fetch(`http://localhost:8000/api/files/${file.id}/report/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Inappropriate content'
        })
      })

      if (res.ok) {
        toast({ title: 'File reported successfully!' })
      } else {
        toast({ title: 'Error reporting file', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error reporting file', variant: 'destructive' })
    }
  }

  const handleToggleFavorite = (fileId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(fileId)) {
        newFavorites.delete(fileId)
      } else {
        newFavorites.add(fileId)
      }
      return newFavorites
    })
  }

  const getSortedFiles = () => {
    return [...files].sort((a, b) => {
      const aFavorited = favorites.has(a.id)
      const bFavorited = favorites.has(b.id)
      
      if (aFavorited && !bFavorited) return -1
      if (!aFavorited && bFavorited) return 1
      return 0
    })
  }

  const truncateFilename = (filename: string, maxLength: number = 20) => {
    if (filename.length <= maxLength) return filename
    
    const extension = filename.split('.').pop()
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "")
    const maxNameLength = maxLength - (extension ? extension.length + 1 : 0) - 3 // -3 for "..."
    
    if (nameWithoutExt.length <= maxNameLength) return filename
    
    return `${nameWithoutExt.substring(0, maxNameLength)}...${extension ? `.${extension}` : ''}`
  }

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'ppt':
      case 'pptx':
        return '📈'
      case 'txt':
        return '📄'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️'
      case 'mp4':
      case 'avi':
      case 'mov':
        return '🎥'
      case 'mp3':
      case 'wav':
        return '🎵'
      case 'zip':
      case 'rar':
        return '📦'
      default:
        return '📄'
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center">{error}</div>
  if (!group) return null

  return (
    <div className="min-h-screen bg-soft-gray">
      {showAlert && (
        <div className="max-w-xl mx-auto mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded shadow">
          <strong>Notice:</strong> You can't join the group you created, you are already in it.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Group Header */}
            <Card className="shadow-lg border-0 mb-6">
              <CardHeader>
                <div className="flex flex-col gap-2 mb-4">
                  <Badge variant="outline" className="w-fit mb-2 text-deep-blue border-deep-blue">
                    {group.subject_code}
                  </Badge>
                  <CardTitle className="text-3xl font-serif text-deep-blue mb-2">{group.group_name}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      {group.member_count || 0} members
                    </div>
                    <div className="flex items-center">
                      <Star className="mr-1 h-4 w-4 text-gold fill-current" />
                      {group.rating || "New"}
                    </div>
                    <Badge className={`${getFormatColor(group.meeting_format)} flex items-center gap-1 border`}>
                      {getFormatIcon(group.meeting_format)}
                      {group.meeting_format}
                    </Badge>
                    <span>{group.year_level}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-base text-gray-700">Course Code: {group.subject_code}</span>
                    <span className="text-base text-gray-700">Course Name: {group.course_name}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-transparent">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" className="bg-transparent">
                    <Flag className="h-4 w-4 mr-1" />
                    Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6 leading-relaxed">{group.description}</p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>
                      <strong>Schedule:</strong> {group.schedule}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>
                      <strong>Location:</strong> {group.location}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div>
                    <span className="text-sm font-medium text-gray-700 mr-2">Study Focus:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(group.tags ? group.tags.split(',').map((t: string) => t.trim()) : []).map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 mr-2">Group Personality:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(group.group_personality ? group.group_personality.split(',').map((tag: string) => tag.trim()) : []).map((tag: string, index: number) => (
                        <Badge key={index} className="bg-gold/10 text-amber-700 border-gold/20">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Admin Info at the bottom */}
                <div className="flex items-center justify-between p-4 bg-soft-gray rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={group.creator_avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-deep-blue text-white font-serif">
                        {group.creator_name ? group.creator_name.split(" ").map((n: string) => n[0]).join("") : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-deep-blue">{group.creator_name}</p>
                      <p className="text-sm text-gray-600">
                        Group Admin{group.creator_major ? ` • ${group.creator_major}` : ""}{group.creator_year_level ? ` • ${group.creator_year_level}` : ""}
                      </p>
                      {group.creator_bio && <p className="text-xs text-gray-500 italic">{group.creator_bio}</p>}
                    </div>
                  </div>
                  {isGroupCreator() ? (
                    <Button className="bg-green-600 hover:bg-green-700 text-white font-serif" disabled>
                      <UserPlus className="mr-2 h-4 w-4" />
                      You created this group
                    </Button>
                  ) : joined || hasRequested ? (
                    <Button className="bg-gray-400 text-white font-serif" disabled>
                      <UserPlus className="mr-2 h-4 w-4" />
                      You already joined this group
                    </Button>
                  ) : (
                    <Button 
                      className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif"
                      onClick={handleJoinRequest}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Join Group
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Card className="shadow-lg border-0">
              <Tabs defaultValue={joined ? "chat" : "members"} className="w-full">
                <CardHeader>
                  <TabsList className={`grid w-full grid-cols-5`}>
                    <TabsTrigger value="chat" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="files" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Files
                    </TabsTrigger>
                    <TabsTrigger value="flashcards" className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Flashcards
                    </TabsTrigger>
                    <TabsTrigger value="sessions" className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Sessions
                    </TabsTrigger>
                    <TabsTrigger value="members" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Members
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent>
                  {/* Chat Tab */}
                  {(joined || isGroupCreator()) && (
                    <TabsContent value="chat" className="space-y-4">
                      <div className="h-96 overflow-y-auto space-y-4 p-4 bg-soft-gray rounded-lg">
                        {Array.isArray(messages) && messages.length > 0 ? (
                          messages.map((msg: any) => (
                            <div key={msg.id} className="flex space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-deep-blue text-white text-xs">
                                  {msg.user_name?.split(" ").map((n: string) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-deep-blue text-sm">{msg.user_name}</span>
                                  <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-gray-700 bg-white p-3 rounded-lg shadow-sm">{msg.text}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500">No messages yet.</div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Type your message..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button onClick={handleSendMessage} className="bg-deep-blue hover:bg-deep-blue/90 text-white">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                  )}

                  {/* Files Tab */}
                  {(joined || isGroupCreator()) && (
                    <TabsContent value="files" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-serif font-medium text-deep-blue">Shared Files</h3>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={uploadingFile}
                            accept="*/*"
                          />
                          <Button 
                            className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif cursor-pointer"
                            disabled={uploadingFile}
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {uploadingFile ? 'Uploading...' : 'Upload File'}
                          </Button>
                        </div>
                      </div>

                      {loadingFiles ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-gray-500">Loading files...</div>
                        </div>
                      ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                          <FileText className="h-16 w-16 mb-4 opacity-50" />
                          <p className="text-lg">No files uploaded</p>
                          <p className="text-sm">Upload files to share with your group members</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {getSortedFiles().map((file: any) => (
                            <div 
                              key={file.id} 
                              className="relative flex flex-col items-center p-4 bg-white rounded-lg border hover:shadow-md transition-shadow group"
                            >
                              {/* Report Button - Left Upper Corner */}
                              <button
                                className="absolute top-2 left-2 z-10 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFileReport(file)
                                }}
                                title="Report file"
                              >
                                <Flag className="h-4 w-4 text-gray-400 hover:text-red-600 transition-colors" />
                              </button>

                              {/* Favorite Star - Right Upper Corner */}
                              <button
                                className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleFavorite(file.id)
                                }}
                                title={favorites.has(file.id) ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Star 
                                  className={`h-4 w-4 ${favorites.has(file.id) ? 'fill-yellow-400 text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`} 
                                />
                              </button>

                              {/* File Icon */}
                              <div className="text-4xl mb-2 mt-2">{getFileIcon(file.original_filename)}</div>
                              
                              {/* File Info */}
                              <div className="text-center w-full flex-1">
                                <p 
                                  className="text-sm font-medium text-deep-blue leading-tight line-clamp-2" 
                                  title={file.original_filename}
                                >
                                  {truncateFilename(file.original_filename, 25)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {file.file_size_display}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  by {file.uploaded_by_name}
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-1 mt-3 w-full justify-center">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 hover:bg-blue-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFileDownload(file)
                                  }}
                                  title="Download file"
                                >
                                  <Download className="h-4 w-4 text-blue-600" />
                                </Button>
                                

                                
                                {(user?.email === file.uploaded_by_email || isGroupCreator()) && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleFileDelete(file)
                                    }}
                                    title="Delete file"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  )}

                  {/* Flashcards Tab */}
                  {(joined || isGroupCreator()) && (
                    <TabsContent value="flashcards" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-serif font-medium text-deep-blue">Study Flashcards</h3>
                        <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Flashcard
                        </Button>
                      </div>

                      {/* Create New Flashcard */}
                      <div className="p-4 bg-soft-gray rounded-lg space-y-3">
                        <h4 className="font-medium text-deep-blue">Create New Flashcard</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Front (Question)</label>
                            <Textarea
                              placeholder="Enter the question or term..."
                              value={newFlashcard.front}
                              onChange={(e) => setNewFlashcard({ ...newFlashcard, front: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Back (Answer)</label>
                            <Textarea
                              placeholder="Enter the answer or definition..."
                              value={newFlashcard.back}
                              onChange={(e) => setNewFlashcard({ ...newFlashcard, back: e.target.value })}
                              rows={3}
                            />
                          </div>
                        </div>
                        <Button onClick={handleCreateFlashcard} className="bg-deep-blue hover:bg-deep-blue/90 text-white">
                          Add Flashcard
                        </Button>
                      </div>

                      {/* Existing Flashcards */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {(Array.isArray(group.flashcards) ? group.flashcards : []).map((card: any) => (
                          <div key={card.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                            <div className="mb-3">
                              <div className="text-sm font-medium text-deep-blue mb-2">Question:</div>
                              <div className="text-gray-700">{card.front}</div>
                            </div>
                            <div className="mb-3">
                              <div className="text-sm font-medium text-deep-blue mb-2">Answer:</div>
                              <div className="text-gray-700">{card.back}</div>
                            </div>
                            <div className="text-xs text-gray-500">Created by {card.createdBy}</div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}

                  {/* Sessions Tab */}
                  <TabsContent value="sessions" className="space-y-4">
                    <h3 className="text-lg font-serif font-medium text-deep-blue mb-2">Upcoming Sessions</h3>
                    {isGroupCreator() && (
                      <form onSubmit={editingSession ? handleUpdateSession : handleCreateSession} className="mb-6 space-y-2 bg-white p-4 rounded-lg shadow">
                        <div className="flex flex-wrap gap-2">
                          <input type="date" name="date" value={sessionForm.date} onChange={handleSessionFormChange} required className="border rounded px-2 py-1" />
                          <input type="time" name="time" value={sessionForm.time} onChange={handleSessionFormChange} required className="border rounded px-2 py-1" />
                          <input type="text" name="location" value={sessionForm.location} onChange={handleSessionFormChange} required placeholder="Location" className="border rounded px-2 py-1" />
                          <input type="text" name="description" value={sessionForm.description} onChange={handleSessionFormChange} placeholder="Description (optional)" className="border rounded px-2 py-1 flex-1" />
                          <Button type="submit" className="bg-deep-blue text-white" disabled={sessionLoading}>
                            {editingSession ? 'Update' : 'Create'}
                          </Button>
                          {editingSession && (
                            <Button type="button" variant="outline" onClick={() => { setEditingSession(null); setSessionForm({ date: '', time: '', location: '', description: '' }) }}>Cancel</Button>
                          )}
                        </div>
                      </form>
                    )}
                    <div className="space-y-2">
                      {sessions.length === 0 && <div className="text-gray-500">No sessions scheduled.</div>}
                      {sessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between bg-white p-3 rounded shadow">
                          <div>
                            <div className="font-medium text-deep-blue">{format(new Date(session.date + 'T' + session.time), 'eeee, MMM d, yyyy h:mm a')}</div>
                            <div className="text-sm text-gray-600">{session.location}</div>
                            {session.description && <div className="text-xs text-gray-500">{session.description}</div>}
                          </div>
                          {isGroupCreator() && (
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" onClick={() => handleEditSession(session)}><Edit className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteSession(session.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Members Tab */}
                  <TabsContent value="members" className="space-y-4">
                    <h3 className="text-lg font-serif font-medium text-deep-blue">Group Members ({members.length})</h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      {members.map((member: any) => (
                        <div key={member.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-deep-blue text-white">
                              {member.name.split(" ").map((n: string) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-deep-blue">{member.name}</p>
                            <span className="text-xs text-gray-500">{member.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="font-serif font-medium text-deep-blue">Group Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium">2 weeks ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sessions held</span>
                    <span className="text-sm font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg. attendance</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Study hours</span>
                    <span className="text-sm font-medium">{group.studyHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Languages</span>
                    <span className="text-sm font-medium">{Array.isArray(group.languages) ? group.languages.join(", ") : (group.languages || group.primary_language || "N/A")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Panel */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-serif font-medium text-deep-blue flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gold" /> Notifications
                  </CardTitle>
                  {notifications.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClearNotifications}
                      className="text-xs ml-4"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingNotifications ? (
                  <div className="text-gray-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-gray-500">No notifications yet.</div>
                ) : (
                  <ul className="space-y-3">
                    {notifications.map((n) => (
                      <li key={n.id} className="bg-soft-gray rounded p-3 text-sm text-deep-blue">
                        <span>{n.message}</span>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Similar Groups */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="font-serif font-medium text-deep-blue">Similar Groups</CardTitle>
              </CardHeader>
              <CardContent>
                {group.similar_groups && group.similar_groups.length > 0 ? (
                  <div className="space-y-3">
                    {group.similar_groups.map((similar: any, index: number) => (
                      <div 
                        key={index} 
                        className="p-3 bg-soft-gray rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/group/${similar.group.id}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-sm text-deep-blue">{similar.group.group_name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(similar.similarity_score)}% match
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {similar.group.subject_code} • {similar.group.member_count || 0} members
                        </p>
                        <div className="text-xs text-gray-500">
                          {similar.matching_factors.subject_code && (
                            <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-1 mb-1">
                              Same subject
                            </span>
                          )}
                          {similar.matching_factors.year_level && (
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1 mb-1">
                              Same year
                            </span>
                          )}
                          {similar.matching_factors.meeting_format && (
                            <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded mr-1 mb-1">
                              Same format
                            </span>
                          )}
                          {similar.matching_factors.tags_overlap && (
                            <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded mr-1 mb-1">
                              Similar tags
                            </span>
                          )}
                          {similar.matching_factors.personality_overlap && (
                            <span className="inline-block bg-pink-100 text-pink-800 px-2 py-1 rounded mr-1 mb-1">
                              Similar personality
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No similar groups found.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* File Rename Dialog */}
      {showRenameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-deep-blue mb-4">Rename File</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Name (extension will be preserved)
                </label>
                <div className="flex items-stretch">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                    placeholder="Enter file name"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600 text-sm flex items-center">
                    {selectedFile?.name.split('.').pop() ? `.${selectedFile.name.split('.').pop()}` : ''}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Original: {selectedFile?.name}
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelUpload}
                  disabled={uploadingFile}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-deep-blue hover:bg-deep-blue/90 text-white"
                  onClick={handleFileUpload}
                  disabled={uploadingFile || !newFileName.trim()}
                >
                  {uploadingFile ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
