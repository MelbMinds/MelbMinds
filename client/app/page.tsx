"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Video, MapPin, UserCheck, Star, ArrowRight, Clock, Globe, Quote } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/components/UserContext"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { user } = useUser();
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/stats/summary/")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoadingStats(false);
      })
      .catch(() => setLoadingStats(false));
  }, []);

  const testimonials = [
    {
      name: "Sarah Chen",
      major: "Computer Science",
      year: "3rd Year",
      text: "MelbMinds helped me find the perfect study group for COMP30024. My grades improved by 15% and I made lifelong friends!",
      rating: 5,
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "James Wilson",
      major: "Biomedical Science",
      year: "2nd Year",
      text: "The collaborative flashcard feature is amazing. Our group created over 200 cards for biochemistry and we all aced the exam.",
      rating: 5,
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Priya Patel",
      major: "Law",
      year: "Masters",
      text: "As an international student, MelbMinds helped me connect with local students. The study groups made me feel at home.",
      rating: 5,
      avatar: "/placeholder.svg?height=60&width=60",
    },
  ]

  const features = [
    {
      icon: Video,
      title: "Virtual Study Rooms",
      description: "Join video calls with integrated chat, screen sharing, and collaborative whiteboards",
      color: "bg-sky-blue/10 text-sky-blue border-sky-blue/20",
    },
    {
      icon: MapPin,
      title: "Campus Meetups",
      description: "Organize in-person study sessions with built-in location sharing and scheduling",
      color: "bg-green-100 text-green-700 border-green-200",
    },
    {
      icon: UserCheck,
      title: "Smart Matching",
      description: "AI-powered matching based on personality, study habits, and academic goals",
      color: "bg-gold/10 text-amber-700 border-gold/20",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-deep-blue to-deep-blue/80 text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-serif font-bold mb-6 leading-tight">
                Study Smarter, <span className="text-sky-blue">Together</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100 leading-relaxed">
                Join thousands of University of Melbourne students in collaborative study groups. Built for UniMelb, by
                UniMelb students.
              </p>

              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-serif font-bold text-gold">
                    {loadingStats ? <span className="animate-pulse">...</span> : stats?.grade_improvement + "%"}
                  </div>
                  <div className="text-sm text-blue-100">Grade improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-serif font-bold text-gold">
                    {loadingStats ? <span className="animate-pulse">...</span> : stats?.active_students?.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-100">Active students</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/discover">
                  <Button
                    size="lg"
                    className="bg-white text-deep-blue hover:bg-gray-50 w-full sm:w-auto font-serif text-lg px-8"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Discover Groups
                  </Button>
                </Link>
                <Link href="/create-group">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-deep-blue w-full sm:w-auto bg-transparent font-serif text-lg px-8"
                  >
                    Create Group
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-serif font-medium mb-6">Live Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Clock className="mr-2 h-5 w-5" />
                      Active Study Sessions
                    </span>
                    <Badge variant="secondary" className="bg-gold text-deep-blue font-medium">
                      {loadingStats ? <span className="animate-pulse">...</span> : stats?.active_sessions}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Globe className="mr-2 h-5 w-5" />
                      Subject Areas
                    </span>
                    <Badge variant="secondary" className="bg-gold text-deep-blue font-medium">
                      {loadingStats ? <span className="animate-pulse">...</span> : stats?.subject_areas}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      New Groups Today
                    </span>
                    <Badge variant="secondary" className="bg-gold text-deep-blue font-medium">
                      {loadingStats ? <span className="animate-pulse">...</span> : stats?.new_groups_today}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-soft-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-serif font-bold text-deep-blue mb-4">
              Three Ways to Excel Together
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the study format that matches your learning style and schedule
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-8 text-center">
                  <div
                    className={`w-16 h-16 rounded-full ${feature.color} border-2 flex items-center justify-center mx-auto mb-6`}
                  >
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-deep-blue mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-serif font-bold text-deep-blue mb-4">Proven Results</h2>
            <p className="text-xl text-gray-600">Real impact on University of Melbourne students</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-serif font-bold text-deep-blue mb-2">
                {loadingStats ? <span className="animate-pulse">...</span> : stats?.grade_improvement + "%"}
              </div>
              <div className="text-lg font-medium text-gray-900 mb-1">Grade improvement reported</div>
              <div className="text-sm text-gray-600">Average increase of 12 points</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-serif font-bold text-deep-blue mb-2">
                {loadingStats ? <span className="animate-pulse">...</span> : stats?.unimelb_students?.toLocaleString()}
              </div>
              <div className="text-lg font-medium text-gray-900 mb-1">Active UniMelb students</div>
              <div className="text-sm text-gray-600">Across all faculties</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-serif font-bold text-deep-blue mb-2">
                {loadingStats ? <span className="animate-pulse">...</span> : stats?.groups_created?.toLocaleString()}
              </div>
              <div className="text-lg font-medium text-gray-900 mb-1">Study groups created</div>
              <div className="text-sm text-gray-600">This semester alone</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-serif font-bold text-deep-blue mb-2">
                {loadingStats ? <span className="animate-pulse">...</span> : stats?.sessions_completed?.toLocaleString()}
              </div>
              <div className="text-lg font-medium text-gray-900 mb-1">Study sessions completed</div>
              <div className="text-sm text-gray-600">Since launch</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-soft-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-serif font-bold text-deep-blue mb-4">Student Success Stories</h2>
            <p className="text-xl text-gray-600">Hear from your fellow UniMelb students</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <Quote className="h-8 w-8 text-gold mr-3" />
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-gold fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-deep-blue rounded-full flex items-center justify-center text-white font-serif font-bold mr-4">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="font-semibold text-deep-blue">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">
                        {testimonial.major} • {testimonial.year}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-deep-blue text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold mb-6">Ready to Transform Your Study Experience?</h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of University of Melbourne students who are already studying smarter, not harder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-deep-blue hover:bg-gray-50 font-serif text-lg px-8">
                Get Started - It's Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/discover">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-deep-blue bg-transparent font-serif text-lg px-8"
              >
                Browse Study Groups
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <h3 className="text-2xl font-serif font-bold">MelbMinds</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Connecting University of Melbourne students through collaborative learning.
              </p>
            </div>
            <div>
              <h4 className="font-serif font-semibold mb-4 text-lg">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/discover" className="hover:text-white transition-colors">
                    Discover Groups
                  </Link>
                </li>
                <li>
                  <Link href="/create-group" className="hover:text-white transition-colors">
                    Create Group
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif font-semibold mb-4 text-lg">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/guidelines" className="hover:text-white transition-colors">
                    Community Guidelines
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif font-semibold mb-4 text-lg">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 MelbMinds. Made for University of Melbourne students, by University of Melbourne students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
