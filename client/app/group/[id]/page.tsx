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
  FileEdit,
  Clipboard,
  Check,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { useUser } from "@/components/UserContext"
import { use } from "react"
import { toastSuccess, toastFail } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { StarRating } from "@/components/ui/star-rating"
import { PopupAlert } from "@/components/ui/popup-alert"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import Skeleton from "@/components/ui/Skeleton"

// Helper function to check if a time string is on a quarter-hour mark
function isQuarterHour(timeStr: string) {
  if (!timeStr) return false;
  const [h, m, s] = timeStr.split(':').map(Number);
  return [0, 15, 30, 45].includes(m) && (!s || s === 0);
}

// Add the list of popular UniMelb study spots at the top of the file
const UNIMELB_LOCATIONS = [
  // Libraries
  'Baillieu Library',
  'Law Library',
  'Giblin Eunson Library',
  'Brownless Biomedical Library',
  'Eastern Resource Centre (ERC)',
  'Architecture Library',
  'Veterinary Science Library',
  'Music Library',
  // Buildings
  'Old Arts Building',
  'Arts West',
  'Peter Hall Building',
  'Alan Gilbert Building',
  'Sidney Myer Asia Centre',
  'Elisabeth Murdoch Building',
  'Melbourne School of Design (MSD)',
  'Doug McDonell Building',
  'Biosciences Building',
  'Glyn Davis Building',
  // Cafes
  'House of Cards Café',
  'Standing Room Coffee',
  "Castro's Kiosk",
  'Seven Seeds (nearby)',
  'Tsubu Bar',
  'Dr Dax Kitchen',
  'Queensberry Pour House',
  'Stovetop Café',
  // Outdoor Spaces
  'South Lawn',
  'University Square',
  'System Garden',
  'Concrete Lawns',
  'Northern Plaza',
  'Alumni Courtyard',
  'Student Precinct Outdoor Area',
];

// Sort the locations alphabetically for the dropdown
const SORTED_UNIMELB_LOCATIONS = [...UNIMELB_LOCATIONS].sort((a, b) => a.localeCompare(b));

// Add a helper to compare start and end times
function isEndTimeAfterStartTime(
  date: string,
  start_hour: string,
  start_minute: string,
  end_hour: string,
  end_minute: string
) {
  if (!date || start_hour === '' || start_minute === '' || end_hour === '' || end_minute === '') return true;
  const start = new Date(`${date}T${String(start_hour).padStart(2, '0')}:${String(start_minute).padStart(2, '0')}:00`);
  const end = new Date(`${date}T${String(end_hour).padStart(2, '0')}:${String(end_minute).padStart(2, '0')}:00`);
  return end > start;
}

