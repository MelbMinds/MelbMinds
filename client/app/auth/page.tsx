"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/components/UserContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Mail, Lock, User, Globe, Video, MapPin, UserCheck } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { PopupAlert } from "@/components/ui/popup-alert"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [year, setYear] = useState("")
  const [major, setMajor] = useState("")
  const [bio, setBio] = useState("")
  const [studyFormat, setStudyFormat] = useState("")
  const [languages, setLanguages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { setUser } = useUser()
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState("")

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
  const studyFormats = ["Virtual", "In-person", "1-on-1", "Mixed"]
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      // 1. Get JWT tokens
      const tokenRes = await fetch("http://localhost:8000/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      })
      if (!tokenRes.ok) {
        const data = await tokenRes.json()
        let errorMsg = data?.error || data?.detail || null;
        if (errorMsg) {
          if (errorMsg.toLowerCase().includes('invalid credentials')) {
            setError('Invalid email or password')
          } else if (errorMsg.toLowerCase().includes('not verified') || errorMsg.toLowerCase().includes('verify')) {
            setError('Please verify your email before logging in.')
          } else {
            setError(errorMsg)
          }
        } else {
          setError('Login failed')
        }
        setIsLoading(false)
        return
      }
      const tokens = await tokenRes.json() // { access, refresh }
      // 2. Get user info using access token
      const userRes = await fetch("http://localhost:8000/api/profile/", {
        headers: {
          "Authorization": `Bearer ${tokens.access}`,
        },
      })
      if (!userRes.ok) {
        // If profile fetch fails, still treat as successful login and redirect
        setIsLoading(false)
        router.push("/")
        return
      }
      const userData = await userRes.json()
      setUser(userData, tokens)
      setIsLoading(false)
      router.push("/")
    } catch (err) {
      setError("Network error. Please try again.")
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }
    try {
      const res = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          major,
          year_level: year,
          preferred_study_format: studyFormat,
          languages_spoken: languages.join(", "),
          bio,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
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
        toast({
          title: 'Registration Failed',
          description: errorMsg || "Registration failed",
          variant: 'destructive',
        })
        setError(errorMsg || "Registration failed")
        setIsLoading(false)
        return
      }
      // Registration successful, show toast and prompt user to check email
      toast({
        title: 'Almost there! 🎉',
        description: 'A verification email has been sent to your university email address. Please check your inbox and follow the link to verify your account.',
      })
      setIsLoading(false)
      setFullName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setYear("")
      setMajor("")
      setBio("")
      setStudyFormat("")
      setLanguages([])
      router.push('/check-email')
    } catch (err) {
      toast({
        title: 'Network Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      })
      setError("Network error. Please try again.")
      setIsLoading(false)
    }
  }

  const toggleLanguage = (language: string) => {
    setLanguages((prev) => (prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue to-deep-blue/80 flex items-center justify-center p-4">
      {/* Popup Alert */}
      <PopupAlert 
        message={error} 
        onClose={() => setError(null)} 
      />
      
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-white">
            <h1 className="text-4xl font-serif font-bold">MelbMinds</h1>
          </Link>
          <p className="text-blue-100 mt-2 text-lg">University of Melbourne Study Groups</p>
        </div>

        <Card className="shadow-2xl border-0">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="font-medium">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="font-medium">
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-serif text-deep-blue">Welcome Back</CardTitle>
                <CardDescription className="text-lg">Sign in to your MelbMinds account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-base font-medium">
                      University Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your.email@student.unimelb.edu.au"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-base font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-12 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <Label htmlFor="remember" className="text-sm">
                        Remember me
                      </Label>
                    </div>
                    <div className="text-right mt-2">
                      <button type="button" className="text-blue-600 hover:underline text-sm" onClick={() => setShowForgot(true)}>
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-deep-blue hover:bg-deep-blue/90 text-white h-12 text-base font-serif"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-serif text-deep-blue">Join MelbMinds</CardTitle>
                <CardDescription className="text-lg">
                  Create your account with your University of Melbourne email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-serif font-semibold text-deep-blue">Basic Information</h3>

                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-base font-medium">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="fullName"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-12 h-12 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-base font-medium">
                        University Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your.email@student.unimelb.edu.au"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 h-12 text-base"
                          required
                        />
                      </div>
                      <p className="text-sm text-gray-600">Must be a valid University of Melbourne email address</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="year" className="text-base font-medium">
                          Year Level
                        </Label>
                        <Select value={year} onValueChange={setYear} required>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {yearLevels.map((yearLevel) => (
                              <SelectItem key={yearLevel} value={yearLevel}>
                                {yearLevel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="major" className="text-base font-medium">
                          Major
                        </Label>
                        <Select value={major} onValueChange={setMajor} required>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select major" />
                          </SelectTrigger>
                          <SelectContent>
                            {majors.map((majorOption) => (
                              <SelectItem key={majorOption} value={majorOption}>
                                {majorOption}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Study Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-serif font-semibold text-deep-blue">Study Preferences</h3>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-base font-medium">
                        Personality-based Mini Bio
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="e.g., I'm a night owl, prefer quiet study sessions, love explaining concepts to others..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="text-base"
                        required
                      />
                      <p className="text-sm text-gray-600">Help others understand your study style and personality</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">Preferred Study Format</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {studyFormats.map((format) => (
                          <div
                            key={format}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              studyFormat === format
                                ? "border-deep-blue bg-deep-blue/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setStudyFormat(format)}
                          >
                            <div className="flex items-center space-x-3">
                              {format === "Virtual" && <Video className="h-5 w-5 text-sky-blue" />}
                              {format === "In-person" && <MapPin className="h-5 w-5 text-green-600" />}
                              {format === "1-on-1" && <UserCheck className="h-5 w-5 text-gold" />}
                              {format === "Mixed" && <Globe className="h-5 w-5 text-purple-600" />}
                              <span className="font-medium">{format}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">Languages Spoken</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableLanguages.map((language) => (
                          <Badge
                            key={language}
                            variant={languages.includes(language) ? "default" : "outline"}
                            className={`cursor-pointer transition-all ${
                              languages.includes(language) ? "bg-deep-blue text-white" : "hover:bg-gray-100"
                            }`}
                            onClick={() => toggleLanguage(language)}
                          >
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-serif font-semibold text-deep-blue">Security</h3>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-base font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a strong password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 h-12 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-base font-medium">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-12 h-12 text-base"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox id="terms" required />
                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms" className="text-deep-blue hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-deep-blue hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-deep-blue hover:bg-deep-blue/90 text-white h-12 text-base font-serif"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-sky-blue/10 rounded-lg border border-sky-blue/20">
                  <div className="flex items-start space-x-2">
                    <Mail className="h-5 w-5 text-sky-blue mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-deep-blue">Email Verification Required</p>
                      <p className="text-xs text-gray-700">
                        We'll send a verification link to your university email address to confirm your enrollment.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Forgot Password Modal/Form */}
        {showForgot && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowForgot(false)}>&times;</button>
              <h2 className="text-xl font-bold mb-4">Reset your password</h2>
              {forgotSuccess ? (
                <div className="text-green-600">If an account with that email exists, a password reset link has been sent.</div>
              ) : (
                <form onSubmit={async e => {
                  e.preventDefault()
                  setForgotLoading(true)
                  setForgotError("")
                  try {
                    const res = await fetch("http://localhost:8000/api/forgot-password/", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail })
                    })
                    setForgotSuccess(true)
                  } catch {
                    setForgotError("Something went wrong. Please try again.")
                  } finally {
                    setForgotLoading(false)
                  }
                }}>
                  <label className="block mb-2 text-sm font-medium">Email address</label>
                  <input type="email" className="w-full border rounded px-3 py-2 mb-4" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                  {forgotError && <div className="text-red-600 mb-2">{forgotError}</div>}
                  <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={forgotLoading}>{forgotLoading ? "Sending..." : "Send reset link"}</button>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-blue-100 text-sm">Only University of Melbourne students can join MelbMinds</p>
        </div>
      </div>
    </div>
  )
}
