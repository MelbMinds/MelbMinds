"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function TermsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-blue via-sky-blue/90 to-deep-blue">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Home
            </Button>
          </Link>
        </div>

        {/* Terms Content */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-serif text-deep-blue text-center">
              Terms of Service
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Effective Date: August 5th, 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <div className="space-y-6">
              <p className="text-gray-700 leading-relaxed">
                Welcome to MelbMinds ("we", "our", or "us"), a student-driven platform exclusively for current students of the University of Melbourne. These Terms of Service ("Terms") govern your use of the MelbMinds website and platform (the "Service").
              </p>
              
              <p className="text-gray-700 leading-relaxed">
                By accessing or using our Service, you agree to be bound by these Terms.
              </p>

              <div className="space-y-6">
                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">1. Eligibility</h2>
                  <p className="text-gray-700 mb-3">To use MelbMinds, you must:</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Be a currently enrolled University of Melbourne student</li>
                    <li>Register with your official UniMelb student email address</li>
                    <li>Be at least 18 years old</li>
                  </ul>
                  <p className="text-gray-700 mt-3">
                    We reserve the right to verify your eligibility and suspend accounts that do not meet these requirements.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">2. Your Account</h2>
                  <p className="text-gray-700 mb-3">You are responsible for maintaining the confidentiality of your account. You agree to:</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Provide accurate and complete registration information</li>
                    <li>Keep your password secure</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">3. User Conduct</h2>
                  <p className="text-gray-700 mb-3">By using MelbMinds, you agree to:</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Respect others and maintain a safe, inclusive environment</li>
                    <li>Not post or share content that is offensive, harassing, discriminatory, violent, sexually explicit, or otherwise inappropriate</li>
                    <li>Not use the platform for commercial purposes, spam, or solicitation</li>
                  </ul>
                  
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h3 className="font-semibold text-amber-800 mb-2">Strike-Based Moderation System:</h3>
                    <ul className="list-disc pl-6 space-y-1 text-amber-700">
                      <li>Each substantiated user report results in a strike</li>
                      <li>3 strikes may lead to account suspension or permanent ban</li>
                      <li>All reports are manually reviewed by our admin team</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">4. Content and Moderation</h2>
                  <p className="text-gray-700 mb-3">
                    You may upload content such as files, flashcards, messages, and session information. By submitting content:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>You retain ownership of your content</li>
                    <li>You grant MelbMinds a limited license to host, display, and share that content within the platform</li>
                    <li>We reserve the right to remove any content that violates these Terms, at our sole discretion</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">5. Privacy and Data</h2>
                  <p className="text-gray-700 mb-3">
                    We care about your privacy. By using the platform, you consent to the collection and use of the following information:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Name</li>
                    <li>University of Melbourne email</li>
                    <li>Study preferences and declared major</li>
                    <li>Group participation and activity</li>
                    <li>Optional bio or profile information</li>
                  </ul>
                  
                  <p className="text-gray-700 mt-4 mb-3">We use this data to:</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Match users to relevant study groups</li>
                    <li>Suggest connections and sessions based on preferences and course history</li>
                    <li>Improve your overall experience on the platform</li>
                  </ul>
                  
                  <p className="text-gray-700 mt-4 font-semibold">
                    We do not sell or share your data with third parties.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">6. Matching and Recommendations</h2>
                  <p className="text-gray-700 mb-3">MelbMinds uses internal algorithms to recommend:</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Study buddies</li>
                    <li>Subject-specific groups</li>
                    <li>Sessions and flashcards</li>
                  </ul>
                  <p className="text-gray-700 mt-3">
                    These are based on your prior activity, courses, study goals, and group preferences.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">7. Availability and Third-Party Services</h2>
                  <p className="text-gray-700">
                    MelbMinds is hosted on third-party infrastructure (e.g. Vercel and Railway). While we aim for high availability, we do not guarantee uninterrupted service. From time to time, the Service may be unavailable due to maintenance or issues beyond our control.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">8. Intellectual Property</h2>
                  <p className="text-gray-700">
                    All content, branding, and features on MelbMinds (excluding user-generated content) are the property of the creators of MelbMinds. You agree not to copy, distribute, or reverse-engineer any part of the Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">9. Termination</h2>
                  <p className="text-gray-700">
                    We reserve the right to suspend or terminate your account at any time if you violate these Terms or engage in behavior that compromises the integrity of the platform.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">10. Changes to Terms</h2>
                  <p className="text-gray-700">
                    We may update these Terms occasionally. If we make material changes, we'll notify you by posting on the platform or via email.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">11. Governing Law</h2>
                  <p className="text-gray-700">
                    These Terms are governed by the laws of the State of Victoria, Australia. Any disputes shall be resolved in the courts of Victoria.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">12. Contact</h2>
                  <p className="text-gray-700">Questions about these Terms?</p>
                  <p className="text-gray-700">
                    Contact us at:{" "}
                    <a 
                      href="mailto:melbminds@gmail.com" 
                      className="text-deep-blue hover:underline font-medium"
                    >
                      melbminds@gmail.com
                    </a>
                  </p>
                </section>
              </div>

              <div className="border-t pt-6 mt-8">
                <p className="text-center text-gray-600 text-sm">
                  Last updated: August 5th, 2025
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <Link href="/auth">
            <Button className="bg-deep-blue hover:bg-deep-blue/90 text-white">
              Back to Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
