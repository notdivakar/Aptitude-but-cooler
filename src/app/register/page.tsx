"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sword } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || password.length < 8) {
      setError("Fill in your name, email, and an 8+ character password.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Couldn't create that account.");
      setLoading(false);
      return;
    }
    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      router.push("/login");
    } else {
      // TODO(Phase 3): route to the diagnostic-quiz onboarding flow (spec Section 34)
      // instead of straight to the dashboard.
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet to-gold flex items-center justify-center">
            <Sword size={18} className="text-bg" strokeWidth={2.5} />
          </div>
          <span className="font-display font-extrabold text-xl text-ink">AptiQuest</span>
        </div>

        <div className="bg-surface border border-border rounded-card p-7">
          <h1 className="font-display font-bold text-lg text-ink mb-1">Create your account</h1>
          <p className="text-mute text-sm mb-6">Start your first streak today.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surfacehi border border-border rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-violet"
            />
            <input
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surfacehi border border-border rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-violet"
            />
            <input
              type="password"
              placeholder="Password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surfacehi border border-border rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-violet"
            />
            {error && <p className="text-bad text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-br from-violet to-violet-dim text-white font-semibold text-sm rounded-xl py-3 mt-1 disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-mute text-xs text-center mt-5">
            Already have an account? <a href="/login" className="text-violet font-medium">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
