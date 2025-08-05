import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PrivacyModalProps {
  children: React.ReactNode
}

export function PrivacyModal({ children }: PrivacyModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-deep-blue">
            Privacy Policy
          </DialogTitle>
          <DialogDescription>
            Effective Date: August 5th, 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <div className="flex justify-end mb-4">
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-deep-blue hover:underline"
              >
                View full page →
              </a>
            </div>
            <p className="text-gray-700 leading-relaxed">
              At MelbMinds, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
            </p>

            <div className="space-y-4">
              <section>
                <h3 className="text-lg font-semibold text-deep-blue mb-2">Information We Collect</h3>
                
                <h4 className="text-base font-semibold text-gray-800 mb-2">Personal Information:</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Name and University of Melbourne email address</li>
                  <li>Study preferences, year level, and declared major</li>
                  <li>Optional bio and profile information</li>
                  <li>Group participation and messaging activity</li>
                </ul>

                <h4 className="text-base font-semibold text-gray-800 mb-2 mt-3">Usage Information:</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Platform usage patterns and preferences</li>
                  <li>Session attendance and study group interactions</li>
                  <li>Files uploaded and flashcards created</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-deep-blue mb-2">How We Use Your Information</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>To match you with relevant study groups and study partners</li>
                  <li>To provide personalized recommendations for groups and sessions</li>
                  <li>To facilitate communication between group members</li>
                  <li>To improve our platform and user experience</li>
                  <li>To ensure platform safety and enforce our Terms of Service</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-deep-blue mb-2">Information Sharing</h3>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                  <p className="text-green-800 font-semibold text-sm">
                    We do not sell, trade, or otherwise transfer your personal information to third parties.
                  </p>
                </div>

                <p className="text-gray-700 mb-2">We may share your information only in the following circumstances:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li><strong>Within the Platform:</strong> Your name and study preferences are visible to other verified University of Melbourne students</li>
                  <li><strong>Service Providers:</strong> We use trusted third-party services (Vercel, Railway) to host our platform</li>
                  <li><strong>Legal Requirements:</strong> If required by law or to protect the rights and safety of our users</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-deep-blue mb-2">Data Security</h3>
                <p className="text-gray-700 mb-2">We implement appropriate security measures to protect your information:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Encrypted data transmission and storage</li>
                  <li>Secure authentication using JWT tokens</li>
                  <li>Regular security reviews and updates</li>
                  <li>University email verification for account creation</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-deep-blue mb-2">Your Rights and Choices</h3>
                <p className="text-gray-700 mb-2">You have the right to:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Access and update your personal information through your profile</li>
                  <li>Delete your account and associated data at any time</li>
                  <li>Control what information is shared in your profile</li>
                  <li>Request information about how your data is used</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-deep-blue mb-2">Data Retention</h3>
                <p className="text-gray-700">
                  We retain your information for as long as your account is active or as needed to provide our services. If you delete your account, we will remove your personal information within 30 days, except where we are required to retain certain information for legal purposes.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-deep-blue mb-2">Cookies and Tracking</h3>
                <p className="text-gray-700">
                  We use minimal tracking technologies, primarily for authentication and user session management. We do not use advertising cookies or share data with advertising networks.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-deep-blue mb-2">Changes to This Policy</h3>
                <p className="text-gray-700">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our platform and updating the effective date.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-deep-blue mb-2">Contact Us</h3>
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

            <div className="border-t pt-4 mt-6">
              <p className="text-center text-gray-600 text-xs">
                Last updated: August 5th, 2025
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
