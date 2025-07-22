"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Mail,
  Calendar,
  BookOpen,
  Users,
  Star,
  Edit3,
  Save,
  X,
  MapPin,
  Video,
  Globe,
  Award,
  Target,
} from "lucide-react"
import Link from "next/link"
import { useUser } from "@/components/UserContext"
import { toast } from "@/components/ui/use-toast"
import { PopupAlert } from "@/components/ui/popup-alert"
import { apiClient } from "@/lib/api"
import Skeleton from "@/components/ui/Skeleton";

export default function ProfilePage() {
  const { tokens, setUser } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Try to load profile from localStorage first
    const cached = localStorage.getItem('profile_cache');
    if (cached) {
      setProfileData(JSON.parse(cached));
      setLoading(false);
    }
    async function fetchProfile() {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.get("/profile/")
        if (response.error) {
          setError(response.error)
        } else {
          setProfileData(response.data)
          localStorage.setItem('profile_cache', JSON.stringify(response.data));
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (tokens?.access) fetchProfile()
    else setLoading(false)
  }, [tokens])

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-deep-blue mb-2">My Profile</h1>
            <p className="text-xl text-gray-600">Manage your account and study preferences</p>
          </div>
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white rounded-lg shadow-lg border-0 w-full flex flex-col items-center p-6 mb-6">
                <Skeleton className="h-24 w-24 rounded-full mb-4" /> {/* Avatar */}
                <Skeleton className="h-8 w-32 rounded mb-2" /> {/* Name */}
                <Skeleton className="h-4 w-24 rounded mb-2" /> {/* Major/year */}
                <Skeleton className="h-4 w-20 rounded mb-4" /> {/* Member since */}
                <Button className="w-full bg-deep-blue text-white font-serif cursor-default opacity-70" disabled>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
              <div className="bg-white rounded-lg shadow-lg border-0 w-full flex flex-col">
                <div className="px-6 pt-6 pb-2">
                  <CardTitle className="font-serif font-medium text-deep-blue">Quick Stats</CardTitle>
                </div>
                <div className="px-6 pb-4 flex flex-col gap-0 mt-2">
                  <Skeleton className="h-4 w-3/4 rounded mb-2" />
                  <Skeleton className="h-4 w-2/3 rounded mb-2" />
                  <Skeleton className="h-4 w-1/2 rounded mb-2" />
                  <Skeleton className="h-4 w-2/3 rounded mb-2" />
                  <Skeleton className="h-4 w-1/3 rounded" />
                </div>
              </div>
            </div>
            {/* Main Content */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <Tabs value="profile">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="profile" disabled className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Profile Info
                  </TabsTrigger>
                  <TabsTrigger value="groups" disabled className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> My Groups
                  </TabsTrigger>
                  <TabsTrigger value="achievements" disabled className="flex items-center gap-2">
                    <Star className="h-4 w-4" /> Achievements
                  </TabsTrigger>
                  <TabsTrigger value="settings" disabled className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" /> Settings
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-serif text-deep-blue">Profile Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Skeleton className="h-8 w-1/2 rounded" />
                  <Skeleton className="h-8 w-2/3 rounded" />
                  <Skeleton className="h-8 w-1/3 rounded" />
                  <Skeleton className="h-8 w-1/2 rounded" />
                  <Skeleton className="h-8 w-1/4 rounded" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
  }

  if (!profileData) {
    return <div className="min-h-screen flex items-center justify-center">No profile data found.</div>
  }

  const userStats = {
    groupsJoined: 5,
    sessionsAttended: 42,
    studyHours: 156,
    averageRating: 4.8,
    helpfulVotes: 89,
    streakDays: 12,
  }

  const joinedGroups = [
    {
      id: 1,
      subject: "COMP10001",
      name: "Python Programming Fundamentals",
      role: "Member",
      joinedDate: "Jan 2024",
      status: "Active",
    },
    {
      id: 2,
      subject: "COMP20003",
      name: "Algorithms & Data Structures",
      role: "Admin",
      joinedDate: "Dec 2023",
      status: "Active",
    },
    {
      id: 3,
      subject: "MAST20004",
      name: "Probability Theory Masters",
      role: "Member",
      joinedDate: "Nov 2023",
      status: "Active",
    },
    {
      id: 4,
      subject: "COMP30024",
      name: "AI Project Collaboration",
      role: "Member",
      joinedDate: "Oct 2023",
      status: "Completed",
    },
  ]

  const achievements = [
    {
      title: "Study Streak Champion",
      description: "Maintained a 30-day study streak",
      icon: Target,
      earned: "Jan 2024",
      color: "text-gold",
    },
    {
      title: "Helpful Mentor",
      description: "Received 50+ helpful votes from peers",
      icon: Award,
      earned: "Dec 2023",
      color: "text-blue-600",
    },
    {
      title: "Group Leader",
      description: "Successfully led 3 study groups",
      icon: Users,
      earned: "Nov 2023",
      color: "text-green-600",
    },
    {
      title: "Early Adopter",
      description: "One of the first 100 MelbMinds users",
      icon: Star,
      earned: "Sep 2023",
      color: "text-purple-600",
    },
  ]

  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Masters", "PhD"]
  const majors = [
    "Computer Science",
    "Biomedical Science",
    "Law",
    "Medicine",
    "Engineering",
    "Business",
    "Arts",
    "Science",
    "Psychology",
    "Economics",
    "Architecture",
    "Education",
    "Fine Arts",
    "Music",
    "Other",
  ]
  const studyFormats = ["Virtual", "In-person", "Hybrid"]
  const availableLanguages = [
    "English",
    "Mandarin",
    "Spanish",
    "Hindi",
    "Arabic",
    "French",
    "German",
    "Japanese",
    "Korean",
  ]

  const handleSave = async () => {
    try {
      const response = await apiClient.put("/profile/", profileData)
      
      if (response.error) {
        setError(response.error)
        return
      }
      
      setProfileData(response.data)
      // Update the user context with the new data
      setUser(response.data, tokens)
      setIsEditing(false)
      setError(null)
    } catch (err: any) {
      console.error('Save error:', err)
      setError('Network error. Please try again.')
    }
  }

  const handleCancel = () => {
    // Reset to original data by refetching
    if (tokens?.access) {
      apiClient.get("/profile/")
        .then(response => {
          if (response.error) {
            setError(response.error)
          } else {
            setProfileData(response.data)
          }
        })
        .catch(err => setError(err.message))
    }
    setIsEditing(false)
  }

  const toggleLanguage = (language: string) => {
    setProfileData((prev: any) => {
      const currentLanguages = prev.languages || []
      const updatedLanguages = currentLanguages.includes(language)
        ? currentLanguages.filter((l: string) => l !== language)
        : [...currentLanguages, language]
      
      return {
        ...prev,
        languages: updatedLanguages,
      }
    })
  }

  return (
    <div className="min-h-screen bg-soft-gray">
      {/* Popup Alert */}
      <PopupAlert 
        message={error} 
        onClose={() => setError(null)} 
      />
      
      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-deep-blue mb-2">My Profile</h1>
          <p className="text-xl text-gray-600">Manage your account and study preferences</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 mb-6">
              <CardContent className="p-6 text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-deep-blue text-white text-2xl font-serif">
                    {profileData.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-serif font-semibold text-deep-blue mb-1">{profileData.name}</h2>
                <p className="text-gray-600 mb-2">
                  {profileData.major} • {profileData.year}
                </p>
                <p className="text-sm text-gray-500 mb-4">Member since {profileData.joinDate ? profileData.joinDate.slice(0, 10) : ''}</p>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full bg-deep-blue hover:bg-deep-blue/90 text-white font-serif"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  {isEditing ? "Cancel Edit" : "Edit Profile"}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="font-serif font-medium text-deep-blue">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Groups Joined</span>
                    <span className="font-semibold text-deep-blue">{profileData.groups_joined ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sessions Attended</span>
                    <span className="font-semibold text-deep-blue">{profileData.sessions_attended ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Study Hours</span>
                    <span className="font-semibold text-deep-blue">{profileData.study_hours ?? 0}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile Info</TabsTrigger>
                <TabsTrigger value="groups">My Groups</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Profile Info Tab */}
              <TabsContent value="profile">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="font-serif text-deep-blue">Profile Information</CardTitle>
                      {isEditing && (
                        <div className="flex space-x-2">
                          <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            <Save className="mr-1 h-4 w-4" />
                            Save
                          </Button>
                          <Button onClick={handleCancel} size="sm" variant="outline" className="bg-transparent">
                            <X className="mr-1 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          />
                        ) : (
                          <div className="flex items-center p-3 bg-soft-gray rounded-md">
                            <User className="mr-2 h-4 w-4 text-gray-500" />
                            <span>{profileData.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">University Email</Label>
                        <div className="flex items-center p-3 bg-gray-100 rounded-md">
                          <Mail className="mr-2 h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">{profileData.email}</span>
                        </div>
                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="year">Year Level</Label>
                        {isEditing ? (
                          <Select
                            value={profileData.year}
                            onValueChange={(value) => setProfileData({ ...profileData, year: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {yearLevels.map((year) => (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center p-3 bg-soft-gray rounded-md">
                            <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                            <span>{profileData.year || "Not specified"}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="major">Major</Label>
                        {isEditing ? (
                          <Select
                            value={profileData.major}
                            onValueChange={(value) => setProfileData({ ...profileData, major: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {majors.map((major) => (
                                <SelectItem key={major} value={major}>
                                  {major}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center p-3 bg-soft-gray rounded-md">
                            <BookOpen className="mr-2 h-4 w-4 text-gray-500" />
                            <span>{profileData.major}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio & Study Personality</Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          rows={4}
                          placeholder="Tell others about your study style and personality..."
                        />
                      ) : (
                        <div className="p-4 bg-soft-gray rounded-md">
                          <p className="text-gray-700">{profileData.bio}</p>
                        </div>
                      )}
                    </div>

                    {/* Study Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-serif font-medium text-deep-blue">Study Preferences</h3>

                      <div className="space-y-2">
                        <Label>Preferred Study Format</Label>
                        {isEditing ? (
                          <div className="grid grid-cols-3 gap-3">
                            {studyFormats.map((format) => (
                              <div
                                key={format}
                                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                  profileData.studyFormat === format
                                    ? "border-deep-blue bg-deep-blue/5"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                                onClick={() => setProfileData({ ...profileData, studyFormat: format })}
                              >
                                <div className="flex items-center justify-center space-x-2">
                                  {format === "Virtual" && <Video className="h-4 w-4 text-sky-blue" />}
                                  {format === "In-person" && <MapPin className="h-4 w-4 text-green-600" />}
                                  {format === "Hybrid" && <Users className="h-4 w-4 text-gold" />}
                                  <span className="text-sm font-medium">{format}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center p-3 bg-soft-gray rounded-md">
                            {profileData.studyFormat === "Virtual" && <Video className="mr-2 h-4 w-4 text-sky-blue" />}
                            {profileData.studyFormat === "In-person" && (
                              <MapPin className="mr-2 h-4 w-4 text-green-600" />
                            )}
                            {profileData.studyFormat === "Hybrid" && <Users className="mr-2 h-4 w-4 text-gold" />}
                            <span>{profileData.studyFormat || "Not specified"}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Languages Spoken</Label>
                        {isEditing ? (
                          <div className="flex flex-wrap gap-2">
                            {availableLanguages.map((language) => {
                              const currentLanguages = profileData.languages || []
                              const isSelected = currentLanguages.includes(language)
                              return (
                                <Badge
                                  key={language}
                                  variant={isSelected ? "default" : "outline"}
                                  className={`cursor-pointer transition-all ${
                                    isSelected
                                      ? "bg-deep-blue text-white"
                                      : "hover:bg-gray-100"
                                  }`}
                                  onClick={() => toggleLanguage(language)}
                                >
                                  {language}
                                </Badge>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center p-3 bg-soft-gray rounded-md">
                            <Globe className="mr-2 h-4 w-4 text-gray-500" />
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(profileData.languages) && profileData.languages.length > 0 ? (
                                profileData.languages.map((language: string) => (
                                  <Badge key={language} variant="secondary">
                                    {language}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-500">No languages specified</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* My Groups Tab */}
              <TabsContent value="groups">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="font-serif text-deep-blue">My Study Groups</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-8">
                      <h2 className="text-2xl font-bold mb-4">My Groups</h2>
                      {Array.isArray(profileData.joined_groups) && profileData.joined_groups.length > 0 ? (
                        <ul className="space-y-2">
                          {profileData.joined_groups.map((group: any) => (
                            <li key={group.id} className="p-4 bg-white rounded shadow border flex flex-col gap-1">
                              <span className="font-semibold text-deep-blue">{group.group_name}</span>
                              <span className="text-gray-700">Course: {group.course_name} ({group.subject_code})</span>
                              <span className="text-gray-500 text-sm">Admin: {group.creator_name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600">You haven't joined any groups yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Achievements Tab */}
              <TabsContent value="achievements">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="font-serif text-deep-blue">Achievements & Badges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {achievements.map((achievement, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 bg-soft-gray rounded-lg">
                          <div className={`p-3 rounded-full bg-white ${achievement.color}`}>
                            <achievement.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-deep-blue mb-1">{achievement.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                            <p className="text-xs text-gray-500">Earned {achievement.earned}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="font-serif text-deep-blue">Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-serif font-medium text-deep-blue">Privacy Settings</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-soft-gray rounded-lg">
                          <div>
                            <p className="font-medium">Profile Visibility</p>
                            <p className="text-sm text-gray-600">Who can see your profile information</p>
                          </div>
                          <Select defaultValue="members">
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="members">Group Members</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-soft-gray rounded-lg">
                          <div>
                            <p className="font-medium">Study Statistics</p>
                            <p className="text-sm text-gray-600">Show your study hours and session count</p>
                          </div>
                          <Select defaultValue="visible">
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="visible">Visible</SelectItem>
                              <SelectItem value="hidden">Hidden</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-serif font-medium text-deep-blue">Notification Settings</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-soft-gray rounded-lg">
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-600">Receive updates about your groups via email</p>
                          </div>
                          <Select defaultValue="important">
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Updates</SelectItem>
                              <SelectItem value="important">Important Only</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-soft-gray rounded-lg">
                          <div>
                            <p className="font-medium">Session Reminders</p>
                            <p className="text-sm text-gray-600">Get reminded before study sessions</p>
                          </div>
                          <Select defaultValue="30min">
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1hour">1 Hour Before</SelectItem>
                              <SelectItem value="30min">30 Min Before</SelectItem>
                              <SelectItem value="15min">15 Min Before</SelectItem>
                              <SelectItem value="none">No Reminders</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <div className="flex space-x-4">
                        <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">
                          Save Settings
                        </Button>
                        <Button variant="outline" className="bg-transparent">
                          Reset to Default
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
