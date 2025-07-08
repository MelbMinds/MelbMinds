"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, MapPin, Video, Clock, Filter, Search, Globe, Star } from "lucide-react"
import Link from "next/link"

export default function DiscoverPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedFormat, setSelectedFormat] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [personalityFilters, setPersonalityFilters] = useState<string[]>([])

  const studyGroups = [
    {
      id: 1,
      subject: "COMP10001",
      name: "Python Programming Fundamentals",
      members: 12,
      maxMembers: 15,
      format: "Hybrid",
      languages: ["English"],
      yearLevel: "1st Year",
      tags: ["Beginner-friendly", "Assignment help", "Exam prep"],
      personalityTags: ["Quiet", "Patient", "Collaborative"],
      description:
        "Weekly sessions covering Python basics, assignments, and exam preparation with collaborative coding.",
      schedule: "Tuesdays 6PM, Fridays 2PM",
      location: "Doug McDonell Building + Online",
      rating: 4.8,
      studyHours: 24,
    },
    {
      id: 2,
      subject: "BIOL10004",
      name: "Biology Study Circle",
      members: 8,
      maxMembers: 12,
      format: "In-person",
      languages: ["English", "Mandarin"],
      yearLevel: "1st Year",
      tags: ["International", "Lab help", "Domestic"],
      personalityTags: ["Talkative", "Visual learner", "Hands-on"],
      description: "Collaborative study group focusing on biology concepts and lab work with multilingual support.",
      schedule: "Wednesdays 4PM",
      location: "Bio21 Institute",
      rating: 4.9,
      studyHours: 18,
    },
    {
      id: 3,
      subject: "LAWS10001",
      name: "Legal Foundations Group",
      members: 15,
      maxMembers: 20,
      format: "Virtual",
      languages: ["English"],
      yearLevel: "1st Year",
      tags: ["Case studies", "Essay writing", "Exam-focused"],
      personalityTags: ["Analytical", "Discussion-focused", "Fast-paced"],
      description: "Discussion-based sessions on legal principles and case analysis with structured debates.",
      schedule: "Sundays 7PM",
      location: "Virtual Room",
      rating: 4.7,
      studyHours: 32,
    },
    {
      id: 4,
      subject: "MAST20004",
      name: "Probability Theory Masters",
      members: 6,
      maxMembers: 10,
      format: "Hybrid",
      languages: ["English"],
      yearLevel: "Masters",
      tags: ["Advanced", "Problem solving", "International"],
      personalityTags: ["Analytical", "Quiet", "Detail-oriented"],
      description: "Advanced probability theory discussions and problem-solving sessions for graduate students.",
      schedule: "Thursdays 5PM",
      location: "Peter Hall Building + Online",
      rating: 4.6,
      studyHours: 28,
    },
    {
      id: 5,
      subject: "PSYC10004",
      name: "Psychology Research Methods",
      members: 14,
      maxMembers: 18,
      format: "In-person",
      languages: ["English", "Spanish"],
      yearLevel: "1st Year",
      tags: ["Research-focused", "Statistics", "Group projects"],
      personalityTags: ["Collaborative", "Creative", "Patient"],
      description: "Hands-on approach to learning research methods with real data analysis and group projects.",
      schedule: "Mondays 2PM, Thursdays 11AM",
      location: "Redmond Barry Building",
      rating: 4.8,
      studyHours: 22,
    },
  ]

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

  const filteredGroups = studyGroups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = !selectedSubject || group.subject === selectedSubject
    const matchesYear = !selectedYear || group.yearLevel === selectedYear
    const matchesFormat = !selectedFormat || group.format === selectedFormat
    const matchesLanguage = !selectedLanguage || group.languages.includes(selectedLanguage)
    const matchesPersonality =
      personalityFilters.length === 0 || personalityFilters.some((filter) => group.personalityTags.includes(filter))

    return matchesSearch && matchesSubject && matchesYear && matchesFormat && matchesLanguage && matchesPersonality
  })

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
              <Link href="/dashboard">
                <Button variant="ghost" className="text-deep-blue hover:bg-soft-gray">
                  Dashboard
                </Button>
              </Link>
              <Link href="/create-group">
                <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">Create Group</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedSubject("")
                    setSelectedYear("")
                    setSelectedFormat("")
                    setSelectedLanguage("")
                    setPersonalityFilters([])
                  }}
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
                Showing {filteredGroups.length} of {studyGroups.length} study groups
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
              {filteredGroups.map((group) => (
                <Card
                  key={group.id}
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 text-deep-blue border-deep-blue">
                          {group.subject}
                        </Badge>
                        <CardTitle className="text-lg font-serif text-deep-blue">{group.name}</CardTitle>
                        <div className="flex items-center mt-2 space-x-4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-gold fill-current mr-1" />
                            <span className="text-sm font-medium">{group.rating}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-1" />
                            {group.studyHours}h studied
                          </div>
                        </div>
                      </div>
                      <Badge className={`${getFormatColor(group.format)} flex items-center gap-1 border`}>
                        {getFormatIcon(group.format)}
                        {group.format}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">{group.description}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="mr-2 h-4 w-4" />
                        {group.members}/{group.maxMembers} members
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="mr-2 h-4 w-4" />
                        {group.schedule}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="mr-2 h-4 w-4" />
                        {group.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="mr-2 h-4 w-4" />
                        {group.languages.join(", ")}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex flex-wrap gap-1">
                        {group.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {group.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{group.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.personalityTags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} className="text-xs bg-gold/10 text-amber-700 border-gold/20">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">{group.yearLevel}</span>
                      <Link href={`/group/${group.id}`}>
                        <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white font-serif">Join Group</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredGroups.length === 0 && (
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
