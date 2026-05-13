"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!supabase) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else router.push("/shop/mypage");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <Link href="/shop" className="text-sm text-gray-400 hover:text-black mb-6 inline-block">Back to Shop</Link>
          <h1 className="text-3xl font-black tracking-tighter">Login</h1>
          <p className="text-gray-500 text-sm mt-2">Sign in to your account</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black"
              placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black"
              placeholder="password" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
          <button onClick={handleLogin} disabled={loading || !email || !password}
            className="w-full bg-black text-white rounded-xl py-3 text-sm font-bold hover:bg-gray-900 transition-colors disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">No account?{" "}
              <Link href="/shop/auth/register" className="font-bold text-black hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}