"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/shop";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!supabase || !email || !password) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : error.message);
      setLoading(false);
    } else {
      router.push(next);
    }
  };

  const handleReset = async () => {
    if (!supabase || !resetEmail) return;
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + "/shop/auth/reset",
    });
    setResetSent(true);
    setResetLoading(false);
  };

  if (showReset) return (
    <div className="w-full max-w-md">
      <div className="mb-10 text-center">
        <button onClick={() => { setShowReset(false); setResetSent(false); }}
          className="text-sm text-gray-400 hover:text-black mb-6 inline-block transition-colors">
          ← Back to Login
        </button>
        <h1 className="text-3xl font-black tracking-tighter">Reset Password</h1>
        <p className="text-gray-500 text-sm mt-2">Enter your email to receive a reset link</p>
      </div>
      {resetSent ? (
        <div className="text-center p-8 bg-green-50 border border-green-100 rounded-2xl">
          <div className="text-3xl mb-3">✉️</div>
          <p className="font-bold text-green-800">Reset link sent!</p>
          <p className="text-sm text-green-600 mt-1">Check your inbox at <strong>{resetEmail}</strong></p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Email</label>
            <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleReset()}
              className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black"
              placeholder="your@email.com" />
          </div>
          <button onClick={handleReset} disabled={resetLoading || !resetEmail}
            className="w-full bg-black text-white rounded-xl py-3 text-sm font-bold hover:bg-gray-900 transition-colors disabled:opacity-50">
            {resetLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 text-center">
        <Link href="/shop" className="text-sm text-gray-400 hover:text-black mb-6 inline-block transition-colors">
          ← Back to Shop
        </Link>
        <h1 className="text-3xl font-black tracking-tighter">Login</h1>
        <p className="text-gray-500 text-sm mt-2">Sign in to your account</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
            placeholder="your@email.com" autoComplete="email" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Password</label>
            <button onClick={() => { setShowReset(true); setResetEmail(email); }}
              className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest">
              Forgot?
            </button>
          </div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
            placeholder="••••••••" autoComplete="current-password" />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}
        <button onClick={handleLogin} disabled={loading || !email || !password}
          className="w-full bg-black text-white rounded-xl py-3 text-sm font-bold hover:bg-gray-900 transition-colors disabled:opacity-50 active:scale-[0.98]">
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <div className="text-center pt-4 space-y-2">
          <p className="text-sm text-gray-500">
            No account?{" "}
            <Link href="/shop/auth/register" className="font-bold text-black hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Suspense fallback={<div className="animate-pulse w-80 h-60 bg-gray-100 rounded-2xl" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
