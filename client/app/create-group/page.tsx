"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { PopupAlert } from "@/components/ui/popup-alert"
import { BookOpen, Users, MapPin, Video, Clock, Plus, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@/components/UserContext"
import { toastSuccess, toastFail } from "@/components/ui/use-toast"

export default function CreateGroupPage() {
  const { tokens } = useUser()
  const [groupName, setGroupName] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [maxMembers, setMaxMembers] = useState("")
  const [format, setFormat] = useState("")
  const [yearLevel, setYearLevel] = useState("")
  const [language, setLanguage] = useState("")
  const [location, setLocation] = useState("")
  const [schedule, setSchedule] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [courseName, setCourseName] = useState("")
  const [popupMessage, setPopupMessage] = useState<string | null>(null)
  const [targetHours, setTargetHours] = useState(10)
  const [targetHoursError, setTargetHoursError] = useState<string | null>(null)

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
  const [personalities, setPersonalities] = useState<string[]>([])
  const handlePersonalityChange = (personality: string) => {
    setPersonalities((prev) =>
      prev.includes(personality)
        ? prev.filter((p) => p !== personality)
        : [...prev, personality]
    )
  }

  const subjects = [
    "COMP10001",
    "COMP10002",
    "COMP20003",
    "COMP30024",
    "BIOL10004",
    "BIOL20001",
    "BIOL30001",
    "LAWS10001",
    "LAWS20001",
    "LAWS30001",
    "MAST20004",
    "MAST30001",
    "MAST30025",
    "ECON10004",
    "ECON20001",
    "ECON30020",
    "PSYC10003",
    "PSYC20006",
    "PSYC30013",
    "CHEM10003",
    "CHEM20011",
    "CHEM30002",
  ]

  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "Masters", "PhD", "Mixed"]
  const languages = ["English", "Mandarin", "Spanish", "Hindi", "Arabic", "Mixed"]
  const formats = ["Online", "In-person", "Hybrid"]

  const suggestedTags = [
    "Beginner-friendly",
    "Advanced",
    "Exam-focused",
    "Assignment help",
    "Project-based",
    "Discussion-heavy",
    "Problem-solving",
    "Lab work",
    "International",
    "Domestic",
    "Multilingual",
    "Weekend sessions",
    "Evening sessions",
    "Morning sessions",
    "Intensive",
    "Casual",
  ]

  const BAD_WORDS = ["badword1", "badword2", "badword3"] // Replace with your actual list
  const containsBadWord = (text: string) => BAD_WORDS.some(word => text.toLowerCase().includes(word))

  const addTag = (tag: string) => {
    if (!tag) return;
    if (containsBadWord(tag)) {
      setPopupMessage("You can't use bad words in tags!");
      setNewTag("");
      return;
    }
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setNewTag("");
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setTargetHoursError(null)
    try {
      if (!Number.isInteger(targetHours) || targetHours <= 0) {
        setTargetHoursError("Target hours must be a positive integer");
        setIsSubmitting(false);
        return;
      }
      const res = await fetch("http://localhost:8000/api/groups/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(tokens?.access && { "Authorization": `Bearer ${tokens.access}` })
        },
        body: JSON.stringify({
          group_name: groupName,
          subject_code: subject,
          course_name: courseName,
          description,
          year_level: yearLevel,
          meeting_format: format,
          primary_language: language,
          meeting_schedule: schedule,
          location,
          tags: tags.join(", "),
          group_guidelines: "Respectful, Attendance, Academic Integrity, Moderation", // or collect from checkboxes
          group_personality: personalities.join(", "),
          target_study_hours: targetHours,
        }),
      })
      if (!res.ok) {
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
        setError(errorMsg || "Failed to create group")
        if (errorMsg) {
          toastFail({ title: 'Group Creation Error', description: errorMsg })
        }
        setIsSubmitting(false)
        return
      }
      setIsSubmitting(false)
      toastSuccess({
        title: "Group created!",
        description: "Your study group was created successfully.",
      });
      setTimeout(() => {
        router.push("/discover");
      }, 1200);
    } catch (err) {
      setError("Network error. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Popup Alert */}
      <PopupAlert 
        message={error} 
        onClose={() => setError(null)} 
      />
      <PopupAlert message={popupMessage} onClose={() => setPopupMessage(null)} />
      
      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#003366] mb-2">Create a Study Group</h1>
          <p className="text-xl text-gray-600">Start your own collaborative learning community</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name *</Label>
                    <Input
                      id="groupName"
                      placeholder="e.g., Python Programming Fundamentals"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject Code *</Label>
                    <Select value={subject} onValueChange={setSubject} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subj) => (
                          <SelectItem key={subj} value={subj}>
                            {subj}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="courseName">Course Name *</Label>
                    <Input
                      id="courseName"
                      placeholder="e.g., Introduction to Programming"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your study group's goals, approach, and what members can expect..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Group Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Group Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxMembers">Maximum Members *</Label>
                      <Input
                        id="maxMembers"
                        type="number"
                        placeholder="15"
                        min="2"
                        max="50"
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yearLevel">Year Level *</Label>
                      <Select value={yearLevel} onValueChange={setYearLevel} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year level" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearLevels.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="format">Meeting Format *</Label>
                      <Select value={format} onValueChange={setFormat} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {formats.map((fmt) => (
                            <SelectItem key={fmt} value={fmt}>
                              {fmt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Primary Language *</Label>
                      <Select value={language} onValueChange={setLanguage} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang} value={lang}>
                              {lang}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule & Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule & Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule">Meeting Schedule *</Label>
                    <Input
                      id="schedule"
                      placeholder="e.g., Tuesdays 6PM, Fridays 2PM"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Doug McDonell Building + Online"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Add Custom Tag</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter a tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag(newTag))}
                      />
                      <Button type="button" onClick={() => addTag(newTag)} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Suggested Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.map((tag) => (
                        <Button
                          key={tag}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTag(tag)}
                          disabled={tags.includes(tag)}
                          className="text-xs"
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {tags.length > 0 && (
                    <div>
                      <Label className="mb-3 block">Selected Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeTag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Group Personality */}
              <Card>
                <CardHeader>
                  <CardTitle>Group Personality</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-4">
                    {personalityOptions.map((personality) => (
                      <label key={personality} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={personalities.includes(personality)}
                          onCheckedChange={() => handlePersonalityChange(personality)}
                        />
                        <span className="text-sm">{personality}</span>
                      </label>
                    ))}
                  </div>
                  {personalities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {personalities.map((p) => (
                        <Badge key={p} className="bg-gold/10 text-amber-700 border-gold/20 text-xs">{p}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Target Study Hours */}
              <Card>
                <CardHeader>
                  <CardTitle>Target Study Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor="targetHours">Target Study Hours *</Label>
                    <Input
                      id="targetHours"
                      type="number"
                      min={1}
                      value={targetHours}
                      onChange={e => setTargetHours(Number(e.target.value))}
                      required
                    />
                    {targetHoursError && <span className="text-xs text-red-500">{targetHoursError}</span>}
                  </div>
                </CardContent>
              </Card>

              {/* Group Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle>Group Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox id="respectful" required />
                      <Label htmlFor="respectful" className="text-sm leading-relaxed">
                        I will ensure all group members are treated with respect and maintain a positive learning
                        environment
                      </Label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox id="attendance" required />
                      <Label htmlFor="attendance" className="text-sm leading-relaxed">
                        I will encourage regular attendance and notify members of any schedule changes
                      </Label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox id="academic" required />
                      <Label htmlFor="academic" className="text-sm leading-relaxed">
                        I understand this group is for academic collaboration and will follow University of Melbourne's
                        academic integrity policies
                      </Label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox id="moderation" required />
                      <Label htmlFor="moderation" className="text-sm leading-relaxed">
                        I agree to moderate the group responsibly and report any inappropriate behavior
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Submit Button aligned with main form */}
              <Button
                type="submit"
                className="w-full bg-[#003366] hover:bg-[#002244] text-white mt-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Group..." : "Create Study Group"}
              </Button>
            </div>
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Group Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subject && (
                      <Badge variant="outline" className="text-[#003366] border-[#003366]">
                        {subject}
                      </Badge>
                    )}

                    {groupName && <h3 className="font-semibold text-lg">{groupName}</h3>}

                    {description && <p className="text-sm text-gray-600 line-clamp-3">{description}</p>}

                    <div className="space-y-2">
                      {maxMembers && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="mr-2 h-4 w-4" />
                          Max {maxMembers} members
                        </div>
                      )}

                      {schedule && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="mr-2 h-4 w-4" />
                          {schedule}
                        </div>
                      )}

                      {location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="mr-2 h-4 w-4" />
                          {location}
                        </div>
                      )}
                    </div>

                    {format && (
                      <Badge
                        className={
                          format === "Online"
                            ? "bg-blue-100 text-blue-800"
                            : format === "In-person"
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                        }
                      >
                        {format === "Online" && <Video className="mr-1 h-3 w-3" />}
                        {format === "In-person" && <MapPin className="mr-1 h-3 w-3" />}
                        {format === "Hybrid" && <Users className="mr-1 h-3 w-3" />}
                        {format}
                      </Badge>
                    )}

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Tips for Success</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-gray-600">
                    <li>• Be specific about your group's focus and goals</li>
                    <li>• Set clear expectations for attendance and participation</li>
                    <li>• Choose a consistent meeting schedule</li>
                    <li>• Use descriptive tags to help students find your group</li>
                    <li>• Start with a smaller group size and expand if needed</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
