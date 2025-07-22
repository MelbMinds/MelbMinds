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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Skeleton from "@/components/ui/Skeleton";
import CardSkeleton from "@/components/ui/CardSkeleton";
import { Label } from "@/components/ui/label";
import { getCachedApiData, setCachedApiData } from "@/lib/api";

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
  const [sort, setSort] = useState("newest")
  const [subjects, setSubjects] = useState<{ code: string; name: string; type: string }[]>([])
  const [subjectSearch, setSubjectSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const GROUPS_CACHE_KEY = "groups_cache_v1";
  const GROUPS_CACHE_AGE = 60000; // 1 minute

  useEffect(() => {
    // Try to load subjects from localStorage first
    const cached = localStorage.getItem('unimelb_subjects_cache');
    if (cached) {
      setSubjects(JSON.parse(cached));
    }
    fetch("/unimelb_subjects.json")
      .then(res => res.json())
      .then(data => {
        setSubjects(data);
        localStorage.setItem('unimelb_subjects_cache', JSON.stringify(data));
      });
  }, [])

  useEffect(() => {
    // Try to load cached groups first
    const cachedGroups = getCachedApiData<any[]>(GROUPS_CACHE_KEY, GROUPS_CACHE_AGE);
    if (cachedGroups) {
      setGroups(cachedGroups);
      setLoading(false);
    }
    // Always fetch fresh data in background
    fetchGroups(true);
    // eslint-disable-next-line
  }, []);

  const fetchGroups = async (background = false) => {
    if (!background) setLoading(true);
    setSearching(true);
    setError(null);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSubject && selectedSubject !== 'all') params.append('subject', selectedSubject);
      if (selectedYear && selectedYear !== 'all') params.append('year_level', selectedYear);
      if (selectedFormat && selectedFormat !== 'all') params.append('meeting_format', selectedFormat);
      if (selectedLanguage && selectedLanguage !== 'all') params.append('primary_language', selectedLanguage);
      if (personalityFilters.length > 0) params.append('personality_tags', personalityFilters.join(','));
      if (sort) params.append('sort', sort);

      const res = await fetch(`http://localhost:8000/api/groups/?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch groups");
      const data = await res.json();
      setGroups(data);
      setCachedApiData(GROUPS_CACHE_KEY, data);
    } catch (err) {
      setError("Could not load groups.");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchGroups();
    }, 300); // 300ms delay
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedSubject, selectedYear, selectedFormat, selectedLanguage, personalityFilters, sort])

  const yearLevels: string[] = ["1st Year", "2nd Year", "3rd Year", "Masters", "PhD"];
  const formats: string[] = ["Virtual", "In-person", "Hybrid"];
  const languages: string[] = ["English", "Mandarin", "Spanish", "Hindi", "Arabic"];
  const personalityOptions: string[] = [
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
    setSearchTerm("");
    setSelectedSubject("");
    setSelectedYear("");
    setSelectedFormat("");
    setSelectedLanguage("");
    setPersonalityFilters([]);
  };

  // Update all filter/search/sort change handlers to setLoading(true) immediately
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
  };
  const handleYearChange = (value: string) => {
    setSelectedYear(value);
  };
  const handleFormatChange = (value: string) => {
    setSelectedFormat(value);
  };
  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };
  const handlePersonalityChange = (personality: string) => {
    togglePersonalityFilter(personality);
  };
  const handleSortChange = (value: string) => {
    setSort(value);
  };

  return (
    <div className="min-h-screen bg-soft-gray">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-deep-blue mb-2">Discover Study Groups</h1>
          <p className="text-xl text-gray-600">Find your perfect study community at UniMelb</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar in Card Box */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg border-0 p-6 space-y-6">
              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search groups or subjects..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                  {searching && (
                    null
                  )}
                </div>
              </div>

              {/* Subject Filter */}
              <div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Type code or name..."
                    value={subjectSearch}
                    onChange={e => {
                      setSubjectSearch(e.target.value);
                      setDropdownOpen(true);
                    }}
                    autoComplete="off"
                    onBlur={() => {
                      setTimeout(() => setDropdownOpen(false), 100);
                      const match = subjects.find(s => s.code.toLowerCase() === subjectSearch.toLowerCase());
                      if (match) {
                        setSelectedSubject(match.code);
                        setSubjectSearch(`${match.code} – ${match.name}`);
                      }
                    }}
                  />
                  {subjectSearch && dropdownOpen && (
                    <div className="max-h-48 overflow-y-auto border rounded bg-white shadow z-10">
                      {subjects.filter(s =>
                        s.code.toLowerCase().includes(subjectSearch.toLowerCase()) ||
                        s.name.toLowerCase().includes(subjectSearch.toLowerCase())
                      ).slice(0, 10).map((s, idx) => (
                        <div
                          key={s.code ? `${s.code}-${s.name}` : idx}
                          className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                          onMouseDown={() => {
                            setSelectedSubject(s.code);
                            setSubjectSearch(`${s.code} – ${s.name}`);
                            setDropdownOpen(false);
                          }}
                        >
                          <span className="font-mono font-semibold">{s.code}</span> – {s.name}
                        </div>
                      ))}
                      {subjects.filter(s =>
                        s.code.toLowerCase().includes(subjectSearch.toLowerCase()) ||
                        s.name.toLowerCase().includes(subjectSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-400">No results</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Year Level Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Year Level</label>
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {yearLevels.map((year: string) => (
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
                <Select value={selectedFormat} onValueChange={handleFormatChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All formats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All formats</SelectItem>
                    {formats.map((format: string) => (
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
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All languages</SelectItem>
                    {languages.map((language: string) => (
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
                  {personalityOptions.map((personality: string) => (
                    <div key={personality} className="flex items-center space-x-2">
                      <Checkbox
                        id={personality}
                        checked={personalityFilters.includes(personality)}
                        onCheckedChange={() => handlePersonalityChange(personality)}
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
            </div>
          </div>
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {groups.length} study groups
              </p>
              <Select value={sort} onValueChange={handleSortChange}>
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
              {loading
                ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
                : groups.map((group) => (
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
            {/* Show empty state only when not loading and no groups */}
            {!loading && groups.length === 0 && (
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
