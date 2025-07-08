"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Calendar, Bell, BookOpen, Clock, MapPin, Video, Plus, Settings, Star, TrendingUp } from "lucide-react"
import Link from "next/link"

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

  const joinedGroups = [
    {
      id: 1,
      subject: "COMP10001",
      name: "Python Programming Fundamentals",
      members: 12,
      nextSession: "Today, 6:00 PM",
      format: "Hybrid",
      progress: 75,
    },
    {
      id: 2,
      subject: "BIOL10004",
      name: "Biology Study Circle",
      members: 8,
      nextSession: "Tomorrow, 4:00 PM",
      format: "In-person",
      progress: 60,
    },
    {
      id: 3,
      subject: "LAWS10001",
      name: "Legal Foundations Group",
      members: 15,
      nextSession: "Sunday, 7:00 PM",
      format: "Online",
      progress: 40,
    },
  ]

  const recommendedGroups = [
    {
      id: 4,
      subject: "COMP30024",
      name: "AI Project Collaboration",
      members: 10,
      format: "In-person",
      match: 95,
      reason: "Based on your Computer Science major",
    },
    {
      id: 5,
      subject: "MAST20004",
      name: "Probability Theory Masters",
      members: 6,
      format: "Hybrid",
      match: 88,
      reason: "Popular with 3rd year students",
    },
    {
      id: 6,
      subject: "COMP20003",
      name: "Algorithms & Data Structures",
      members: 14,
      format: "Online",
      match: 82,
      reason: "Matches your study preferences",
    },
  ]

  const upcomingSessions = [
    {
      group: "Python Programming Fundamentals",
      subject: "COMP10001",
      time: "Today, 6:00 PM - 8:00 PM",
      location: "Doug McDonell Building + Online",
      type: "Hybrid",
    },
    {
      group: "Biology Study Circle",
      subject: "BIOL10004",
      time: "Tomorrow, 4:00 PM - 6:00 PM",
      location: "Bio21 Institute",
      type: "In-person",
    },
    {
      group: "Legal Foundations Group",
      subject: "LAWS10001",
      time: "Sunday, 7:00 PM - 9:00 PM",
      location: "Virtual Room",
      type: "Online",
    },
  ]

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-[#003366]" />
              <span className="text-2xl font-bold text-[#003366]">MelbMinds</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/discover">
                <Button variant="ghost" className="text-[#003366] hover:bg-blue-50">
                  Discover
                </Button>
              </Link>
              <Button variant="ghost" className="relative">
                <Bell className="h-5 w-5 text-[#003366]" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#003366] mb-2">Welcome back, John!</h1>
          <p className="text-xl text-gray-600">Here's what's happening with your study groups</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Groups Joined</p>
                  <p className="text-3xl font-bold text-[#003366]">{joinedGroups.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sessions This Week</p>
                  <p className="text-3xl font-bold text-[#003366]">5</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Study Hours</p>
                  <p className="text-3xl font-bold text-[#003366]">24</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Score Improvement</p>
                  <p className="text-3xl font-bold text-[#003366]">+18%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

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

                <div className="space-y-4">
                  {joinedGroups.map((group) => (
                    <Card key={group.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <Badge variant="outline" className="mb-2 text-[#003366] border-[#003366]">
                              {group.subject}
                            </Badge>
                            <h3 className="text-lg font-semibold">{group.name}</h3>
                            <p className="text-sm text-gray-600">{group.members} members</p>
                          </div>
                          <Badge className={`${getFormatColor(group.format)} flex items-center gap-1`}>
                            {getFormatIcon(group.format)}
                            {group.format}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="mr-2 h-4 w-4" />
                            Next session: {group.nextSession}
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{group.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[#003366] h-2 rounded-full"
                                style={{ width: `${group.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                          <Link href={`/group/${group.id}`}>
                            <Button variant="outline">View Group</Button>
                          </Link>
                          <Button className="bg-[#003366] hover:bg-[#002244] text-white">Join Session</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-4">
                <h2 className="text-2xl font-bold text-[#003366]">Upcoming Sessions</h2>

                <div className="space-y-4">
                  {upcomingSessions.map((session, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{session.group}</h3>
                            <Badge variant="outline" className="mb-2 text-[#003366] border-[#003366]">
                              {session.subject}
                            </Badge>
                            <div className="space-y-2 mt-3">
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="mr-2 h-4 w-4" />
                                {session.time}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="mr-2 h-4 w-4" />
                                {session.location}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className={getFormatColor(session.type)}>{session.type}</Badge>
                            <Button size="sm" className="bg-[#003366] hover:bg-[#002244] text-white">
                              Join
                            </Button>
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
                  {recommendedGroups.map((group) => (
                    <Card key={group.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <Badge variant="outline" className="mb-2 text-[#003366] border-[#003366]">
                              {group.subject}
                            </Badge>
                            <h3 className="text-lg font-semibold">{group.name}</h3>
                            <p className="text-sm text-gray-600">{group.members} members</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 mr-1" />
                              <span className="text-sm font-medium">{group.match}% match</span>
                            </div>
                            <Badge className={getFormatColor(group.format)}>{group.format}</Badge>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">{group.reason}</p>

                        <div className="flex justify-between items-center">
                          <Link href={`/group/${group.id}`}>
                            <Button variant="outline">Learn More</Button>
                          </Link>
                          <Button className="bg-[#003366] hover:bg-[#002244] text-white">Request to Join</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
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
                <CardTitle>Quick Actions</CardTitle>
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

            {/* Study Streak */}
            <Card>
              <CardHeader>
                <CardTitle>Study Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#003366] mb-2">7</div>
                  <p className="text-sm text-gray-600 mb-4">Days in a row</p>
                  <div className="flex justify-center space-x-1">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-[#003366] rounded-full"></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
