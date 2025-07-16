"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("http://localhost:8000/api/auth/request-password-reset/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data?.error || "Failed to send reset email");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue to-deep-blue/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
          <CardTitle className="text-xl font-serif">Forgot Password?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="text-center text-gray-700">
              <p>We've sent a password reset link to your email address.</p>
              <p className="mt-2 text-sm">Please check your inbox and follow the link to reset your password.</p>
              <Button className="w-full bg-deep-blue hover:bg-deep-blue/90 mt-4" onClick={() => router.push("/auth")}>Back to Login</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-base font-medium">
                  University Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="your.email@student.unimelb.edu.au"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 text-base"
                    required
                  />
                </div>
              </div>
              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              <Button
                type="submit"
                className="w-full bg-deep-blue hover:bg-deep-blue/90 text-white h-12 text-base font-serif"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={() => router.push("/auth")}
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 