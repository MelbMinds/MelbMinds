"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, MapPin, Video, Clock, Filter, Search, Globe, Star } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/components/UserContext"

export default function DiscoverPage() {
  const { user, tokens } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedFormat, setSelectedFormat] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [personalityFilters, setPersonalityFilters] = useState<string[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGroups = async () => {
    setSearching(true)
    setError(null)
    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedSubject && selectedSubject !== 'all') params.append('subject', selectedSubject)
      if (selectedYear && selectedYear !== 'all') params.append('year_level', selectedYear)
      if (selectedFormat && selectedFormat !== 'all') params.append('meeting_format', selectedFormat)
      if (selectedLanguage && selectedLanguage !== 'all') params.append('primary_language', selectedLanguage)
      if (personalityFilters.length > 0) params.append('personality_tags', personalityFilters.join(','))

      const res = await fetch(`http://localhost:8000/api/groups/?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch groups")
      const data = await res.json()
      setGroups(data)
    } catch (err) {
      setError("Could not load groups.")
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchGroups()
    }, 300) // 300ms delay

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedSubject, selectedYear, selectedFormat, selectedLanguage, personalityFilters])

  const subjects = ["COMP10001", "BIOL10004", "LAWS10001", "MAST20004", "PSYC10004"]
  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "Masters", "PhD"]
  const formats = ["Virtual", "In-person", "Hybrid"]
  const languages = ["English", "Mandarin", "Spanish", "Hindi", "Arabic"]
  const personalityOptions = [
    "Quiet",
    "Talkative",
    "Fast-paced",
    "Patient",
    "Collaborative",
    "Analytical",
    "Creative",
    "Visual learner",
    "Hands-on",
    "Discussion-focused",
    "Detail-oriented",
  ]

  const isGroupCreator = (group: any) => {
    return user && group.creator_email === user.email
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

  const togglePersonalityFilter = (personality: string) => {
    setPersonalityFilters((prev) =>
      prev.includes(personality) ? prev.filter((p) => p !== personality) : [...prev, personality],
    )
  }

  const clearAllFilters = () => {
    setSearchTerm("")
    setSelectedSubject("")
    setSelectedYear("")
    setSelectedFormat("")
    setSelectedLanguage("")
    setPersonalityFilters([])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray flex items-center justify-center">
        <h2 className="text-2xl font-serif font-bold text-deep-blue">Loading study groups...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-soft-gray flex items-center justify-center">
        <h2 className="text-2xl font-serif font-bold text-deep-blue">{error}</h2>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-soft-gray">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-deep-blue mb-2">Discover Study Groups</h1>
          <p className="text-xl text-gray-600">Find your perfect study community at UniMelb</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center font-serif text-deep-blue">
                  <Filter className="mr-2 h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search groups or subjects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {searching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-deep-blue"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Level Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Year Level</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All years</SelectItem>
                      {yearLevels.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Format Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Meeting Format</label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="All formats" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All formats</SelectItem>
                      {formats.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Language Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Language</label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="All languages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All languages</SelectItem>
                      {languages.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Personality Tags */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Personality Match</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {personalityOptions.map((personality) => (
                      <div key={personality} className="flex items-center space-x-2">
                        <Checkbox
                          id={personality}
                          checked={personalityFilters.includes(personality)}
                          onCheckedChange={() => togglePersonalityFilter(personality)}
                        />
                        <label htmlFor={personality} className="text-sm">
                          {personality}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Study Groups Grid */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {groups.length} study groups
              </p>
              <Select defaultValue="newest">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="members">Most members</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="subject">By subject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 text-deep-blue border-deep-blue">
                          {group.subject_code}
                        </Badge>
                        <CardTitle className="text-lg font-serif text-deep-blue">{group.group_name}</CardTitle>
                        <div className="flex items-center mt-2 space-x-4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium">
                              {group.average_rating ? `${group.average_rating.toFixed(1)} (${group.rating_count || 0})` : "No ratings"}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-1" />
                            {group.study_hours || 0}h studied
                          </div>
                        </div>
                      </div>
                      <Badge className={`${getFormatColor(group.meeting_format)} flex items-center gap-1 border`}>
                        {getFormatIcon(group.meeting_format)}
                        {group.meeting_format}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">{group.description}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="mr-2 h-4 w-4" />
                        {group.member_count || 0} members
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="mr-2 h-4 w-4" />
                        {group.meeting_schedule}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="mr-2 h-4 w-4" />
                        {group.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="mr-2 h-4 w-4" />
                        {group.primary_language}
                      </div>
                      {group.creator_name && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="mr-2 h-4 w-4" />
                          Created by: {group.creator_name}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex flex-wrap gap-1">
                        {(group.tags ? group.tags.split(',').map((t: string) => t.trim()) : []).slice(0, 2).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {group.tags && group.tags.split(',').map((t: string) => t.trim()).length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{group.tags.split(',').map((t: string) => t.trim()).length - 2}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(group.personality_tags) ? group.personality_tags : []).slice(0, 3).map((tag: string, index: number) => (
                          <Badge key={index} className="text-xs bg-gold/10 text-amber-700 border-gold/20">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">{group.year_level}</span>
                      {isGroupCreator(group) ? (
                        <Link href={`/group/${group.id}`}>
                          <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">View Your Group</Button>
                        </Link>
                      ) : (
                        <Link href={`/group/${group.id}`}>
                          <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">View Group</Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {groups.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-serif font-medium text-gray-900 mb-2">No study groups found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
                <Link href="/create-group">
                  <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">
                    Create a New Group
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
