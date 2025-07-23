"use client"

import { useState, useEffect } from "react"
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
import { apiClient } from "@/lib/api"
import { ChartContainer } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { useRouter } from 'next/navigation'
import { useUser } from "@/components/UserContext"

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState<any>(null)
  const [userGrowth, setUserGrowth] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [popularSubjects, setPopularSubjects] = useState<any[]>([])
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolveActionText, setResolveActionText] = useState("")
  const [resolvingReport, setResolvingReport] = useState<any>(null)
  const router = useRouter();
  const [jumpLoading, setJumpLoading] = useState<number|null>(null)
  const { tokens } = useUser();

  useEffect(() => {
    apiClient.get("/stats/summary/").then(res => {
      if (res.data) setStats(res.data)
    })
    apiClient.get("/user-growth/").then(res => {
      if (res.data) setUserGrowth(res.data)
    })
    apiClient.get("/reports/").then(res => {
      if (res.data) setReports(res.data)
    })
    apiClient.get("/popular-subjects/").then(res => {
      if (res.data) setPopularSubjects(res.data)
    })
  }, [])

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

  const handleMarkResolved = (report: any) => {
    setResolvingReport(report)
    setResolveActionText("")
    setResolveDialogOpen(true)
  }
  const handleSubmitResolve = async () => {
    if (!resolvingReport || !resolveActionText.trim()) return
    setReports(prev => prev.map(r => r.id === resolvingReport.id ? { ...r, status: 'resolved', action_taken: resolveActionText } : r))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...resolvingReport, status: 'resolved', action_taken: resolveActionText })
      })
    } catch (e) {}
    setResolveDialogOpen(false)
    setResolvingReport(null)
    setResolveActionText("")
  }
  const handleMarkUnresolved = async (report: any) => {
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'open' } : r))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...report, status: 'open' })
      })
    } catch (e) {}
  }
  const handleJumpToIssue = async (report: any) => {
    setJumpLoading(report.id)
    try {
      if (report.type === 'file') {
        // Fetch file info to get group_id
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/files/${report.target_id}/`)
        if (res.ok) {
          const data = await res.json()
          const groupId = data.group_id
          // Navigate to group files tab (assuming tab param or hash)
          router.push(`/group/${groupId}?tab=files`)
        } else {
          alert('Could not find file info')
        }
      } else if (report.type === 'message') {
        // Fetch message info to get group_id
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/messages/${report.target_id}/`, {
          headers: {
            'Content-Type': 'application/json',
            ...(tokens?.access && { 'Authorization': `Bearer ${tokens.access}` })
          }
        })
        if (res.ok) {
          const data = await res.json()
          const groupId = data.group_id
          // Navigate to group chat
          router.push(`/group/${groupId}`)
        } else {
          alert('Could not find message info')
        }
      } else {
        alert('Jump to issue not supported for this type')
      }
    } catch (e) {
      alert('Error jumping to issue')
    }
    setJumpLoading(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between items-center h-6">
          {/* Header area now ultra compact */}
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
                  <p className="text-2xl font-bold text-[#003366]">{stats ? stats.active_students.toLocaleString() : "-"}</p>
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
                  <p className="text-2xl font-bold text-[#003366]">{stats ? stats.groups_created : "-"}</p>
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
                  <p className="text-2xl font-bold text-[#003366]">{stats ? stats.sessions_completed : "-"}</p>
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
                  <p className="text-2xl font-bold text-[#003366]">{reports.length}</p>
                </div>
                <Flag className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Users 24HRS</p>
                  <p className="text-2xl font-bold text-[#003366]">{stats ? stats.new_users_24hrs ?? "-" : "-"}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Groups 24HRS</p>
                  <p className="text-2xl font-bold text-[#003366]">{stats ? stats.new_groups_today ?? "-" : "-"}</p>
                </div>
                <Shield className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">Reports & Moderation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

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
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <div className="text-center text-gray-500">No reports found.</div>
                  ) : (
                    reports
                      .filter((report: any) => statusFilter === 'all' || report.status === statusFilter)
                      .map((report: any) => (
                        <div key={report.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold">{report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report (ID {report.target_id})</h3>
                                <Badge variant="outline" className="text-xs">
                                  {report.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">Reported by: {report.reporter_email}</p>
                              <p className="text-sm text-gray-600">Date: {new Date(report.created_at).toLocaleString()}</p>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <Badge className={getStatusColor(report.status)} style={{ pointerEvents: 'none' }}>{report.status}</Badge>
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="outline" onClick={() => handleJumpToIssue(report)} disabled={jumpLoading === report.id}>
                                  {jumpLoading === report.id ? 'Loading...' : 'Jump to Issue'}
                                </Button>
                                {report.status === 'resolved' ? (
                                  <Button size="sm" variant="destructive" onClick={() => handleMarkUnresolved(report)}>
                                    Mark Unresolved
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="default" onClick={() => handleMarkResolved(report)}>
                                    Mark Resolved
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center text-sm text-gray-700 mb-4 gap-x-2">
                            <span><strong>Reason:</strong> {report.reason}</span>
                            {report.status === 'resolved' && report.action_taken && (
                              <span className="text-red-700"><strong>Action Taken:</strong> {report.action_taken}</span>
                            )}
                          </div>
                        </div>
                      ))
                  )}
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
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="w-full md:w-2/3 h-64">
                      <ChartContainer config={{ users: { color: '#003366', label: 'Users' } }}>
                        <LineChart data={userGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} domain={[(dataMin: number) => Math.floor(dataMin * 0.95), (dataMax: number) => Math.ceil(dataMax * 1.05)]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="user_count" stroke="#003366" strokeWidth={2} dot={false} name="Users" />
                        </LineChart>
                      </ChartContainer>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-1/3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Users</span>
                        <span className="text-lg font-bold text-[#003366]">{userGrowth.length ? userGrowth[userGrowth.length-1].user_count.toLocaleString() : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">New Users 24HRS</span>
                        <span className="text-lg font-bold text-[#003366]">{userGrowth.length > 1 ? (userGrowth[userGrowth.length-1].user_count - userGrowth[userGrowth.length-2].user_count) : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Growth Rate (7d)</span>
                        <span className="text-lg font-bold text-[#003366]">{
                          userGrowth.length > 7
                            ? (
                                userGrowth[userGrowth.length-8].user_count === 0
                                  ? 'N/A'
                                  : (((userGrowth[userGrowth.length-1].user_count - userGrowth[userGrowth.length-8].user_count) / userGrowth[userGrowth.length-8].user_count * 100).toFixed(1) + '%')
                              )
                            : '-'
                        }</span>
                      </div>
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
                    {popularSubjects.length === 0 ? (
                      <div className="text-center text-gray-500">No data available.</div>
                    ) : (
                      popularSubjects.map((subject) => (
                        <div key={subject.subject_code} className="flex justify-between items-center">
                          <span className="text-sm">{subject.subject_code}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div className="bg-[#003366] h-2 rounded-full" style={{ width: `${Math.max(10, Math.min(100, (subject.group_count / popularSubjects[0].group_count) * 100))}%` }}></div>
                            </div>
                            <span className="text-sm text-gray-600">{subject.group_count} groups</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {resolveDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Mark Report as Resolved</h3>
            <p className="mb-2 text-sm text-gray-600">Please describe the action taken to resolve this issue:</p>
            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={3}
              value={resolveActionText}
              onChange={e => setResolveActionText(e.target.value)}
              placeholder="Action taken..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setResolveDialogOpen(false); setResolvingReport(null); setResolveActionText("") }}>Cancel</Button>
              <Button onClick={handleSubmitResolve} disabled={!resolveActionText.trim()}>Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
