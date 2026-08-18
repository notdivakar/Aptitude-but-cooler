"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sword } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("That email or password isn't right.");
    else router.push("/dashboard");
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
          <h1 className="font-display font-bold text-lg text-ink mb-1">Welcome back</h1>
          <p className="text-mute text-sm mb-6">Sign in to keep your streak alive.</p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full py-3 rounded-xl border border-borderstrong text-ink text-sm font-semibold mb-4 hover:bg-surfacehi transition"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-border flex-1" />
            <span className="text-faint text-xs">or</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={handleCredentials} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surfacehi border border-border rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-violet"
            />
            <input
              type="password"
              placeholder="Password"
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-mute text-xs text-center mt-5">
            New here? <a href="/register" className="text-violet font-medium">Create an account</a>
          </p>
        </div>
      </div>
    </div>
  );
}