// Define categorized UniMelb locations with emoji headers
const uniMelbLocations = {
  '📚 Libraries': [
    'Baillieu Library',
    'Law Library',
    'Giblin Eunson Library',
    'Brownless Biomedical Library',
    'Eastern Resource Centre (ERC)',
    'Architecture Library',
    'Veterinary Science Library',
    'Music Library',
  ],
  '🏢 Buildings (General Study Spaces)': [
    'Old Arts Building',
    'Arts West',
    'Peter Hall Building',
    'Alan Gilbert Building',
    'Sidney Myer Asia Centre',
    'Elisabeth Murdoch Building',
    'Melbourne School of Design (MSD)',
    'Doug McDonell Building',
    'Biosciences Building',
    'Glyn Davis Building',
  ],
  '☕ Cafes (Popular for Studying)': [
    'House of Cards Café',
    'Standing Room Coffee',
    "Castro's Kiosk",
    'Seven Seeds (nearby)',
    'Tsubu Bar',
    'Dr Dax Kitchen',
    'Queensberry Pour House',
    'Stovetop Café',
  ],
  '🌿 Outdoor Spaces': [
    'South Lawn',
    'University Square',
    'System Garden',
    'Concrete Lawns',
    'Northern Plaza',
    'Alumni Courtyard',
    'Student Precinct Outdoor Area',
  ],
};

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

  // Add missing state and helpers
  const isStaff = user?.is_staff || false;
  const [showSignInPopup, setShowSignInPopup] = useState(false);

  // Add state for sessions
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionForm, setSessionForm] = useState({
    topic: '',
    date: '',
    startTime: '',
    endTime: '',
    type: '',
    location: '',
    extraDetails: '',
    description: '',
    startHour: '',
    startMinute: '',
    endHour: '',
    endMinute: '',
  })
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

  // Add state for sending message
  const [sendingMessage, setSendingMessage] = useState(false)

  // Add state for active tab
  const [activeTab, setActiveTab] = useState(joined ? 'chat' : 'members')

  // Add state for optimistic messages
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([])
  const [showSessionModal, setShowSessionModal] = useState(false);

  const router = useRouter();

  // Add state for new session
  const [newSession, setNewSession] = useState({
    topic: '',
    date: '',
    startTime: '',
    endTime: '',
    type: '',
    location: '',
    extraDetails: '',
    description: '',
  });

  // Add state for time options
  const [timeOptions, setTimeOptions] = useState([
    { value: '09:00', display: '9:00 AM' },
    { value: '10:00', display: '10:00 AM' },
    { value: '11:00', display: '11:00 AM' },
    { value: '12:00', display: '12:00 PM' },
    { value: '13:00', display: '1:00 PM' },
    { value: '14:00', display: '2:00 PM' },
    { value: '15:00', display: '3:00 PM' },
    { value: '16:00', display: '4:00 PM' },
    { value: '17:00', display: '5:00 PM' },
    { value: '18:00', display: '6:00 PM' },
    { value: '19:00', display: '7:00 PM' },
    { value: '20:00', display: '8:00 PM' },
    { value: '21:00', display: '9:00 PM' },
    { value: '22:00', display: '10:00 PM' },
    { value: '23:00', display: '11:00 PM' },
  ]);

  // Add state for show schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Add state for session creation loading and notification
  const [creatingSession, setCreatingSession] = useState(false)
  const [showSessionSuccess, setShowSessionSuccess] = useState(false)

  // Add state for loading join per session
  const [joiningSessionId, setJoiningSessionId] = useState<number | null>(null);

  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Add state for share link UI
  const [showShareLink, setShowShareLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const groupLink = typeof window !== 'undefined' ? `${window.location.origin}/group/${group?.id}` : '';

  const GROUP_NOTIF_CLEAR_KEY = `group_notifications_cleared_at_${group?.id || ''}`;
  const [notifLoading, setNotifLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${id}/`, {
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
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/members/`)
        .then(res => res.json())
        .then(setMembers)
    }
  }, [group?.id])
  // Fetch chat messages if joined, creator, or staff
  useEffect(() => {
    if (group?.id && (joined || isGroupCreator() || isStaff)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/messages/`, {
        headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
      })
        .then(res => res.json())
        .then(setMessages)
    }
  }, [group?.id, joined, tokens, isStaff])

  // Fetch sessions only when meetups tab is selected
  useEffect(() => {
    if (activeTab === 'meetups' && group?.id && (joined || isGroupCreator() || isStaff)) {
      const fetchSessions = () => {
        setSessionsLoading(true);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/sessions/`, {
          headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
        })
          .then(res => res.json())
          .then(setSessions)
          .finally(() => setSessionsLoading(false));
      }
      fetchSessions();
      // Removed polling interval for sessions
      // const interval = setInterval(fetchSessions, 30000)
      // return () => clearInterval(interval)
    }
  }, [activeTab, group?.id, joined, tokens, isStaff]);

  // Fetch notifications
  const fetchGroupNotifications = async () => {
    setNotifLoading(true);
    if (!group?.id) {
      setNotifications([]);
      setNotifLoading(false);
      return;
    }
    let allNotifications: any[] = [];
    // Group notifications
    const notifRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/notifications/`, {
      headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
    });
    if (notifRes.ok) {
      const notifs = await notifRes.json();
      notifs.slice(0, 5).forEach((n: any) => {
        allNotifications.push({
          id: `notif-${group.id}-${n.id}`,
          type: 'notification',
          title: n.message,
          time: n.created_at ? format(new Date(n.created_at), 'MMM d, h:mm a') : '',
          rawTime: n.created_at ? new Date(n.created_at).getTime() : 0,
          group: group.group_name || group.subject_code,
        });
      });
    }
    // Chat messages
    const msgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/messages/`, {
      headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
    });
    if (msgRes.ok) {
      const messages = await msgRes.json();
      messages.slice(-5).forEach((msg: any) => {
        if (user && msg.user_id !== user.id) {
          allNotifications.push({
            id: `msg-${group.id}-${msg.id}`,
            type: 'message',
            title: `New message from ${msg.user_name || 'Someone'}: ${msg.text.length > 40 ? msg.text.slice(0, 40) + '...' : msg.text}`,
            time: msg.timestamp ? format(new Date(msg.timestamp), 'MMM d, h:mm a') : '',
            rawTime: msg.timestamp ? new Date(msg.timestamp).getTime() : 0,
            group: group.group_name || group.subject_code,
          });
        }
      });
    }
    // Filter out notifications/messages created before the last clear for this group
    const clearedAt = parseInt(localStorage.getItem(GROUP_NOTIF_CLEAR_KEY) || '0', 10);
    allNotifications = allNotifications.filter(n => n.rawTime > clearedAt);
    // Sort notifications by time (most recent first)
    allNotifications.sort((a, b) => b.rawTime - a.rawTime);
    const top5 = allNotifications.slice(0, 5);
    setNotifications(top5);
    setNotifLoading(false);
  };

  useEffect(() => {
    fetchGroupNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, user]);

  const handleClearGroupNotifications = async () => {
    setClearLoading(true);
    if (!group?.id) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/notifications/clear/`, {
      method: 'DELETE',
      headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
    });
    // Mark the time of clear, so all notifications/messages before this are hidden
    const now = Date.now();
    localStorage.setItem(GROUP_NOTIF_CLEAR_KEY, now.toString());
    setNotifications([]);
    setClearLoading(false);
  };

  // Fetch files
  useEffect(() => {
    if (group?.id && (joined || isGroupCreator() || isStaff)) {
      const fetchFiles = async () => {
        setLoadingFiles(true)
        console.log('Fetching files for group:', group.id)
        
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/files/`, {
            headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
          })
          
          console.log('Files fetch response status:', res.status)
          
          if (res.ok) {
            const files = await res.json()
            console.log('Files fetched successfully:', files.length)
            setFiles(files)
          } else {
            console.error('Error fetching files:', res.status)
            try {
              const errorText = await res.text()
              console.error('Error response:', errorText)
            } catch (e) {
              console.error('Could not read error response')
            }
          }
        } catch (err) {
          console.error('Exception during files fetch:', err)
        } finally {
          setLoadingFiles(false)
        }
      }
      
      fetchFiles()
    }
  }, [group?.id, joined, tokens, isStaff])

  // Fetch user's rating
  useEffect(() => {
    if (group?.id && tokens?.access) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/rating/`, {
        headers: { 'Authorization': `Bearer ${tokens.access}` },
      })
        .then(res => {
          if (res.status === 404) {
            setUserRating(null);
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (data && data.rating) {
            setUserRating(data.rating)
          }
        })
        .catch(() => {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/leave/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`,
        },
      })
      
      if (res.ok) {
        toastSuccess({ title: 'Successfully left the group!' })
        // Redirect to dashboard
        window.location.href = '/dashboard'
      } else {
        const data = await res.json()
        toastFail({ title: 'Error leaving group', description: data.detail })
      }
    } catch (error) {
      toastFail({ title: 'Error leaving group' })
    } finally {
      setLoadingActions(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!group?.id) return
    if (!window.confirm(`Are you sure you want to delete "${group.group_name}"? This action cannot be undone and will remove all group data, sessions, and files.`)) return
    
    setLoadingActions(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
        },
      })
      
      if (res.ok) {
        toastSuccess({ title: 'Group deleted successfully!' })
        // Redirect to dashboard
        window.location.href = '/dashboard'
      } else {
        const data = await res.json()
        toastFail({ title: 'Error deleting group', description: data.detail })
      }
    } catch (error) {
      toastFail({ title: 'Error deleting group' })
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/update/`, {
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
        toastSuccess({ title: 'Group updated successfully!' })
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
      toastFail({ title: 'Error updating group' })
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${id}/join/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
        },
      })
      
      if (res.ok) {
        setHasRequested(true)
        setJoined(true)
        toastSuccess({
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
    setSendingMessage(true)
    const tempId = `temp-${Date.now()}`
    const optimisticMsg = {
      id: tempId,
      user_id: user?.id,
      user_name: user?.name,
      text: chatMessage,
      timestamp: new Date().toISOString(),
      is_sender: true,
      is_group_creator: isGroupCreator(),
      optimistic: true
    }
    setOptimisticMessages((prev) => [...prev, optimisticMsg])
    setChatMessage("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
        },
        body: JSON.stringify({ text: optimisticMsg.text })
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data])
        setOptimisticMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      } else {
        setOptimisticMessages((prev) => prev.filter((msg) => msg.id !== tempId))
        const data = await res.json()
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
    } finally {
      setSendingMessage(false)
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
    if (group?.id && (joined || isGroupCreator() || isStaff) && tokens?.access) {
      fetchFlashcardFolders()
    }
  }, [group?.id, joined, tokens, isStaff])

  const fetchFlashcardFolders = async () => {
    if (!tokens?.access || !group?.id) return
    
    setLoadingFlashcards(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flashcards/folders/?group=${group.id}`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flashcards/folders/`, {
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
        
        toastSuccess({
          title: "Success!",
          description: "Flashcard folder created successfully.",
        })
      } else {
        throw new Error("Failed to create folder")
      }
    } catch (err) {
      toastFail({
        title: "Error",
        description: "Failed to create folder. Please try again.",
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flashcards/folders/${folder.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
        },
      })

      if (res.ok) {
        setFlashcardFolders(prev => prev.filter(f => f.id !== folder.id))
        toastSuccess({ title: 'Folder deleted successfully!' })
      } else {
        const error = await res.json()
        toastFail({ title: 'Error deleting folder', description: error.detail })
      }
    } catch (error) {
      toastFail({ title: 'Error deleting folder' })
    }
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder?.id) return

    setIsCreatingFolder(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flashcards/folders/${editingFolder.id}/`, {
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
        toastSuccess({ title: 'Folder updated successfully!' })
      } else {
        const error = await res.json()
        toastFail({ title: 'Error updating folder', description: error.detail })
      }
    } catch (error) {
      toastFail({ title: 'Error updating folder' })
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
    setCreatingSession(true);
    const { date, startTime, endTime, location, description = '', topic, extraDetails, type } = sessionForm;
    if (!isEndTimeAfterStartTime(date, startTime, '', endTime, '')) {
      setSessionError("End time must be after start time.");
      setCreatingSession(false);
      return;
    }
    if (!date || !startTime || !endTime || !location || !type) {
      setSessionError("Please fill in all required fields.");
      setCreatingSession(false);
      return;
    }
    // Format times for backend as 'HH:MM:00'
    const start_time = startTime.length === 5 ? `${startTime}:00` : startTime;
    const end_time = endTime.length === 5 ? `${endTime}:00` : endTime;
    // Compose description with topic and extraDetails if present
    let fullDescription = description || '';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/sessions/`, {
        method: 'POST',
        headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, date, start_time, end_time, location, meeting_format: type, description: fullDescription, extra_details: extraDetails }),
      });
      if (res.ok) {
        setSessionForm({ topic: '', date: '', startTime: '', endTime: '', type: '', location: '', extraDetails: '', description: '' });
        setShowSessionModal(false);
        toastSuccess({ title: 'Session created!' });
        // Refresh sessions after creation
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/sessions/`, {
          headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
        })
          .then(res => res.json())
          .then(setSessions);
      } else {
        const data = await res.json();
        setSessionError(data.error || data.detail || 'Failed to create session.');
      }
    } catch (err) {
      setSessionError('Failed to create session.');
    } finally {
      setCreatingSession(false);
    }
  };
  const handleEditSession = (session: any) => {
    setEditingSession(session);
    setSessionForm({
      topic: session.topic || '',
      date: session.date || '',
      startTime: session.start_time ? session.start_time.slice(0,5) : '',
      endTime: session.end_time ? session.end_time.slice(0,5) : '',
      type: session.meeting_format || '',
      location: session.location || '',
      extraDetails: session.extra_details || '',
      description: session.description || '',
      startHour: session.start_time ? session.start_time.split(':')[0] : '',
      startMinute: session.start_time ? session.start_time.split(':')[1] : '',
      endHour: session.end_time ? session.end_time.split(':')[0] : '',
      endMinute: session.end_time ? session.end_time.split(':')[1] : '',
    });
    setShowSessionModal(true);
  };
  const handleUpdateSession = async (e: React.FormEvent) => {
    console.log('handleUpdateSession called', sessionForm);
    e.preventDefault();
    setSessionError("");
    const { topic, date, startTime, endTime, type, location } = sessionForm;
    if (!topic || !date || !startTime || !endTime || !type || !location) {
      setSessionError("Please fill in all required fields.");
      return;
    }
    // Combine hour and minute into 'HH:MM:00' format
    const start_time = `${startTime}:00:00`;
    const end_time = `${endTime}:00:00`;
    if (!isQuarterHour(start_time) || !isQuarterHour(end_time)) {
      setSessionError('Start and end times must be on a quarter-hour mark (:00, :15, :30, :45).');
      return;
    }
    if (end_time <= start_time) {
      setSessionError('End time must be after start time.');
      return;
    }
    console.log('About to send PUT request', { topic, date, start_time, end_time, location, meeting_format: type, description: sessionForm.description, extra_details: sessionForm.extraDetails });
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${editingSession.id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
      },
      body: JSON.stringify({ topic, date, start_time, end_time, location, meeting_format: type, description: sessionForm.description, extra_details: sessionForm.extraDetails })
    });
    setSessionLoading(false);
    if (res.ok) {
      setEditingSession(null);
      setSessionForm({ topic: '', date: '', startTime: '', endTime: '', type: '', location: '', extraDetails: '', description: '', startHour: '', startMinute: '', endHour: '', endMinute: '' });
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/sessions/`, {
        headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
      })
        .then(res => res.json())
        .then(setSessions);
      toastSuccess({ title: 'Session updated!' });
    } else {
      const err = await res.json();
      console.error('Session update error:', err);
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/`, {
      method: 'DELETE',
      headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
    })
    setSessionLoading(false)
    if (res.ok) {
      setSessions(sessions.filter(s => s.id !== sessionId))
      toastSuccess({ title: 'Session deleted!' })
    } else {
      toastFail({ title: 'Error deleting session' })
    }
  }

  const handleClearNotifications = async () => {
    if (!window.confirm('Clear all notifications?')) return
    setLoadingNotifications(true)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/notifications/clear/`, {
      method: 'DELETE',
      headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
    })
    setLoadingNotifications(false)
    if (res.ok) {
      setNotifications([])
      toastSuccess({ title: 'All notifications cleared!' })
    } else {
      toastFail({ title: 'Error clearing notifications' })
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
    
    console.log('Uploading file:', {
      name: renamedFile.name,
      type: renamedFile.type,
      size: renamedFile.size
    })
    
    const formData = new FormData()
    formData.append('file', renamedFile)

    try {
      console.log('Sending file to:', `${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/files/`)
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/files/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
        },
        body: formData,
      })

      console.log('Upload response status:', res.status)
      
      if (res.ok) {
        const newFile = await res.json()
        console.log('File uploaded successfully, response:', newFile)
        
        setFiles(prev => [newFile, ...prev])
        toastSuccess({ title: 'File uploaded successfully!' })
      } else {
        let errorText;
        try {
          errorText = await res.text();
          console.error('Upload error response:', errorText);
          
          // Try to parse as JSON if possible
          let error;
          try {
            error = JSON.parse(errorText);
          } catch (e) {
            error = { error: errorText };
          }
          
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
          setFileError(errorMsg || error.detail || error.error);
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          setFileError('Unknown error occurred');
        }
      }
    } catch (error) {
      toastFail({ title: 'Error uploading file' })
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
      // Log for debugging
      console.log('Downloading file:', file.id)
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.id}/download/`, {
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
        },
      })

      console.log('Download response status:', res.status)
      
      if (res.ok) {
        const contentType = res.headers.get('content-type')
        console.log('Response content type:', contentType)
        
        // Check if it's a JSON response (S3 URL redirect)
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json()
          console.log('Got JSON download data:', data)
          
          if (data.download_url) {
            // Instead of window.open which can be blocked, create an anchor and click it
            const a = document.createElement('a')
            a.href = data.download_url
            a.target = '_blank'
            a.rel = 'noopener noreferrer'
            a.download = file.original_filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          } else {
            toastFail({ title: 'Error downloading file', description: 'No download URL provided' })
          }
        } else if (contentType && contentType.includes('application/octet-stream')) {
          // For direct file downloads (streamed from S3)
          const blob = await res.blob()
          console.log('Got blob data, size:', blob.size)
          
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = file.original_filename
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          console.log('Using fallback download method')
          // Fallback for other content types
          const blob = await res.blob()
          console.log('Got blob data, size:', blob.size)
          
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
        // Try to get error details
        try {
          const errorText = await res.text()
          console.error('File download error:', errorText)
          toastFail({ title: 'Error downloading file', description: 'Status: ' + res.status })
        } catch (e) {
          console.error('Could not parse error response:', e)
          toastFail({ title: 'Error downloading file' })
        }
      }
    } catch (error) {
      toastFail({ title: 'Error downloading file' })
    }
  }

  const handleFileDelete = async (file: any) => {
    if (!window.confirm(`Delete "${file.original_filename}"?`)) return

    try {
      console.log('Deleting file:', file.id)
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
        },
      })

      console.log('Delete response status:', res.status)
      
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== file.id))
        toastSuccess({ title: 'File deleted successfully!' })
      } else {
        let errorMessage = 'Error deleting file';
        
        try {
          const errorText = await res.text();
          console.error('Delete error response:', errorText);
          
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error || errorJson.detail) {
              errorMessage = errorJson.error || errorJson.detail;
            }
          } catch (e) {
            // Not JSON, use as is
            if (errorText) {
              errorMessage = `Error: ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}`;
            }
          }
        } catch (e) {
          console.error('Could not read error response');
        }
        
        toastFail({ 
          title: 'Error deleting file',
          description: errorMessage
        });
      }
    } catch (error) {
      console.error('Exception during file delete:', error);
      toastFail({ title: 'Error deleting file', description: 'Network or server error' })
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
        return '��'
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/rating/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access}`,
        },
        body: JSON.stringify({ rating: newRating })
      })
      const data = await res.json()
      if (res.ok) {
        setUserRating(newRating)
        if (data.message === 'Rating updated successfully') {
          toastSuccess({ title: 'Rating updated successfully!' })
        } else {
          toastSuccess({ title: 'Thank you for rating!' })
        }
        // Optionally, refetch group data to update average rating
        const groupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/`, {
          headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
        })
        if (groupRes.ok) {
          const data = await groupRes.json()
          setGroup(data)
        }
      } else {
        toastFail({ title: 'Error submitting rating', description: data.detail })
      }
    } catch (error) {
      toastFail({ title: 'Error submitting rating' })
    } finally {
      setRatingLoading(false)
    }
  }

  const handleDeleteMessage = async (msgId: number) => {
    setDeleteLoading(msgId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/messages/`, {
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
        toastFail({ title: 'Error', description: 'Could not delete message' })
      }
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleReportSubmit = async () => {
    if (reportingMessage && reportReason.trim()) {
      setReportSubmitting(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/`, {
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
          toastSuccess({ title: 'Reported', description: 'Message reported for review.' })
          setReportingMessage(null)
          setReportReason("")
        } else {
          toastFail({ title: 'Error', description: 'Could not report message' })
        }
      } finally {
        setReportSubmitting(false)
      }
    } else if (reportingFile && reportReason.trim()) {
      setReportSubmitting(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/`, {
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
          toastSuccess({ title: 'File reported successfully!' })
          setReportingFile(null)
          setReportReason("")
        } else {
          toastFail({ title: 'Error reporting file' })
        }
      } catch (error) {
        toastFail({ title: 'Error reporting file' })
      } finally {
        setReportSubmitting(false)
      }
    }
  }

  const handleJoinRequestWithAuth = async () => {
    if (!user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('showSignInPopup', '1');
      }
      router.push("/auth");
      return;
    }
    handleJoinRequest();
  };


  // Add a function to join a session
  const handleJoinSession = async (sessionId: number) => {
    if (!tokens?.access) return;
    setJoiningSessionId(sessionId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/join/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokens.access}` },
      });
      const data = await res.json();
      if (res.ok) {
        toastSuccess({ title: 'Joined session!', description: 'You have joined this session.' });
        // Refetch sessions from backend to update attendees
        await fetchSessions();
      }
    } catch (e) {
      // Optionally handle error (e.g., set an error state)
    } finally {
      setJoiningSessionId(null);
    }
  };

  // Fetch sessions function
  const fetchSessions = async () => {
    if (!group?.id) return;
    setSessionsLoading?.(true); // Only call if setSessionsLoading exists in scope
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/sessions/`, {
        headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
      });
      const data = await res.json();
      setSessions(data);
    } catch (e) {
      // Optionally handle error (e.g., set an error state)
    } finally {
      setSessionsLoading?.(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-soft-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content (2 containers) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Group Header Skeleton */}
            <div className="bg-white rounded-lg shadow-lg border-0 w-full p-8 flex flex-col gap-4 mb-6">
              <div className="w-24 h-6 mb-2"><Skeleton className="h-6 w-24 rounded" /></div> {/* Subject badge */}
              <Skeleton className="h-10 w-2/3 rounded mb-2" /> {/* Group name/title */}
              <div className="flex gap-4 mb-2">
                <Skeleton className="h-4 w-20 rounded" /> {/* Members */}
                <Skeleton className="h-4 w-24 rounded" /> {/* Rating */}
                <Skeleton className="h-4 w-16 rounded" /> {/* Year */}
              </div>
              <div className="w-full flex flex-col gap-1 mb-2">
                <Skeleton className="h-4 w-1/2 rounded mb-1" /> {/* Progress label */}
                <Skeleton className="h-4 w-full rounded" /> {/* Progress bar */}
              </div>
              <div className="flex flex-col gap-1 mb-2">
                <Skeleton className="h-4 w-1/3 rounded" /> {/* Course code */}
                <Skeleton className="h-4 w-1/2 rounded" /> {/* Course name */}
              </div>
              <div className="flex gap-2 mb-2">
                <Skeleton className="h-8 w-20 rounded" /> {/* Share button */}
              </div>
              <div className="flex flex-col gap-2 mb-2">
                <Skeleton className="h-4 w-5/6 rounded" /> {/* Description line 1 */}
                <Skeleton className="h-4 w-2/3 rounded" /> {/* Description line 2 */}
              </div>
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-6 w-20 rounded" /> {/* Tag 1 */}
                <Skeleton className="h-6 w-16 rounded" /> {/* Tag 2 */}
                <Skeleton className="h-6 w-12 rounded" /> {/* Tag 3 */}
              </div>
            </div>
            {/* Tabbed Content Skeleton */}
            <div className="bg-white rounded-lg shadow-lg border-0 w-full p-8 flex flex-col gap-4">
              <Tabs value="members">
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  <TabsTrigger value="chat" disabled className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" /> Chat
                  </TabsTrigger>
                  <TabsTrigger value="files" disabled className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Files
                  </TabsTrigger>
                  <TabsTrigger value="flashcards" disabled className="flex items-center gap-2">
                    <Brain className="h-4 w-4" /> Flashcards
                  </TabsTrigger>
                  <TabsTrigger value="meetups" disabled className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" /> Meetups
                  </TabsTrigger>
                  <TabsTrigger value="members" disabled className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Members
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Skeleton className="h-64 w-full rounded" />
            </div>
          </div>
          {/* Sidebar (3 containers) */}
          <div className="flex flex-col gap-6">
            {/* Group Stats */}
            <div className="bg-white rounded-lg shadow-lg border-0 w-full flex flex-col">
              <div className="px-6 pt-6 pb-2">
                <CardTitle className="font-serif font-medium text-deep-blue">Group Stats</CardTitle>
              </div>
              <div className="px-6 pb-4 flex flex-col gap-0 mt-2">
                <Skeleton className="h-4 w-3/4 rounded mb-2" />
                <Skeleton className="h-4 w-2/3 rounded mb-2" />
                <Skeleton className="h-4 w-1/2 rounded mb-2" />
                <Skeleton className="h-4 w-2/3 rounded mb-2" />
                <Skeleton className="h-4 w-1/3 rounded" />
              </div>
            </div>
            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-lg border-0 w-full flex flex-col">
              <div className="px-6 pt-6 pb-2 flex items-center gap-2">
                <Bell className="h-5 w-5 text-gold" />
                <CardTitle className="font-serif font-medium text-deep-blue">Notifications</CardTitle>
              </div>
              <div className="px-6 pb-4 flex flex-col gap-2 mt-2">
                <Skeleton className="h-8 w-full rounded mb-2" />
                <Skeleton className="h-8 w-5/6 rounded" />
              </div>
            </div>
            {/* Similar Groups */}
            <div className="bg-white rounded-lg shadow-lg border-0 w-full flex flex-col">
              <div className="px-6 pt-6 pb-2">
                <CardTitle className="font-serif font-medium text-deep-blue">Similar Groups</CardTitle>
              </div>
              <div className="px-6 pb-4 flex flex-col gap-2 mt-2">
                <Skeleton className="h-10 w-full rounded mb-2" />
                <Skeleton className="h-10 w-5/6 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
                    <span>{group.year_level}</span>
                  </div>
                  {/* Study Progress Bar */}
                  <div className="w-full rounded-lg p-0 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-deep-blue text-base">Study Progress</span>
                      <span className="text-sm text-gray-600">{group.total_study_hours} / {group.target_hours} hours</span>
                    </div>
                    <Progress value={group.progress_percentage} className="h-4 rounded-full bg-blue-200" />
                    <div className="flex justify-end text-xs text-gray-500 mt-1">
                      <span>{group.progress_percentage}%</span>
                    </div>
                  </div>
                  {/* End Study Progress Bar */}
                  <div className="flex flex-col gap-1">
                    <span className="text-base text-gray-700">Course Code: {group.subject_code}</span>
                    <span className="text-base text-gray-700">Course Name: {group.course_name}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-transparent" onClick={async () => {
                    const groupLink = typeof window !== 'undefined' ? `${window.location.origin}/group/${group?.id}` : '';
                    await navigator.clipboard.writeText(groupLink);
                    toastSuccess({ title: 'Copied to clipboard' });
                  }}>
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
                  {/* Upcoming Section replaces Schedule and Location */}
                  <div className="col-span-2 flex items-center text-sm text-gray-600">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>
                      <strong>Upcoming:</strong>{' '}
                      {(() => {
                        // Find the next upcoming session
                        const now = new Date();
                        const upcoming = Array.isArray(sessions)
                          ? sessions
                              .map((s) => ({
                                ...s,
                                start: new Date(`${s.date}T${s.start_time || s.startTime}`),
                              }))
                              .filter((s) => s.start > now)
                              .sort((a, b) => a.start - b.start)[0]
                          : null;
                        if (upcoming) {
                          return `${upcoming.topic ? upcoming.topic + ' - ' : ''}${upcoming.date} at ${upcoming.start_time || upcoming.startTime}${upcoming.location ? ' (' + upcoming.location + ')' : ''}`;
                        } else {
                          return 'No sessions upcoming.';
                        }
                      })()}
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
                        onClick={handleJoinRequestWithAuth}
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
              <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue={joined ? "chat" : "members"} className="w-full">
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
                    <TabsTrigger value="meetups" className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Meetups
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
                          [...messages, ...optimisticMessages].map((msg: any) => (
                            <div key={msg.id} className={`flex space-x-3 group ${msg.optimistic ? 'opacity-60' : ''}`}>
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
                        <Button onClick={handleSendMessage} className="bg-deep-blue hover:bg-deep-blue/90 text-white" disabled={sendingMessage || !chatMessage.trim()}>
                          {sendingMessage ? (
                            <span className="inline-block w-4 h-4 mr-2 align-middle">
                              <span className="block w-4 h-4 border-2 border-t-2 border-t-white border-white/30 rounded-full animate-spin"></span>
                            </span>
                          ) : (
                            <Send className="h-4 w-4" />
                          )} Send
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
                                  className="text-sm font-medium text-deep-blue leading-tight line-clamp-2 break-all" 
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

                  {/* Meetups Tab */}
                  <TabsContent value="meetups" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-serif font-medium text-deep-blue">Upcoming Sessions</h3>
                      {isGroupCreator() && (
                        <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
                          <DialogTrigger asChild>
                            <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">
                              <CalendarPlus className="mr-2 h-4 w-4" />
                              Schedule Session
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl w-full rounded-xl p-0 bg-white shadow-2xl border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                              <div className="flex justify-between items-center">
                                <DialogTitle className="text-2xl font-serif font-bold text-deep-blue">Schedule New Session</DialogTitle>
                                
                              </div>
                            </div>
                            {/* Make the form content scrollable if too tall */}
                            <div className="max-h-[70vh] overflow-y-auto">
                              <form onSubmit={editingSession ? handleUpdateSession : handleCreateSession} className="p-6 space-y-6">
                                {/* Session Topic */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700">Session Topic *</label>
                                  <Input
                                    placeholder="e.g., Functions and Modules Review"
                                    value={sessionForm.topic || ''}
                                    onChange={e => setSessionForm({ ...sessionForm, topic: e.target.value })}
                                    className="w-full"
                                    required
                                  />
                                </div>
                                {/* Date and Time */}
                                <div className="grid md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Date *</label>
                                    <Input
                                      type="date"
                                      value={sessionForm.date}
                                      onChange={e => setSessionForm({ ...sessionForm, date: e.target.value })}
                                      className="w-full"
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Start Time *</label>
                                    <div className="flex gap-2">
                                      <select
                                        value={sessionForm.startHour || ''}
                                        onChange={e => {
                                          setSessionForm({ ...sessionForm, startHour: e.target.value, startTime: e.target.value && sessionForm.startMinute ? `${e.target.value}:${sessionForm.startMinute}` : '' });
                                        }}
                                        className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00264D]"
                                        required
                                      >
                                        <option value="">Hour</option>
                                        {[...Array(24).keys()].map(h => (
                                          <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</option>
                                        ))}
                                      </select>
                                      <select
                                        value={sessionForm.startMinute || ''}
                                        onChange={e => {
                                          setSessionForm({ ...sessionForm, startMinute: e.target.value, startTime: sessionForm.startHour && e.target.value ? `${sessionForm.startHour}:${e.target.value}` : '' });
                                        }}
                                        className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00264D]"
                                        required
                                      >
                                        <option value="">Min</option>
                                        {['00', '15', '30', '45'].map(m => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">End Time *</label>
                                    <div className="flex gap-2">
                                      <select
                                        value={sessionForm.endHour || ''}
                                        onChange={e => {
                                          setSessionForm({ ...sessionForm, endHour: e.target.value, endTime: e.target.value && sessionForm.endMinute ? `${e.target.value}:${sessionForm.endMinute}` : '' });
                                        }}
                                        className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00264D]"
                                        required
                                      >
                                        <option value="">Hour</option>
                                        {[...Array(24).keys()].map(h => (
                                          <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</option>
                                        ))}
                                      </select>
                                      <select
                                        value={sessionForm.endMinute || ''}
                                        onChange={e => {
                                          setSessionForm({ ...sessionForm, endMinute: e.target.value, endTime: sessionForm.endHour && e.target.value ? `${sessionForm.endHour}:${e.target.value}` : '' });
                                        }}
                                        className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00264D]"
                                        required
                                      >
                                        <option value="">Min</option>
                                        {['00', '15', '30', '45'].map(m => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                                {/* Session Type */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700">Session Type *</label>
                                  <select
                                    value={sessionForm.type || ''}
                                    onChange={e => setSessionForm({ ...sessionForm, type: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00264D]"
                                    required
                                  >
                                    <option value="">Select type...</option>
                                    <option value="In-person">In-person</option>
                                    <option value="Virtual">Virtual</option>
                                    <option value="Hybrid">Hybrid (In-person + Virtual)</option>
                                  </select>
                                </div>
                                {/* Location */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700">
                                    {sessionForm.type === "Virtual" ? "Virtual Platform" : "Location"} *
                                  </label>
                                  {sessionForm.type === "In-person" ? (
                                    <select
                                      value={sessionForm.location}
                                      onChange={e => setSessionForm({ ...sessionForm, location: e.target.value })}
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00264D]"
                                      required
                                    >
                                      <option value="">Select location...</option>
                                      {Object.entries(uniMelbLocations).map(([category, locations]) => [
                                        <optgroup key={category} label={category}>
                                          {locations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                          ))}
                                        </optgroup>
                                      ])}
                                    </select>
                                  ) : (
                                    <Input
                                      placeholder={sessionForm.type === "Virtual" ? "e.g., Zoom, Microsoft Teams, Google Meet" : "e.g., Doug McDonell Building"}
                                      value={sessionForm.location || ''}
                                      onChange={e => setSessionForm({ ...sessionForm, location: e.target.value })}
                                      className="w-full"
                                      required
                                    />
                                  )}
                                </div>
                                {/* Extra Details */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700">
                                    {sessionForm.type === "Virtual" ? "Meeting Details" : "Room & Floor Details"}
                                  </label>
                                  <Input
                                    placeholder={sessionForm.type === "Virtual" ? "e.g., Meeting ID: 123-456-789, Password: study123" : "e.g., Room 234, Level 2, Near the library"}
                                    value={sessionForm.extraDetails || ''}
                                    onChange={e => setSessionForm({ ...sessionForm, extraDetails: e.target.value })}
                                    className="w-full"
                                  />
                                </div>
                                {/* Description */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
                                  <Textarea
                                    placeholder="Add any additional information about this session..."
                                    value={sessionForm.description || ''}
                                    onChange={e => setSessionForm({ ...sessionForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full"
                                  />
                                </div>
                                {/* Preview */}
                                <div className="p-4 bg-soft-gray rounded-lg border-l-4 border-deep-blue">
                                  <h4 className="font-medium text-deep-blue mb-2">Session Preview</h4>
                                  <div className="space-y-1 text-sm text-gray-700">
                                    {sessionForm.topic && (
                                      <p>
                                        <strong>Topic:</strong> {sessionForm.topic}
                                      </p>
                                    )}
                                    {sessionForm.date && sessionForm.startTime && sessionForm.endTime && (
                                      <p>
                                        <strong>When:</strong>{' '}
                                        {new Date(sessionForm.date).toLocaleDateString('en-AU', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                        })}
                                        , {sessionForm.startTime} - {sessionForm.endTime}
                                      </p>
                                    )}
                                    {sessionForm.location && (
                                      <p>
                                        <strong>Where:</strong> {sessionForm.location}
                                      </p>
                                    )}
                                    {sessionForm.extraDetails && (
                                      <p>
                                        <strong>Details:</strong> {sessionForm.extraDetails}
                                      </p>
                                    )}
                                    {sessionForm.type && (
                                      <p>
                                        <strong>Type:</strong> {sessionForm.type}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {/* Actions */}
                                <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
                                  <Button variant="outline" type="button" onClick={() => setShowSessionModal(false)} className="bg-transparent">
                                    Cancel
                                  </Button>
                                  <Button
                                    type="submit"
                                    className="bg-deep-blue hover:bg-deep-blue/90 text-white flex items-center justify-center"
                                    disabled={
                                      !sessionForm.topic ||
                                      !sessionForm.date ||
                                      !sessionForm.startTime ||
                                      !sessionForm.endTime ||
                                      !sessionForm.location ||
                                      !sessionForm.type ||
                                      creatingSession
                                    }
                                  >
                                    {creatingSession ? (
                                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></span>
                                    ) : (
                                      editingSession ? <Edit className="mr-2 h-4 w-4" /> : <CalendarPlus className="mr-2 h-4 w-4" />
                                    )}
                                    {creatingSession ? (editingSession ? 'Saving...' : 'Creating...') : (editingSession ? 'Save Changes' : 'Schedule Session')}
                                  </Button>
                                </div>
                              </form>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {(!user || !user.id) ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-blue mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading user...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sessionsLoading ? (
                          <div className="text-gray-500">Loading sessions...</div>
                        ) : sessions.length === 0 ? (
                          <div className="text-gray-500">No sessions scheduled.</div>
                        ) : (
                          sessions.map((session, index) => {
                            // Debug log
                            console.log('Session', session.id, 'attendees:', session.attendees, 'user.id:', user && user.id);
                            const alreadyJoined = Array.isArray(session.attendees) && user && session.attendees.some((attId: any) => String(attId) === String(user.id));
                            return (
                              <div key={index} className="relative p-4 bg-white rounded-lg border">
                                {isGroupCreator() && (
                                  <div className="absolute top-2 right-2 z-10">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost" aria-label="Session actions">
                                          <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditSession(session)}>
                                          <Edit className="h-4 w-4 mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDeleteSession(session.id)} className="text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                                <div className="mb-3">
                                  <h4 className="font-semibold text-deep-blue text-lg">{session.topic || "Untitled Session"}</h4>
                                  <div className="flex items-center text-gray-600 mb-1">
                                    <Clock className="mr-2 h-4 w-4" />
                                    {format(new Date(session.date + 'T' + session.start_time), 'eeee, MMM d')} • {format(new Date(session.date + 'T' + session.start_time), 'h:mm a')} - {format(new Date(session.date + 'T' + session.end_time), 'h:mm a')}
                                  </div>
                                  <div className="flex items-center text-gray-600 mb-1">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {session.location}
                                    {session.extra_details && `, ${session.extra_details}`}
                                  </div>
                                  <div className="flex items-center text-gray-600 mb-1">
                                    {session.meeting_format === 'Virtual' ? <Video className="mr-2 h-4 w-4" /> : <Users className="mr-2 h-4 w-4" />}
                                    {session.meeting_format}
                                  </div>
                                  {session.description && (
                                    <div className="text-gray-600">
                                      <strong>Description:</strong> {session.description}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 mb-2">
                                  <span className="text-xs text-gray-500">{session.attendee_count || 0} joined</span>
                                </div>
                                {/* Only show Join Session button if not already joined and not loading */}
                                {!alreadyJoined && (
                                  <Button size="sm" className="bg-deep-blue hover:bg-deep-blue/90 text-white" onClick={() => handleJoinSession(session.id)} disabled={joiningSessionId === session.id}>
                                    {joiningSessionId === session.id ? (
                                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                                    ) : null}
                                    {joiningSessionId === session.id ? 'Joining...' : 'Join Session'}
                                  </Button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
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
                    <span className="text-sm font-medium">{group.created_at ? new Date(group.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sessions held</span>
                    <span className="text-sm font-medium">{Array.isArray(sessions) ? sessions.length : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg. attendance</span>
                    <span className="text-sm font-medium">{Array.isArray(sessions) && sessions.length > 0 && group.member_count ? `${Math.round(sessions.reduce((sum, s) => sum + (s.attendee_count || 0), 0) / sessions.length / group.member_count * 100)}%` : 'N/A'}</span>
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
                <CardTitle className="font-serif font-medium text-deep-blue flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>Notifications</span>
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchGroupNotifications} className="text-xs p-0 min-w-[18px] min-h-[18px]" disabled={notifLoading} aria-label="Refresh notifications">
                      <RotateCcw className={notifLoading ? "animate-spin" : ""} size={12} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleClearGroupNotifications} className="text-xs p-0 min-w-[18px] min-h-[18px]" disabled={clearLoading} aria-label="Clear all notifications">
                      <Trash2 className={clearLoading ? "opacity-50" : ""} size={12} />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-gray-500">No notifications yet.</div>
                  ) : notifications.map((notification) => (
                    <div key={notification.id} className="rounded-lg bg-gray-50 p-4 min-w-0 overflow-hidden">
                      <p className="text-sm font-medium mb-2 line-clamp-2 break-words max-w-full">{notification.title}</p>
                      <div className="flex items-center justify-between min-w-0">
                        <Badge variant="secondary" className="text-xs truncate max-w-[60%]">
                          {notification.group}
                        </Badge>
                        <span className="text-xs text-gray-500 ml-2 truncate max-w-[40%]">{notification.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={fetchGroupNotifications} disabled={notifLoading} aria-label="View all notifications">
                  View All Notifications
                </Button>
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

      {showSessionSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4">
          <span>Session created!</span>
          <button onClick={() => setShowSessionSuccess(false)} className="ml-2 text-white hover:text-gray-200 text-xl font-bold">×</button>
        </div>
      )}

    </div>
  )
}
