"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Calendar, Bell, BookOpen, Clock, MapPin, Video, Plus, Settings, Star, TrendingUp, ChevronDown, ChevronRight, Crown } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser } from "@/components/UserContext"
import { format } from "date-fns"
import { toastSuccess, toastFail } from "@/components/ui/use-toast"
import Skeleton from "@/components/ui/Skeleton";

export default function DashboardPage() {
  const [notifications] = useState([
    {
      id: 1,
      type: "session",
      title: "Python Study Group starts in 30 minutes",
      time: "30 min",
      group: "COMP10001",
    },
    {
      id: 2,
      type: "message",
      title: "New message in Biology Study Circle",
      time: "2 hours",
      group: "BIOL10004",
    },
    {
      id: 3,
      type: "request",
      title: "Join request approved for Legal Foundations",
      time: "1 day",
      group: "LAWS10001",
    },
  ])

  const [createdGroups, setCreatedGroups] = useState<any[]>([])
  const [joinedGroups, setJoinedGroups] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [showCreatedGroups, setShowCreatedGroups] = useState(true)
  const [showJoinedGroups, setShowJoinedGroups] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(true)
  const [loadingActions, setLoadingActions] = useState(false)
  const { user, tokens } = useUser()
  
  useEffect(() => {
    if (tokens?.access && user?.email) {
      setLoadingGroups(true)
      // Fetch all groups and filter them properly
      fetch("http://localhost:8000/api/groups/", {
        headers: { "Authorization": `Bearer ${tokens.access}` },
      })
        .then(res => res.json())
        .then(data => {
          // Filter groups where user is the creator
          const created = data.filter((group: any) => group.creator_email === user.email)
          // Filter groups where user has joined (but is not the creator)
          const joined = data.filter((group: any) => group.joined && group.creator_email !== user.email)
          setCreatedGroups(created)
          setJoinedGroups(joined)
          setLoadingGroups(false)
        })
        .catch(() => {
          // Fallback to profile endpoint for joined groups
          fetch("http://localhost:8000/api/profile/", {
            headers: { "Authorization": `Bearer ${tokens.access}` },
          })
            .then(res => res.json())
            .then(data => {
              setJoinedGroups(data.joined_groups || [])
              setLoadingGroups(false)
            })
            .catch(() => {
              setLoadingGroups(false)
            });
        });
    } else {
      setLoadingGroups(false)
    }
  }, [tokens, user]);

  // Fetch all sessions for all groups (created + joined)
  useEffect(() => {
    async function fetchSessions() {
      const allGroups = [...createdGroups, ...joinedGroups]
      if (!allGroups.length) return setSessions([])
      let allSessions: any[] = []
      for (const group of allGroups) {
        const res = await fetch(`http://localhost:8000/api/groups/${group.id}/sessions/`, {
          headers: tokens?.access ? { 'Authorization': `Bearer ${tokens.access}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          allSessions = allSessions.concat(data.map((s: any) => ({ ...s, group })))
        }
      }
      // Safely filter out sessions with invalid date/time
      allSessions = allSessions.filter(s => s.date && s.time && !isNaN(new Date(s.date + 'T' + s.time).getTime()));
      // Sort sessions by date+time ascending
      allSessions.sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
      setSessions(allSessions)
    }
    if (createdGroups.length || joinedGroups.length) fetchSessions()
  }, [createdGroups, joinedGroups, tokens])

  // Only fetch recommendations after groups are loaded
  useEffect(() => {
    if (tokens?.access && !loadingGroups) {
      setLoadingRecommendations(true)
      fetch("http://localhost:8000/api/recommendations/", {
        headers: { "Authorization": `Bearer ${tokens.access}` },
      })
        .then(res => res.json())
        .then(data => {
          setRecommendations(data.recommendations || [])
          setLoadingRecommendations(false)
        })
        .catch(() => {
          setRecommendations([])
          setLoadingRecommendations(false)
        });
    } else if (!tokens?.access) {
      setLoadingRecommendations(false)
    }
  }, [tokens, loadingGroups]);

  const handleLeaveGroup = async (groupId: number, groupName: string) => {
    if (!window.confirm(`Are you sure you want to leave "${groupName}"?`)) return
    
    setLoadingActions(true)
    try {
      const res = await fetch(`http://localhost:8000/api/groups/${groupId}/leave/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`,
        },
      })
      
      if (res.ok) {
        // Remove from joined groups
        setJoinedGroups(prev => prev.filter(g => g.id !== groupId))
        toastSuccess({ title: 'Successfully left the group!' })
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

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone and will remove all group data, sessions, and files.`)) return
    
    setLoadingActions(true)
    try {
      const res = await fetch(`http://localhost:8000/api/groups/${groupId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
        },
      })
      
      if (res.ok) {
        // Remove from created groups
        setCreatedGroups(prev => prev.filter(g => g.id !== groupId))
        toastSuccess({ title: 'Group deleted successfully!' })
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

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "Online":
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
      case "Online":
        return "bg-blue-100 text-blue-800"
      case "In-person":
        return "bg-green-100 text-green-800"
      case "Hybrid":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loadingGroups) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#003366] mb-2">Welcome back!</h1>
            <p className="text-xl text-gray-600">Here's what's happening with your study groups</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="groups" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="groups">My Groups</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="recommended">Recommended</TabsTrigger>
                </TabsList>
                <TabsContent value="groups" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#003366]">My Study Groups</h2>
                    <Button className="bg-[#003366] hover:bg-[#002244] text-white opacity-70 cursor-default" disabled>
                      <Plus className="mr-2 h-4 w-4" />
                      Join More Groups
                    </Button>
                  </div>
                  <div className="space-y-6">
                    {/* Groups Created Skeleton */}
                    <div>
                      <button className="flex items-center gap-2 text-lg font-semibold text-[#003366] mb-4" disabled>
                        <ChevronDown className="h-5 w-5" />
                        Groups Created (0)
                      </button>
                      <div className="space-y-4">
                        {[...Array(1)].map((_, i) => (
                          <div key={i} className="relative bg-white rounded-lg shadow-lg border-l-4 border-l-[#003366] flex flex-col p-6 min-h-[220px]">
                            {/* Badge and crown */}
                            <div className="flex justify-between items-start mb-2">
                              <Skeleton className="h-8 w-32 rounded-full" /> {/* Badge */}
                              <Crown className="h-6 w-6 text-yellow-400" />
                            </div>
                            <Skeleton className="h-8 w-2/3 rounded mb-2" /> {/* Group name */}
                            <Skeleton className="h-4 w-24 rounded mb-4" /> {/* Members */}
                            <div className="flex items-center gap-2 mb-4">
                              <Clock className="h-5 w-5 text-gray-400" />
                              <Skeleton className="h-4 w-32 rounded" /> {/* Next session */}
                            </div>
                            <div className="flex gap-4 mt-auto">
                              <Skeleton className="h-12 w-40 rounded" />
                              <Skeleton className="h-12 w-40 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Groups Joined Skeleton */}
                    <div>
                      <button className="flex items-center gap-2 text-lg font-semibold text-[#003366] mb-4" disabled>
                        <ChevronDown className="h-5 w-5" />
                        Groups Joined (0)
                      </button>
                      <div className="space-y-4">
                        {[...Array(1)].map((_, i) => (
                          <div key={i} className="relative bg-white rounded-lg shadow-lg flex flex-col p-6 min-h-[220px]">
                            {/* Badge */}
                            <div className="flex justify-between items-start mb-2">
                              <Skeleton className="h-8 w-32 rounded-full" /> {/* Badge */}
                              <div className="w-6 h-6" /> {/* Empty space for alignment */}
                            </div>
                            <Skeleton className="h-8 w-2/3 rounded mb-2" /> {/* Group name */}
                            <Skeleton className="h-4 w-24 rounded mb-4" /> {/* Members */}
                            <div className="flex items-center gap-2 mb-4">
                              <Clock className="h-5 w-5 text-gray-400" />
                              <Skeleton className="h-4 w-32 rounded" /> {/* Next session */}
                            </div>
                            <div className="flex gap-4 mt-auto">
                              <Skeleton className="h-12 w-40 rounded" />
                              <Skeleton className="h-12 w-40 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            {/* Sidebar Skeleton */}
            <div className="flex flex-col gap-6">
              {/* Recent Notifications Skeleton */}
              <div className="bg-white rounded-lg shadow-lg border-0 w-full flex flex-col">
                <div className="px-6 pt-6 pb-2 flex items-center gap-2">
                  <Bell className="h-6 w-6" style={{ color: '#003366' }} />
                  <CardTitle className="font-bold text-2xl font-sans" style={{ color: '#003366' }}>Recent Notifications</CardTitle>
                </div>
                <div className="px-6 pb-4 flex flex-col gap-3 mt-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex flex-col gap-1 w-3/4">
                        <Skeleton className="h-4 w-32 rounded mb-1" /> {/* Message */}
                        <Skeleton className="h-4 w-20 rounded" /> {/* Badge */}
                      </div>
                      <Skeleton className="h-4 w-10 rounded" /> {/* Time */}
                    </div>
                  ))}
                  <Skeleton className="h-12 w-full rounded mt-2" /> {/* View All Notifications button */}
                </div>
              </div>
              {/* Quick Actions Skeleton */}
              <div className="bg-white rounded-lg shadow-lg border-0 w-full flex flex-col">
                <div className="px-6 pt-6 pb-2">
                  <CardTitle style={{ color: '#003366' }}>Quick Actions</CardTitle>
                </div>
                <div className="px-6 pb-4 flex flex-col gap-3 mt-2">
                  <Skeleton className="h-12 w-full rounded bg-[#003366] opacity-60" /> {/* Create Study Group button */}
                  <Skeleton className="h-12 w-full rounded" /> {/* Find Groups button */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#003366] mb-2">Welcome back!</h1>
          <p className="text-xl text-gray-600">Here's what's happening with your study groups</p>
        </div>

        {/* Remove Quick Stats section (the grid with Study Hours, Avg. Score Improvement, etc.) */}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="groups" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="groups">My Groups</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="recommended">Recommended</TabsTrigger>
              </TabsList>

              {/* My Groups Tab */}
              <TabsContent value="groups" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-[#003366]">My Study Groups</h2>
                  <Link href="/discover">
                    <Button className="bg-[#003366] hover:bg-[#002244] text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Join More Groups
                    </Button>
                  </Link>
                </div>

                <div className="space-y-6">
                  {/* Groups I Created - Always show this section first */}
                  <div>
                    <button
                      onClick={() => setShowCreatedGroups(!showCreatedGroups)}
                      className="flex items-center gap-2 text-lg font-semibold text-[#003366] mb-4 hover:text-[#002244] transition-colors"
                    >
                      {showCreatedGroups ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      Groups Created ({createdGroups.length})
                    </button>
                    
                    {showCreatedGroups && (
                      <div className="space-y-4">
                        {loadingGroups ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-4">Loading created groups...</p>
                          </div>
                        ) : createdGroups.length > 0 ? (
                          createdGroups.map((group: any) => (
                            <Card key={group.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-[#003366]">
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <Badge variant="outline" className="mb-2 text-[#003366] border-[#003366]">
                                      {group.subject_code}
                                    </Badge>
                                    <h3 className="text-lg font-semibold">{group.group_name}</h3>
                                    <p className="text-sm text-gray-600">{group.member_count || 0} members</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Crown className="h-5 w-5 text-yellow-400 -mt-0.5" />
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="mr-2 h-4 w-4" />
                                    Next session: {group.next_session || "TBA"}
                                  </div>
                                </div>

                                <div className="flex justify-between items-center mt-4">
                                  <Link href={`/group/${group.id}`}>
                                    <Button variant="outline">Manage Group</Button>
                                  </Link>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => handleDeleteGroup(group.id, group.group_name)}
                                    disabled={loadingActions}
                                  >
                                    {loadingActions ? 'Deleting...' : 'Delete Group'}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-4">You haven't created any groups yet.</p>
                            <Link href="/create-group">
                              <Button className="bg-[#003366] hover:bg-[#002244] text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Your First Group
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Groups I Joined */}
                  <div>
                    <button
                      onClick={() => setShowJoinedGroups(!showJoinedGroups)}
                      className="flex items-center gap-2 text-lg font-semibold text-[#003366] mb-4 hover:text-[#002244] transition-colors"
                    >
                      {showJoinedGroups ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      Groups Joined ({joinedGroups.length})
                    </button>
                    
                    {showJoinedGroups && (
                      <div className="space-y-4">
                        {loadingGroups ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-4">Loading joined groups...</p>
                          </div>
                        ) : joinedGroups.length > 0 ? (
                          joinedGroups.map((group: any) => (
                            <Card key={group.id} className="hover:shadow-lg transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <Badge variant="outline" className="mb-2 text-[#003366] border-[#003366]">
                                      {group.subject_code}
                                    </Badge>
                                    <h3 className="text-lg font-semibold">{group.group_name}</h3>
                                    <p className="text-sm text-gray-600">{group.member_count || 0} members</p>
                                  </div>
                                  <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
                                    {group.meeting_format || "Group"}
                                  </Badge>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="mr-2 h-4 w-4" />
                                    Next session: {group.next_session || "TBA"}
                                  </div>
                                </div>

                                <div className="flex justify-between items-center mt-4">
                                  <Link href={`/group/${group.id}`}>
                                    <Button variant="outline">View Group</Button>
                                  </Link>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => handleLeaveGroup(group.id, group.group_name)}
                                    disabled={loadingActions}
                                  >
                                    {loadingActions ? 'Leaving...' : 'Leave Group'}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-4">You haven't joined any groups yet.</p>
                            <Link href="/discover">
                              <Button className="bg-[#003366] hover:bg-[#002244] text-white">
                                <Users className="mr-2 h-4 w-4" />
                                Find Groups to Join
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* No groups message - only show if both sections are empty */}
                  
                </div>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-4">
                <h2 className="text-2xl font-bold text-[#003366]">Upcoming Sessions</h2>

                <div className="space-y-4">
                  {sessions.length === 0 && <div className="text-gray-600">No upcoming sessions.</div>}
                  {sessions.map((session, index) => (
                    <Card key={session.id || index}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{session.group.group_name}</h3>
                            <Badge variant="outline" className="mb-2 text-[#003366] border-[#003366]">
                              {session.group.subject_code}
                            </Badge>
                            <div className="space-y-2 mt-3">
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="mr-2 h-4 w-4" />
                                {format(new Date(session.date + 'T' + session.time), 'eeee, MMM d, yyyy h:mm a')}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="mr-2 h-4 w-4" />
                                {session.location}
                              </div>
                              {session.description && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <span className="mr-2">Description:</span>{session.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className={getFormatColor(session.group.meeting_format)}>{session.group.meeting_format}</Badge>
                            {/* Optionally add a Join button if session is live */}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Recommended Tab */}
              <TabsContent value="recommended" className="space-y-4">
                <h2 className="text-2xl font-bold text-[#003366]">Recommended for You</h2>

                <div className="space-y-4">
                  {loadingRecommendations ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">Loading recommended groups...</p>
                    </div>
                  ) : recommendations.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">No recommended groups found.</p>
                      <Link href="/discover">
                        <Button className="bg-[#003366] hover:bg-[#002244] text-white">
                          <Users className="mr-2 h-4 w-4" />
                          Find More Groups
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    recommendations.map((recommendation) => (
                      <Card key={recommendation.group.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <Badge variant="outline" className="mb-2 text-[#003366] border-[#003366]">
                                {recommendation.group.subject_code}
                              </Badge>
                              <h3 className="text-lg font-semibold">{recommendation.group.group_name}</h3>
                              <p className="text-sm text-gray-600">{recommendation.member_count} members</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                <span className="text-sm font-medium">{recommendation.match_percentage}% match</span>
                              </div>
                              <Badge className={getFormatColor(recommendation.group.meeting_format)}>{recommendation.group.meeting_format}</Badge>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-4">{recommendation.group.description}</p>

                          <div className="space-y-2 mb-4">
                            <div className="flex flex-wrap gap-1">
                              {recommendation.reasons.map((reason: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">{recommendation.group.year_level}</span>
                            <Link href={`/group/${recommendation.group.id}`}>
                              <Button className="bg-[#003366] hover:bg-[#002244] text-white font-serif">View Group</Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center" style={{ color: '#003366' }}>
                  <Bell className="mr-2 h-5 w-5" style={{ color: '#003366' }} />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {notification.group}
                          </Badge>
                          <span className="text-xs text-gray-500">{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  View All Notifications
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#003366' }}>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/create-group">
                  <Button className="w-full bg-[#003366] hover:bg-[#002244] text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Study Group
                  </Button>
                </Link>
                <Link href="/discover">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Users className="mr-2 h-4 w-4" />
                    Find Groups
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
