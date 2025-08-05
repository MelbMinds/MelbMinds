"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PrivacyPage() {
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

        {/* Privacy Policy Content */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-serif text-deep-blue text-center">
              Privacy Policy
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Effective Date: August 5th, 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <div className="space-y-6">
              <p className="text-gray-700 leading-relaxed">
                At MelbMinds, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
              </p>

              <div className="space-y-6">
                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">Information We Collect</h2>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Personal Information:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Name and University of Melbourne email address</li>
                    <li>Study preferences, year level, and declared major</li>
                    <li>Optional bio and profile information</li>
                    <li>Group participation and messaging activity</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">Usage Information:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Platform usage patterns and preferences</li>
                    <li>Session attendance and study group interactions</li>
                    <li>Files uploaded and flashcards created</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">How We Use Your Information</h2>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>To match you with relevant study groups and study partners</li>
                    <li>To provide personalized recommendations for groups and sessions</li>
                    <li>To facilitate communication between group members</li>
                    <li>To improve our platform and user experience</li>
                    <li>To ensure platform safety and enforce our Terms of Service</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">Information Sharing</h2>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <p className="text-green-800 font-semibold">
                      We do not sell, trade, or otherwise transfer your personal information to third parties.
                    </p>
                  </div>

                  <p className="text-gray-700 mb-3">We may share your information only in the following circumstances:</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>Within the Platform:</strong> Your name and study preferences are visible to other verified University of Melbourne students</li>
                    <li><strong>Service Providers:</strong> We use trusted third-party services (Vercel, Railway) to host our platform</li>
                    <li><strong>Legal Requirements:</strong> If required by law or to protect the rights and safety of our users</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">Data Security</h2>
                  <p className="text-gray-700 mb-3">We implement appropriate security measures to protect your information:</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Encrypted data transmission and storage</li>
                    <li>Secure authentication using JWT tokens</li>
                    <li>Regular security reviews and updates</li>
                    <li>University email verification for account creation</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">Your Rights and Choices</h2>
                  <p className="text-gray-700 mb-3">You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Access and update your personal information through your profile</li>
                    <li>Delete your account and associated data at any time</li>
                    <li>Control what information is shared in your profile</li>
                    <li>Request information about how your data is used</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">Data Retention</h2>
                  <p className="text-gray-700">
                    We retain your information for as long as your account is active or as needed to provide our services. If you delete your account, we will remove your personal information within 30 days, except where we are required to retain certain information for legal purposes.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">Cookies and Tracking</h2>
                  <p className="text-gray-700">
                    We use minimal tracking technologies, primarily for authentication and user session management. We do not use advertising cookies or share data with advertising networks.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">Changes to This Policy</h2>
                  <p className="text-gray-700">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our platform and updating the effective date.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-deep-blue mb-3">Contact Us</h2>
                  <p className="text-gray-700">
                    If you have any questions about this Privacy Policy or how we handle your information, please contact us at:{" "}
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
