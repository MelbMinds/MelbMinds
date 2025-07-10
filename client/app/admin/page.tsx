"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BookOpen,
  Users,
  Flag,
  Shield,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const pendingGroups = [
    {
      id: 1,
      name: "Advanced Machine Learning Study Group",
      subject: "COMP30027",
      creator: "Alex Chen",
      createdDate: "2024-01-15",
      members: 0,
      status: "pending",
      reason: "New group awaiting approval",
    },
    {
      id: 2,
      name: "Organic Chemistry Lab Help",
      subject: "CHEM20011",
      creator: "Sarah Wilson",
      createdDate: "2024-01-14",
      members: 0,
      status: "pending",
      reason: "New group awaiting approval",
    },
  ]

  const reportedContent = [
    {
      id: 1,
      type: "group",
      title: "Python Programming Fundamentals",
      subject: "COMP10001",
      reporter: "Anonymous",
      reason: "Inappropriate content in group chat",
      date: "2024-01-16",
      status: "open",
      severity: "medium",
    },
    {
      id: 2,
      type: "user",
      title: "User: john.doe@student.unimelb.edu.au",
      subject: "N/A",
      reporter: "Jane Smith",
      reason: "Harassment in study group",
      date: "2024-01-15",
      status: "investigating",
      severity: "high",
    },
    {
      id: 3,
      type: "message",
      title: "Message in Biology Study Circle",
      subject: "BIOL10004",
      reporter: "Anonymous",
      reason: "Spam/promotional content",
      date: "2024-01-14",
      status: "resolved",
      severity: "low",
    },
  ]

  const platformStats = {
    totalUsers: 5247,
    activeGroups: 342,
    totalSessions: 1856,
    reportsThisWeek: 12,
    newUsersThisWeek: 89,
    newGroupsThisWeek: 23,
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800"
      case "investigating":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleApproveGroup = (groupId: number) => {
    // Handle group approval
    console.log("Approving group:", groupId)
  }

  const handleRejectGroup = (groupId: number) => {
    // Handle group rejection
    console.log("Rejecting group:", groupId)
  }

  const handleResolveReport = (reportId: number) => {
    // Handle report resolution
    console.log("Resolving report:", reportId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-[#003366]" />
            <span className="text-2xl font-bold text-[#003366]">MelbMinds</span>
            <Badge variant="secondary" className="ml-2">
              Admin
            </Badge>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-[#003366] hover:bg-blue-50">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#003366] mb-2">Admin Panel</h1>
          <p className="text-xl text-gray-600">Manage groups, users, and platform moderation</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-[#003366]">{platformStats.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Groups</p>
                  <p className="text-2xl font-bold text-[#003366]">{platformStats.activeGroups}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-[#003366]">{platformStats.totalSessions.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reports This Week</p>
                  <p className="text-2xl font-bold text-[#003366]">{platformStats.reportsThisWeek}</p>
                </div>
                <Flag className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Users</p>
                  <p className="text-2xl font-bold text-[#003366]">{platformStats.newUsersThisWeek}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Groups</p>
                  <p className="text-2xl font-bold text-[#003366]">{platformStats.newGroupsThisWeek}</p>
                </div>
                <Shield className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="groups" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="groups">Group Management</TabsTrigger>
            <TabsTrigger value="reports">Reports & Moderation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Group Management Tab */}
          <TabsContent value="groups" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Pending Group Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingGroups.map((group) => (
                    <div key={group.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{group.name}</h3>
                          <Badge variant="outline" className="text-[#003366] border-[#003366] mb-2">
                            {group.subject}
                          </Badge>
                          <p className="text-sm text-gray-600">Created by: {group.creator}</p>
                          <p className="text-sm text-gray-600">Date: {group.createdDate}</p>
                        </div>
                        <Badge className={getStatusColor(group.status)}>{group.status}</Badge>
                      </div>

                      <p className="text-sm text-gray-700 mb-4">{group.reason}</p>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApproveGroup(group.id)}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejectGroup(group.id)}>
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="mr-1 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports & Moderation Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Flag className="mr-2 h-5 w-5" />
                    Content Reports
                  </CardTitle>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportedContent.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{report.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {report.type}
                            </Badge>
                          </div>
                          {report.subject !== "N/A" && (
                            <Badge variant="outline" className="text-[#003366] border-[#003366] mb-2">
                              {report.subject}
                            </Badge>
                          )}
                          <p className="text-sm text-gray-600">Reported by: {report.reporter}</p>
                          <p className="text-sm text-gray-600">Date: {report.date}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getSeverityColor(report.severity)}>{report.severity}</Badge>
                          <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-4">
                        <strong>Reason:</strong> {report.reason}
                      </p>

                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="mr-1 h-4 w-4" />
                          Investigate
                        </Button>
                        {report.status !== "resolved" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleResolveReport(report.id)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Resolve
                          </Button>
                        )}
                        <Button size="sm" variant="destructive">
                          <Trash2 className="mr-1 h-4 w-4" />
                          Take Action
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                      <p>User growth chart would be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Group Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto mb-4" />
                      <p>Group activity metrics would be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">COMP10001</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-[#003366] h-2 rounded-full" style={{ width: "85%" }}></div>
                        </div>
                        <span className="text-sm text-gray-600">42 groups</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">BIOL10004</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-[#003366] h-2 rounded-full" style={{ width: "70%" }}></div>
                        </div>
                        <span className="text-sm text-gray-600">35 groups</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">LAWS10001</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-[#003366] h-2 rounded-full" style={{ width: "60%" }}></div>
                        </div>
                        <span className="text-sm text-gray-600">28 groups</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">ECON10004</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-[#003366] h-2 rounded-full" style={{ width: "45%" }}></div>
                        </div>
                        <span className="text-sm text-gray-600">22 groups</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">System Status</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm font-medium">Pending Reports</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">8 Open</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">Active Sessions</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">247 Live</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
