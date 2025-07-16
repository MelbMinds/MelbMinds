"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  Crown,
  Folder,
  MoreHorizontal,
  Flag,
} from "lucide-react"
import Link from "next/link"
import { useUser } from "@/components/UserContext"
import { use } from "react"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { StarRating } from "@/components/ui/star-rating"
import { PopupAlert } from "@/components/ui/popup-alert"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

// Helper function to check if a time string is on a quarter-hour mark
function isQuarterHour(timeStr: string) {
  if (!timeStr) return false;
  const [h, m, s] = timeStr.split(':').map(Number);
  return [0, 15, 30, 45].includes(m) && (!s || s === 0);
}

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
  const [sessionForm, setSessionForm] = useState({ date: '', start_hour: '', start_minute: '', end_hour: '', end_minute: '', location: '', description: '' })
  const [editingSession, setEditingSession] = useState<any>(null)
  const [sessionLoading, setSessionLoading] = useState(false)

  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newFileName, setNewFileName] = useState("")
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [loadingActions, setLoadingActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    group_name: '',
    subject_code: '',
    course_name: '',
    description: '',
    year_level: '',
    meeting_format: '',
    primary_language: '',
    meeting_schedule: '',
    location: '',
    tags: '',
    group_guidelines: '',
    group_personality: ''
  })
  const [chatError, setChatError] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [editingFolder, setEditingFolder] = useState<any>(null)

  // Add state for editing target hours
  const [editingTargetHours, setEditingTargetHours] = useState(false)
  const [targetHoursInput, setTargetHoursInput] = useState(group?.target_study_hours || 10)
  const [targetHoursError, setTargetHoursError] = useState<string | null>(null)

  // Reporting and deleting state
  const [reportingMessage, setReportingMessage] = useState<any>(null)
  const [reportingFile, setReportingFile] = useState<any>(null)
  const [reportReason, setReportReason] = useState("")
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)

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
      fetch(`http://localhost:8000/api/groups/${group.id}/messages/`, {
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

  // Fetch notifications
  const fetchNotifications = () => {
    if (group?.id && (joined || isGroupCreator())) {
      setLoadingNotifications(true);
      fetch(`http://localhost:8000/api/groups/${group.id}/notifications/`, {
        headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
      })
        .then(res => res.json())
        .then(setNotifications)
        .finally(() => setLoadingNotifications(false));
    }
  };
  useEffect(() => {
    fetchNotifications();
    // Only run on mount or when group/joined/tokens change
    // No polling interval
  }, [group?.id, joined, tokens]);

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

  // Fetch user's rating
  useEffect(() => {
    if (group?.id && tokens?.access) {
      fetch(`http://localhost:8000/api/groups/${group.id}/rating/`, {
        headers: { 'Authorization': `Bearer ${tokens.access}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.rating) {
            setUserRating(data.rating)
          }
        })
        .catch(() => {
          // User hasn't rated yet
          setUserRating(null)
        })
    }
  }, [group?.id, tokens])

  const [message, setMessage] = useState("")
  const [hasRequested, setHasRequested] = useState(false)
  const [chatMessage, setChatMessage] = useState("")

  const handleLeaveGroup = async () => {
    if (!group?.id) return
    if (!window.confirm(`Are you sure you want to leave "${group.group_name}"?`)) return
    
    setLoadingActions(true)
    try {
      const res = await fetch(`http://localhost:8000/api/groups/${group.id}/leave/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`,
        },
      })
      
      if (res.ok) {
        toast({ title: 'Successfully left the group!' })
        // Redirect to dashboard
        window.location.href = '/dashboard'
      } else {
        const data = await res.json()
        toast({ title: 'Error leaving group', description: data.detail, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error leaving group', variant: 'destructive' })
    } finally {
      setLoadingActions(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!group?.id) return
    if (!window.confirm(`Are you sure you want to delete "${group.group_name}"? This action cannot be undone and will remove all group data, sessions, and files.`)) return
    
    setLoadingActions(true)
    try {
      const res = await fetch(`http://localhost:8000/api/groups/${group.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
        },
      })
      
      if (res.ok) {
        toast({ title: 'Group deleted successfully!' })
        // Redirect to dashboard
        window.location.href = '/dashboard'
      } else {
        const data = await res.json()
        toast({ title: 'Error deleting group', description: data.detail, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error deleting group', variant: 'destructive' })
    } finally {
      setLoadingActions(false)
    }
  }

  const handleEditGroup = () => {
    if (!group) return
    setEditForm({
      group_name: group.group_name || '',
      subject_code: group.subject_code || '',
      course_name: group.course_name || '',
      description: group.description || '',
      year_level: group.year_level || '',
      meeting_format: group.meeting_format || '',
      primary_language: group.primary_language || '',
      meeting_schedule: group.meeting_schedule || '',
      location: group.location || '',
      tags: group.tags || '',
      group_guidelines: group.group_guidelines || '',
      group_personality: group.group_personality || ''
    })
    setIsEditing(true)
  }

  const handleUpdateGroup = async () => {
    if (!group?.id) return
    
    setLoadingActions(true)
    try {
      const res = await fetch(`http://localhost:8000/api/groups/${group.id}/update/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`,
        },
        body: JSON.stringify(editForm)
      })
      
      if (res.ok) {
        const updatedGroup = await res.json()
        setGroup(updatedGroup)
        setIsEditing(false)
        toast({ title: 'Group updated successfully!' })
      } else {
        const data = await res.json()
        // Find the first string error in the response
        let errorMsg = data?.error || data?.detail || null;
        if (!errorMsg && typeof data === 'object') {
          for (const key in data) {
            if (typeof data[key] === 'string') {
              errorMsg = data[key];
              break;
            }
            if (Array.isArray(data[key]) && typeof data[key][0] === 'string') {
              errorMsg = data[key][0];
              break;
            }
          }
        }
        setUpdateError(errorMsg || data.error || data.detail)
      }
    } catch (error) {
      toast({ title: 'Error updating group', variant: 'destructive' })
    } finally {
      setLoadingActions(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({
      group_name: '',
      subject_code: '',
      course_name: '',
      description: '',
      year_level: '',
      meeting_format: '',
      primary_language: '',
      meeting_schedule: '',
      location: '',
      tags: '',
      group_guidelines: '',
      group_personality: ''
    })
  }

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
    const res = await fetch(`http://localhost:8000/api/groups/${group.id}/messages/`, {
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
      const data = await fetch(`http://localhost:8000/api/groups/${group.id}/messages/`, {
        headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
      }).then(r => r.json())
      setMessages(data)
    } else {
      const data = await res.json()
      // Find the first string error in the response
      let errorMsg = data?.error || data?.detail || null;
      if (!errorMsg && typeof data === 'object') {
        for (const key in data) {
          if (typeof data[key] === 'string') {
            errorMsg = data[key];
            break;
          }
          if (Array.isArray(data[key]) && typeof data[key][0] === 'string') {
            errorMsg = data[key][0];
            break;
          }
        }
      }
      if (errorMsg) {
        setChatError(errorMsg)
      }
    }
  }

  // Flashcard state
  const [flashcardFolders, setFlashcardFolders] = useState<any[]>([])
  const [loadingFlashcards, setLoadingFlashcards] = useState(false)
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  // Fetch flashcard folders
  useEffect(() => {
    if (group?.id && (joined || isGroupCreator()) && tokens?.access) {
      fetchFlashcardFolders()
    }
  }, [group?.id, joined, tokens])

  const fetchFlashcardFolders = async () => {
    if (!tokens?.access || !group?.id) return
    
    setLoadingFlashcards(true)
    try {
      const res = await fetch(`http://localhost:8000/api/flashcards/folders/?group=${group.id}`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setFlashcardFolders(data)
      }
    } catch (err) {
      console.error("Failed to fetch flashcard folders:", err)
    } finally {
      setLoadingFlashcards(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    
    setIsCreatingFolder(true)
    try {
      const res = await fetch("http://localhost:8000/api/flashcards/folders/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`
        },
        body: JSON.stringify({ 
          name: newFolderName.trim(),
          group: group.id
        })
      })
      
      if (res.ok) {
        const newFolder = await res.json()
        setFlashcardFolders(prev => [newFolder, ...prev])
        setNewFolderName("")
        setShowCreateFolderDialog(false)
        
        toast({
          title: "Success!",
          description: "Flashcard folder created successfully.",
        })
      } else {
        throw new Error("Failed to create folder")
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const handleRenameFolder = (folder: any) => {
    setEditingFolder(folder)
    setNewFolderName(folder.name)
    setShowCreateFolderDialog(true)
  }

  const handleDeleteFolder = async (folder: any) => {
    if (!window.confirm(`Are you sure you want to delete "${folder.name}"? This action cannot be undone.`)) return

    try {
      const res = await fetch(`http://localhost:8000/api/flashcards/folders/${folder.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
        },
      })

      if (res.ok) {
        setFlashcardFolders(prev => prev.filter(f => f.id !== folder.id))
        toast({ title: 'Folder deleted successfully!' })
      } else {
        const error = await res.json()
        toast({ title: 'Error deleting folder', description: error.detail, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error deleting folder', variant: 'destructive' })
    }
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder?.id) return

    setIsCreatingFolder(true)
    try {
      const res = await fetch(`http://localhost:8000/api/flashcards/folders/${editingFolder.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`,
        },
        body: JSON.stringify({ name: newFolderName.trim() })
      })

      if (res.ok) {
        const updatedFolder = await res.json()
        setFlashcardFolders(prev => prev.map(f => f.id === updatedFolder.id ? updatedFolder : f))
        setEditingFolder(null)
        setNewFolderName("")
        setShowCreateFolderDialog(false)
        toast({ title: 'Folder updated successfully!' })
      } else {
        const error = await res.json()
        toast({ title: 'Error updating folder', description: error.detail, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error updating folder', variant: 'destructive' })
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const handleCancelFolderEdit = () => {
    setEditingFolder(null)
    setNewFolderName("")
    setShowCreateFolderDialog(false)
  }

  // Session CRUD handlers
  const handleSessionFormChange = (e: any) => {
    setSessionForm({ ...sessionForm, [e.target.name]: e.target.value })
  }
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionError("");
    const { date, start_hour, start_minute, end_hour, end_minute, location, description } = sessionForm;
    if (!date || !start_hour || !start_minute || !end_hour || !end_minute) {
      setSessionError("Please fill in all required fields.");
      return;
    }
    // Combine hour and minute into 'HH:MM:00' format
    const start_time = `${start_hour}:${start_minute}:00`;
    const end_time = `${end_hour}:${end_minute}:00`;
    // Frontend validation for quarter-hour and order
    if (!isQuarterHour(start_time) || !isQuarterHour(end_time)) {
      setSessionError('Start and end times must be on a quarter-hour mark (:00, :15, :30, :45).');
      return;
    }
    if (end_time <= start_time) {
      setSessionError('End time must be after start time.');
      return;
    }
    const payload = {
      date,
      start_time,
      end_time,
      location,
      description,
    };
    const res = await fetch(`http://localhost:8000/api/groups/${group.id}/sessions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
      },
      body: JSON.stringify(payload)
    });
    setSessionLoading(false);
    if (res.ok) {
      setSessionForm({ date: '', start_hour: '', start_minute: '', end_hour: '', end_minute: '', location: '', description: '' });
      fetch(`http://localhost:8000/api/groups/${group.id}/sessions/`, {
        headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
      })
        .then(res => res.json())
        .then(setSessions);
      toast({ title: 'Session created!' });
    } else {
      const err = await res.json();
      let errorMsg = err?.error || err?.detail || null;
      if (!errorMsg && typeof err === 'object') {
        for (const key in err) {
          if (typeof err[key] === 'string') {
            errorMsg = err[key];
            break;
          }
          if (Array.isArray(err[key]) && typeof err[key][0] === 'string') {
            errorMsg = err[key][0];
            break;
          }
        }
      }
      setSessionError(errorMsg || 'Error creating session');
    }
  }
  const handleEditSession = (session: any) => {
    setEditingSession(session)
    const [start_hour, start_minute] = session.start_time.split(":");
    const [end_hour, end_minute] = session.end_time.split(":");
    setSessionForm({
      date: session.date,
      start_hour: start_hour || '',
      start_minute: start_minute || '',
      end_hour: end_hour || '',
      end_minute: end_minute || '',
      location: session.location,
      description: session.description || ''
    })
  }
  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionError("");
    const { date, start_hour, start_minute, end_hour, end_minute, location, description } = sessionForm;
    if (!date || !start_hour || !start_minute || !end_hour || !end_minute) {
      setSessionError("Please fill in all required fields.");
      return;
    }
    // Combine hour and minute into 'HH:MM:00' format
    const start_time = `${start_hour}:${start_minute}:00`;
    const end_time = `${end_hour}:${end_minute}:00`;
    if (!isQuarterHour(start_time) || !isQuarterHour(end_time)) {
      setSessionError('Start and end times must be on a quarter-hour mark (:00, :15, :30, :45).');
      return;
    }
    if (end_time <= start_time) {
      setSessionError('End time must be after start time.');
      return;
    }
    const res = await fetch(`http://localhost:8000/api/sessions/${editingSession.id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
      },
      body: JSON.stringify({ date, start_time, end_time, location, description })
    });
    setSessionLoading(false);
    if (res.ok) {
      setEditingSession(null);
      setSessionForm({ date: '', start_hour: '', start_minute: '', end_hour: '', end_minute: '', location: '', description: '' });
      fetch(`http://localhost:8000/api/groups/${group.id}/sessions/`, {
        headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
      })
        .then(res => res.json())
        .then(setSessions);
      toast({ title: 'Session updated!' });
    } else {
      const err = await res.json();
      let errorMsg = err?.error || err?.detail || null;
      if (!errorMsg && typeof err === 'object') {
        for (const key in err) {
          if (typeof err[key] === 'string') {
            errorMsg = err[key];
            break;
          }
          if (Array.isArray(err[key]) && typeof err[key][0] === 'string') {
            errorMsg = err[key][0];
            break;
          }
        }
      }
      setSessionError(errorMsg || 'Error updating session');
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
        // Find the first string error in the response
        let errorMsg = error?.error || error?.detail || null;
        if (!errorMsg && typeof error === 'object') {
          for (const key in error) {
            if (typeof error[key] === 'string') {
              errorMsg = error[key];
              break;
            }
            if (Array.isArray(error[key]) && typeof error[key][0] === 'string') {
              errorMsg = error[key][0];
              break;
            }
          }
        }
        setFileError(errorMsg || error.detail || error.error)
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
        const contentType = res.headers.get('content-type')
        
        // Check if it's a JSON response (S3 URL redirect)
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json()
          if (data.download_url) {
            // For S3 files, open the URL in a new tab (download attribute doesn't work cross-origin)
            window.open(data.download_url, '_blank')
          } else {
            toast({ title: 'Error downloading file', variant: 'destructive' })
          }
        } else if (contentType && contentType.includes('application/octet-stream')) {
          // For direct file downloads (streamed from S3)
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
          // Fallback for other content types
          const blob = await res.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = file.original_filename
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
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

  const handleFileReport = (file: any) => {
    setReportingFile(file)
    setReportReason("")
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

  // Add this function to handle rating changes
  const handleRatingChange = async (newRating: number) => {
    if (!group?.id || !tokens?.access) return
    setRatingLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/api/groups/${group.id}/rating/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access}`,
        },
        body: JSON.stringify({ rating: newRating })
      })
      if (res.ok) {
        setUserRating(newRating)
        toast({ title: 'Thank you for rating!' })
        // Optionally, refetch group data to update average rating
        const groupRes = await fetch(`http://localhost:8000/api/groups/${group.id}/`, {
          headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
        })
        if (groupRes.ok) {
          const data = await groupRes.json()
          setGroup(data)
        }
      } else {
        const err = await res.json()
        toast({ title: 'Error submitting rating', description: err.detail, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error submitting rating', variant: 'destructive' })
    } finally {
      setRatingLoading(false)
    }
  }

  const handleDeleteMessage = async (msgId: number) => {
    setDeleteLoading(msgId)
    try {
      const res = await fetch(`http://localhost:8000/api/groups/${group.id}/messages/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
        },
        body: JSON.stringify({ id: msgId })
      })
      if (res.ok) {
        setMessages(messages.filter(m => m.id !== msgId))
      } else {
        toast({ title: 'Error', description: 'Could not delete message', variant: 'destructive' })
      }
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleReportSubmit = async () => {
    if (reportingMessage && reportReason.trim()) {
      setReportSubmitting(true)
      try {
        const res = await fetch('http://localhost:8000/api/reports/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
          },
          body: JSON.stringify({
            type: 'message',
            target_id: reportingMessage.id,
            reason: reportReason.trim(),
          })
        })
        if (res.ok) {
          toast({ title: 'Reported', description: 'Message reported for review.' })
          setReportingMessage(null)
          setReportReason("")
        } else {
          toast({ title: 'Error', description: 'Could not report message', variant: 'destructive' })
        }
      } finally {
        setReportSubmitting(false)
      }
    } else if (reportingFile && reportReason.trim()) {
      setReportSubmitting(true)
      try {
        const res = await fetch('http://localhost:8000/api/reports/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
          },
          body: JSON.stringify({
            type: 'file',
            target_id: reportingFile.id,
            reason: reportReason.trim(),
          })
        })
        if (res.ok) {
          toast({ title: 'File reported successfully!' })
          setReportingFile(null)
          setReportReason("")
        } else {
          toast({ title: 'Error reporting file', variant: 'destructive' })
        }
      } catch (error) {
        toast({ title: 'Error reporting file', variant: 'destructive' })
      } finally {
        setReportSubmitting(false)
      }
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center">{error}</div>
  if (!group) return null

  return (
    <div className="min-h-screen bg-soft-gray">
      {/* Popup Alerts */}
      <PopupAlert 
        message={chatError} 
        onClose={() => setChatError(null)} 
      />
      <PopupAlert 
        message={updateError} 
        onClose={() => setUpdateError(null)} 
      />
      <PopupAlert 
        message={fileError} 
        onClose={() => setFileError(null)} 
      />
      <PopupAlert 
        message={sessionError} 
        onClose={() => setSessionError(null)} 
      />
      
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
                      <Star className="mr-1 h-4 w-4 text-yellow-400 fill-current" />
                      {group.average_rating ? `${group.average_rating.toFixed(1)} (${group.rating_count || 0})` : "No ratings"}
                    </div>
                    <Badge className={`${getFormatColor(group.meeting_format)} flex items-center gap-1 border`}>
                      {getFormatIcon(group.meeting_format)}
                      {group.meeting_format}
                    </Badge>
                    <span>{group.year_level}</span>
                  </div>
                  {/* Study Progress Bar */}
                  <div className="w-full rounded-lg p-0 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-deep-blue text-base">Study Progress</span>
                      <span className="text-sm text-gray-600">{group.total_study_hours} / {group.target_hours} hours</span>
                    </div>
                    <Progress value={group.progress_percentage} className="h-4 rounded-full bg-blue-200" />
                    <div className="flex justify-end items-center text-xs text-gray-500 mt-1 gap-2">
                      <span>{group.progress_percentage}%</span>
                      {isGroupCreator() && !editingTargetHours && (
                        <Button 
                          size="icon" 
                          variant="default" 
                          className="ml-2 bg-[#00264D] text-white rounded-xl shadow-md hover:bg-[#001a33] transition-colors w-9 h-9 flex items-center justify-center"
                          onClick={() => { setEditingTargetHours(true); setTargetHoursInput(group.target_hours); }}
                          aria-label="Change Target"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                      )}
                      {isGroupCreator() && editingTargetHours && (
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          setTargetHoursError(null);
                          if (!Number.isFinite(Number(targetHoursInput)) || Number(targetHoursInput) <= 0) {
                            setTargetHoursError("Target hours must be a positive number");
                            return;
                          }
                          setLoadingActions(true);
                          try {
                            const res = await fetch(`http://localhost:8000/api/groups/${group.id}/update/`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` }) },
                              body: JSON.stringify({ target_hours: Number(targetHoursInput) })
                            });
                            if (res.ok) {
                              const updated = await res.json();
                              setGroup(updated);
                              setEditingTargetHours(false);
                              toast({ title: 'Target hours updated!' });
                            } else {
                              const data = await res.json();
                              setTargetHoursError(data.error || 'Failed to update');
                            }
                          } catch {
                            setTargetHoursError('Network error');
                          } finally {
                            setLoadingActions(false);
                          }
                        }} className="flex items-center gap-2 ml-2">
                          <Input type="number" min={1} value={targetHoursInput} onChange={e => setTargetHoursInput(e.target.value)} className="w-20 h-6 text-xs px-2 py-1" />
                          <Button size="sm" type="submit" disabled={loadingActions}>Save</Button>
                          <Button size="sm" variant="ghost" type="button" onClick={() => setEditingTargetHours(false)}>Cancel</Button>
                          {targetHoursError && <span className="text-xs text-red-500 ml-2">{targetHoursError}</span>}
                        </form>
                      )}
                    </div>
                  </div>
                  {/* End Study Progress Bar */}
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
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6 leading-relaxed">{group.description}</p>

                {/* Rating Section - Only show for group members who are not the creator */}
                {(joined || isGroupCreator()) && !isGroupCreator() && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-deep-blue">Rate this group</h3>
                      {group.average_rating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Average:</span>
                          <StarRating 
                            rating={group.average_rating} 
                            readonly 
                            size="sm" 
                            showValue 
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <StarRating 
                        rating={userRating || 0} 
                        onRatingChange={handleRatingChange}
                        size="lg"
                        showValue
                        className="flex-1"
                      />
                      {ratingLoading && (
                        <div className="text-sm text-gray-500">Submitting...</div>
                      )}
                    </div>
                    
                    {!userRating && (
                      <p className="text-sm text-gray-500 mt-2">
                        Click on the stars to rate this group
                      </p>
                    )}
                  </div>
                )}

                {/* Show average rating for all users */}
                {!joined && !isGroupCreator() && group.average_rating && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-deep-blue">Group Rating</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Average:</span>
                        <StarRating 
                          rating={group.average_rating} 
                          readonly 
                          size="lg" 
                          showValue 
                        />
                        <span className="text-sm text-gray-500">({group.rating_count || 0} ratings)</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Join the group to rate it
                    </p>
                  </div>
                )}

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
                  <div className="flex gap-2">
                    {isGroupCreator() ? (
                      <>
                        <Button 
                          variant="outline"
                          className="border-deep-blue text-deep-blue hover:bg-deep-blue/10"
                          onClick={handleEditGroup}
                          disabled={loadingActions}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Group
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-600"
                          onClick={handleDeleteGroup}
                          disabled={loadingActions}
                        >
                          {loadingActions ? 'Deleting...' : 'Delete Group'}
                        </Button>
                      </>
                    ) : joined || hasRequested ? (
                      <>
                        <Button className="bg-gray-400 text-white font-serif" disabled>
                          <UserPlus className="mr-2 h-4 w-4" />
                          You already joined this group
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-600"
                          onClick={handleLeaveGroup}
                          disabled={loadingActions}
                        >
                          {loadingActions ? 'Leaving...' : 'Leave Group'}
                        </Button>
                      </>
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

                {/* JOIN PROMPT: Show if not joined and not creator */}
                {!(joined || isGroupCreator()) && (
                  <div className="w-full px-6 pb-2">
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded text-center text-sm font-medium">
                      Join the group to access all features (chat, files, flashcards, sessions, etc.)
                    </div>
                  </div>
                )}

                <CardContent>
                  {/* Chat Tab */}
                  {(joined || isGroupCreator()) && (
                    <TabsContent value="chat" className="space-y-4">
                      <div className="h-96 overflow-y-auto space-y-4 p-4 bg-soft-gray rounded-lg">
                        {Array.isArray(messages) && messages.length > 0 ? (
                          messages.map((msg: any) => (
                            <div key={msg.id} className="flex space-x-3 group">
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
                                <div className="flex items-center">
                                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg shadow-sm mb-1 flex-1">{msg.text}</p>
                                  <div className="ml-2 flex items-center self-start">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost" aria-label="Message actions">
                                          <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        {(msg.is_sender || msg.is_group_creator) && (
                                          <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} disabled={deleteLoading === msg.id} className="text-red-600">
                                            {deleteLoading === msg.id ? 'Deleting...' : 'Delete'}
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => setReportingMessage(msg)} className="text-[#003366]">
                                          Report
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
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
                        <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
                          <DialogTrigger asChild>
                            <Button 
                              disabled={flashcardFolders.length >= 5}
                              className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create Folder
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{editingFolder ? 'Rename Folder' : 'Create New Flashcard Folder'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="folder-name">Folder Name</Label>
                                <Input
                                  id="folder-name"
                                  value={newFolderName}
                                  onChange={(e) => setNewFolderName(e.target.value)}
                                  placeholder="Enter folder name..."
                                  onKeyPress={(e) => e.key === 'Enter' && (editingFolder ? handleUpdateFolder() : handleCreateFolder())}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  onClick={handleCancelFolderEdit}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                                  disabled={!newFolderName.trim() || isCreatingFolder}
                                  className="bg-deep-blue hover:bg-deep-blue/90"
                                >
                                  {isCreatingFolder ? (editingFolder ? "Updating..." : "Creating...") : (editingFolder ? "Rename" : "Create")}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {loadingFlashcards ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-blue mx-auto"></div>
                          <p className="mt-2 text-gray-600">Loading folders...</p>
                        </div>
                      ) : flashcardFolders.length === 0 ? (
                        <div className="text-center py-12">
                          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No flashcard folders yet</h3>
                          <p className="text-gray-600 mb-4">Create your first flashcard folder to get started</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {flashcardFolders.map((folder) => (
                            <div key={folder.id} className="relative group">
                              <Link href={`/flashcards/${folder.id}`}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                                  <CardContent className="p-6 text-center">
                                                                        <div className="relative mb-4">
                                      <div className="w-16 h-16 bg-deep-blue/10 rounded-lg flex items-center justify-center mx-auto group-hover:bg-deep-blue/20 transition-colors">
                                        <Folder className="w-8 h-8 text-deep-blue" />
                                      </div>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{folder.name}</h3>
                                    <p className="text-sm text-gray-500">{folder.flashcard_count} flashcards</p>
                                  </CardContent>
                                </Card>
                              </Link>
                                                             {/* Rename and Delete icons */}
                               <button
                                 className="absolute bottom-2 left-2 z-10 p-1 hover:bg-gray-100 transition-colors"
                                 onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRenameFolder(folder); }}
                                 title="Rename folder"
                               >
                                 <Edit className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                               </button>
                               <button
                                 className="absolute bottom-2 right-2 z-10 p-1 hover:bg-gray-100 transition-colors"
                                 onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteFolder(folder); }}
                                 title="Delete folder"
                               >
                                 <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                               </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {flashcardFolders.length >= 5 && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-yellow-800 text-sm">
                            You've reached the maximum of 5 folders. Create new folders by deleting existing ones.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  )}

                  {/* Sessions Tab */}
                  <TabsContent value="sessions" className="space-y-4">
                    <h3 className="text-lg font-serif font-medium text-deep-blue mb-2">Upcoming Sessions</h3>
                    {isGroupCreator() && (
                      <form onSubmit={editingSession ? handleUpdateSession : handleCreateSession} className="mb-6 space-y-4 bg-white p-4 rounded-lg shadow">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <div>
                            <Label htmlFor="session-date">Date</Label>
                            <input type="date" id="session-date" name="date" value={sessionForm.date} onChange={handleSessionFormChange} required className="border rounded px-2 py-1 w-full" />
                          </div>
                          <div>
                            <Label>Start Time</Label>
                            <div className="flex gap-2">
                              <select name="start_hour" value={sessionForm.start_hour || ''} onChange={handleSessionFormChange} required className="border rounded px-2 py-1">
                                <option value="">Hour</option>
                                {[...Array(24).keys()].map(h => <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>)}
                              </select>
                              <span className="self-center">:</span>
                              <select name="start_minute" value={sessionForm.start_minute || ''} onChange={handleSessionFormChange} required className="border rounded px-2 py-1">
                                <option value="">Min</option>
                                {[0, 15, 30, 45].map(m => <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>)}
                              </select>
                            </div>
                          </div>
                          <div>
                            <Label>End Time</Label>
                            <div className="flex gap-2">
                              <select name="end_hour" value={sessionForm.end_hour || ''} onChange={handleSessionFormChange} required className="border rounded px-2 py-1">
                                <option value="">Hour</option>
                                {[...Array(24).keys()].map(h => <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>)}
                              </select>
                              <span className="self-center">:</span>
                              <select name="end_minute" value={sessionForm.end_minute || ''} onChange={handleSessionFormChange} required className="border rounded px-2 py-1">
                                <option value="">Min</option>
                                {[0, 15, 30, 45].map(m => <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>)}
                              </select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="session-location">Location</Label>
                            <input type="text" id="session-location" name="location" value={sessionForm.location} onChange={handleSessionFormChange} required placeholder="Location" className="border rounded px-2 py-1 w-full" />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" className="bg-deep-blue text-white w-full" disabled={sessionLoading}>
                              {editingSession ? 'Update' : 'Create'}
                            </Button>
                            {editingSession && (
                              <Button type="button" variant="outline" onClick={() => { setEditingSession(null); setSessionForm({ date: '', start_hour: '', start_minute: '', end_hour: '', end_minute: '', location: '', description: '' }) }}>Cancel</Button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2">
                          <Label htmlFor="session-description">Description (optional)</Label>
                          <input type="text" id="session-description" name="description" value={sessionForm.description} onChange={handleSessionFormChange} placeholder="Description (optional)" className="border rounded px-2 py-1 w-full" />
                        </div>
                        {/* Validation error display */}
                        {sessionError && <div className="text-red-500 text-sm mt-2">{sessionError}</div>}
                      </form>
                    )}
                    <div className="space-y-2">
                      {sessions.length === 0 && <div className="text-gray-500">No sessions scheduled.</div>}
                      {sessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between bg-white p-3 rounded shadow">
                          <div>
                            <div className="font-medium text-deep-blue">
                              {format(new Date(session.date + 'T' + session.start_time), 'eeee, MMM d, yyyy h:mm a')} - {format(new Date(session.date + 'T' + session.end_time), 'h:mm a')}
                            </div>
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
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-deep-blue">{member.name}</p>
                              {member.is_creator && (
                                <div className="flex items-center">
                                  <Crown className="h-4 w-4 text-yellow-400 -mt-0.5" />
                                </div>
                              )}
                            </div>
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

      {/* Edit Group Dialog */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-deep-blue mb-4">Edit Group Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                  <input
                    type="text"
                    value={editForm.group_name}
                    onChange={(e) => setEditForm({...editForm, group_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code</label>
                  <input
                    type="text"
                    value={editForm.subject_code}
                    onChange={(e) => setEditForm({...editForm, subject_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                    placeholder="e.g., COMP20008"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
                  <input
                    type="text"
                    value={editForm.course_name}
                    onChange={(e) => setEditForm({...editForm, course_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                    placeholder="Enter course name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
                  <select
                    value={editForm.year_level}
                    onChange={(e) => setEditForm({...editForm, year_level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                  >
                    <option value="">Select year level</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Format</label>
                  <select
                    value={editForm.meeting_format}
                    onChange={(e) => setEditForm({...editForm, meeting_format: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                  >
                    <option value="">Select format</option>
                    <option value="In-person">In-person</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Language</label>
                  <input
                    type="text"
                    value={editForm.primary_language}
                    onChange={(e) => setEditForm({...editForm, primary_language: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                    placeholder="e.g., English"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Schedule</label>
                  <input
                    type="text"
                    value={editForm.meeting_schedule}
                    onChange={(e) => setEditForm({...editForm, meeting_schedule: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                    placeholder="e.g., Weekly"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                    placeholder="Enter location"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                  placeholder="Describe your study group..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                  placeholder="e.g., Python, Programming, Algorithms"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Personality (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.group_personality}
                  onChange={(e) => setEditForm({...editForm, group_personality: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                  placeholder="e.g., Focused, Collaborative, Technical"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Guidelines</label>
                <textarea
                  value={editForm.group_guidelines}
                  onChange={(e) => setEditForm({...editForm, group_guidelines: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent"
                  placeholder="Enter group guidelines..."
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={loadingActions}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-deep-blue hover:bg-deep-blue/90 text-white"
                  onClick={handleUpdateGroup}
                  disabled={loadingActions || !editForm.group_name.trim()}
                >
                  {loadingActions ? 'Updating...' : 'Update Group'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar and Target Hours Admin Control */}
      

      {/* Reporting Dialogs */}
      {(reportingMessage || reportingFile) && (
        <Dialog open={!!(reportingMessage || reportingFile)} onOpenChange={open => { if (!open) { setReportingMessage(null); setReportingFile(null); setReportReason(""); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Report {reportingMessage ? 'Message' : 'File'}</DialogTitle>
            </DialogHeader>
            <div className="mb-2">Please provide details for reporting this {reportingMessage ? 'message' : 'file'}:</div>
            <Textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
              rows={3}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setReportingMessage(null); setReportingFile(null); setReportReason(""); }} disabled={reportSubmitting}>Cancel</Button>
              <Button onClick={handleReportSubmit} disabled={reportSubmitting || !reportReason.trim()}>
                {reportSubmitting ? 'Reporting...' : 'Submit Report'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
