"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/auth"), 2000);
      } else {
        setError(data.error || "Invalid or expired token.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Reset Your Password</h1>
        {success ? (
          <div className="text-green-600 text-center">Password reset! Redirecting to login...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 text-sm font-medium">New Password</label>
            <input type="password" className="w-full border rounded px-3 py-2 mb-4" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            <label className="block mb-2 text-sm font-medium">Confirm Password</label>
            <input type="password" className="w-full border rounded px-3 py-2 mb-4" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} />
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</button>
          </form>
        )}
      </div>
    </div>
  );
} 