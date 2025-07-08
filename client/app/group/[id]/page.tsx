"use client"

import { useState } from "react"
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
} from "lucide-react"
import Link from "next/link"

export default function StudyGroupPage({ params }: { params: { id: string } }) {
  const [message, setMessage] = useState("")
  const [hasRequested, setHasRequested] = useState(false)
  const [newFlashcard, setNewFlashcard] = useState({ front: "", back: "" })
  const [chatMessage, setChatMessage] = useState("")

  // Mock data - in real app, fetch based on params.id
  const group = {
    id: 1,
    subject: "COMP10001",
    name: "Python Programming Fundamentals",
    description:
      "A collaborative study group focused on mastering Python programming fundamentals. We cover weekly lectures, work through assignments together, and prepare for exams as a team. Perfect for beginners who want to build a strong foundation in programming.",
    members: 12,
    maxMembers: 15,
    format: "Hybrid",
    languages: ["English"],
    yearLevel: "1st Year",
    tags: ["Beginner-friendly", "Assignment help", "Exam prep"],
    personalityTags: ["Quiet", "Patient", "Collaborative"],
    schedule: "Tuesdays 6PM, Fridays 2PM",
    location: "Doug McDonell Building + Online",
    rating: 4.8,
    studyHours: 24,
    admin: {
      name: "Sarah Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      year: "3rd Year",
      major: "Computer Science",
      bio: "I'm a night owl who loves explaining concepts and helping others succeed!",
    },
    members_list: [
      { name: "Sarah Chen", avatar: "/placeholder.svg?height=32&width=32", role: "Admin", online: true },
      { name: "James Wilson", avatar: "/placeholder.svg?height=32&width=32", role: "Member", online: true },
      { name: "Priya Patel", avatar: "/placeholder.svg?height=32&width=32", role: "Member", online: false },
      { name: "Alex Kim", avatar: "/placeholder.svg?height=32&width=32", role: "Member", online: true },
      { name: "Emma Thompson", avatar: "/placeholder.svg?height=32&width=32", role: "Member", online: false },
      { name: "David Liu", avatar: "/placeholder.svg?height=32&width=32", role: "Member", online: true },
    ],
    chat_messages: [
      {
        id: 1,
        author: "Sarah Chen",
        time: "2:30 PM",
        message:
          "Hey everyone! Don't forget we have our session tonight at 6 PM. I've uploaded the practice problems to our files section.",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        id: 2,
        author: "James Wilson",
        time: "2:45 PM",
        message:
          "Thanks Sarah! Quick question about Assignment 2 - are we allowed to use external libraries for the data visualization part?",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        id: 3,
        author: "Alex Kim",
        time: "3:10 PM",
        message: "I think we can use matplotlib and pandas, but let me double-check the assignment specs.",
        avatar: "/placeholder.svg?height=32&width=32",
      },
    ],
    files: [
      { name: "Week 3 Lecture Notes.pdf", size: "2.4 MB", uploadedBy: "Sarah Chen", date: "Jan 15" },
      { name: "Assignment 2 Solutions.py", size: "15 KB", uploadedBy: "James Wilson", date: "Jan 14" },
      { name: "Python Cheat Sheet.pdf", size: "890 KB", uploadedBy: "Priya Patel", date: "Jan 12" },
      { name: "Practice Problems Set 1.docx", size: "1.2 MB", uploadedBy: "Sarah Chen", date: "Jan 10" },
    ],
    flashcards: [
      {
        id: 1,
        front: "What is a Python list?",
        back: "A mutable, ordered collection of items that can store different data types",
        createdBy: "Sarah Chen",
      },
      {
        id: 2,
        front: "How do you define a function in Python?",
        back: "Use the 'def' keyword followed by function name and parameters: def function_name(parameters):",
        createdBy: "James Wilson",
      },
      {
        id: 3,
        front: "What's the difference between '==' and 'is' in Python?",
        back: "'==' compares values, 'is' compares object identity (memory location)",
        createdBy: "Alex Kim",
      },
    ],
    upcoming_sessions: [
      {
        date: "Tuesday, Jan 16",
        time: "6:00 PM - 8:00 PM",
        topic: "Functions and Modules",
        location: "Doug McDonell Building, Room 234",
        type: "In-person + Virtual",
      },
      {
        date: "Friday, Jan 19",
        time: "2:00 PM - 4:00 PM",
        topic: "Assignment 2 Workshop",
        location: "Online (Zoom link will be shared)",
        type: "Virtual",
      },
      {
        date: "Tuesday, Jan 23",
        time: "6:00 PM - 8:00 PM",
        topic: "Data Structures Review",
        location: "Doug McDonell Building, Room 234",
        type: "In-person + Virtual",
      },
    ],
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

  const handleJoinRequest = () => {
    setHasRequested(true)
  }

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // Add message to chat
      setChatMessage("")
    }
  }

  const handleCreateFlashcard = () => {
    if (newFlashcard.front.trim() && newFlashcard.back.trim()) {
      // Add flashcard
      setNewFlashcard({ front: "", back: "" })
    }
  }

  return (
    <div className="min-h-screen bg-soft-gray">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-serif font-bold text-deep-blue">MelbMinds</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/discover">
                <Button variant="ghost" className="text-deep-blue hover:bg-soft-gray">
                  Back to Discover
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-deep-blue hover:bg-soft-gray">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Group Header */}
            <Card className="shadow-lg border-0 mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2 text-deep-blue border-deep-blue">
                      {group.subject}
                    </Badge>
                    <CardTitle className="text-2xl lg:text-3xl font-serif text-deep-blue mb-2">{group.name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        {group.members}/{group.maxMembers} members
                      </div>
                      <div className="flex items-center">
                        <Star className="mr-1 h-4 w-4 text-gold fill-current" />
                        {group.rating}
                      </div>
                      <Badge className={`${getFormatColor(group.format)} flex items-center gap-1 border`}>
                        {getFormatIcon(group.format)}
                        {group.format}
                      </Badge>
                      <span>{group.yearLevel}</span>
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
                      {group.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 mr-2">Group Personality:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {group.personalityTags.map((tag, index) => (
                        <Badge key={index} className="bg-gold/10 text-amber-700 border-gold/20">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-soft-gray rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={group.admin.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-deep-blue text-white font-serif">
                        {group.admin.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-deep-blue">{group.admin.name}</p>
                      <p className="text-sm text-gray-600">
                        Group Admin • {group.admin.major} • {group.admin.year}
                      </p>
                      <p className="text-xs text-gray-500 italic">{group.admin.bio}</p>
                    </div>
                  </div>

                  <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join Group
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Card className="shadow-lg border-0">
              <Tabs defaultValue="chat" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-5">
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
                      <Calendar className="h-4 w-4" />
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
                  <TabsContent value="chat" className="space-y-4">
                    <div className="h-96 overflow-y-auto space-y-4 p-4 bg-soft-gray rounded-lg">
                      {group.chat_messages.map((msg) => (
                        <div key={msg.id} className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-deep-blue text-white text-xs">
                              {msg.author
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-deep-blue text-sm">{msg.author}</span>
                              <span className="text-xs text-gray-500">{msg.time}</span>
                            </div>
                            <p className="text-sm text-gray-700 bg-white p-3 rounded-lg shadow-sm">{msg.message}</p>
                          </div>
                        </div>
                      ))}
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

                  {/* Files Tab */}
                  <TabsContent value="files" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-serif font-medium text-deep-blue">Shared Files</h3>
                      <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {group.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-8 w-8 text-deep-blue" />
                            <div>
                              <p className="font-medium text-deep-blue">{file.name}</p>
                              <p className="text-sm text-gray-600">
                                {file.size} • Uploaded by {file.uploadedBy} • {file.date}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="bg-transparent">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Flashcards Tab */}
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
                      {group.flashcards.map((card) => (
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

                  {/* Meetups Tab */}
                  <TabsContent value="meetups" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-serif font-medium text-deep-blue">Upcoming Sessions</h3>
                      <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Schedule Session
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {group.upcoming_sessions.map((session, index) => (
                        <div key={index} className="p-4 bg-white rounded-lg border">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-deep-blue text-lg">{session.topic}</h4>
                              <p className="text-gray-600">
                                {session.date} • {session.time}
                              </p>
                            </div>
                            <Badge
                              className={getFormatColor(session.type.includes("Virtual") ? "Virtual" : "In-person")}
                            >
                              {session.type}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mb-3">
                            <MapPin className="mr-2 h-4 w-4" />
                            {session.location}
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" className="bg-deep-blue hover:bg-deep-blue/90 text-white">
                              Join Session
                            </Button>
                            <Button size="sm" variant="outline" className="bg-transparent">
                              Add to Calendar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Members Tab */}
                  <TabsContent value="members" className="space-y-4">
                    <h3 className="text-lg font-serif font-medium text-deep-blue">Group Members ({group.members})</h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      {group.members_list.map((member, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="bg-deep-blue text-white">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {member.online && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-deep-blue">{member.name}</p>
                            <div className="flex items-center space-x-2">
                              <Badge variant={member.role === "Admin" ? "default" : "secondary"} className="text-xs">
                                {member.role}
                              </Badge>
                              {member.online && <span className="text-xs text-green-600">Online</span>}
                            </div>
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
                    <span className="text-sm font-medium">{group.languages.join(", ")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Admin */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="font-serif font-medium text-deep-blue">Contact Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Introduce yourself and explain why you'd like to join this study group..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                  <Button className="w-full bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Similar Groups */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="font-serif font-medium text-deep-blue">Similar Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-soft-gray rounded-lg">
                    <p className="font-medium text-sm text-deep-blue">Advanced Python Programming</p>
                    <p className="text-xs text-gray-600">COMP20008 • 8 members</p>
                  </div>
                  <div className="p-3 bg-soft-gray rounded-lg">
                    <p className="font-medium text-sm text-deep-blue">Data Structures & Algorithms</p>
                    <p className="text-xs text-gray-600">COMP20003 • 12 members</p>
                  </div>
                  <div className="p-3 bg-soft-gray rounded-lg">
                    <p className="font-medium text-sm text-deep-blue">Software Engineering</p>
                    <p className="text-xs text-gray-600">SWEN20003 • 15 members</p>
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
