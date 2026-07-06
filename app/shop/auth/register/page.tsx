"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Step = "account" | "profile" | "address" | "agree" | "done";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("account");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [displayId, setDisplayId] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalLoading, setPostalLoading] = useState(false);
  const [country, setCountry] = useState("Japan");
  const [agreed, setAgreed] = useState(false);

  const fetchAddress = async () => {
    if (postalCode.length < 7) return;
    setPostalLoading(true);
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
      const data = await res.json();
      if (data.results?.[0]) {
        setPrefecture(data.results[0].address1);
        setCity(data.results[0].address2 + data.results[0].address3);
      }
    } catch {}
    setPostalLoading(false);
  };

  const handleRegister = async () => {
    if (!supabase || !agreed) return;
    setLoading(true);
    setError("");
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/shop/auth/callback` },
    });
    if (signUpError) {
      const msg = signUpError.message;
      setError(msg.includes('already registered') || msg.includes('already been registered') || msg.includes('User already registered')
        ? 'This email is already registered. Please sign in instead.'
        : msg);
      setLoading(false); return;
    }
    if (data.user) {
      const finalDisplayId = displayId || `anon_${Math.random().toString(36).slice(2, 8)}`;
      await supabase.from("user_profiles").insert({
        id: data.user.id, display_id: finalDisplayId,
        last_name: lastName, first_name: firstName,
        postal_code: postalCode, prefecture, city,
        address_line1: addressLine1, address_line2: addressLine2, country,
        agreed_at: new Date().toISOString(),
      });
    }
    setStep("done");
    setLoading(false);
  };

  if (step === "done") return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">&#10003;</div>
        <h1 className="text-2xl font-black mb-4">Check your email</h1>
        <p className="text-gray-500 text-sm mb-8">
          We sent a confirmation link to <strong>{email}</strong>. Please click the link to verify your account.
        </p>
        <Link href="/shop" className="inline-block px-6 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-900 transition-colors">
          Back to Shop
        </Link>
      </div>
    </div>
  );

  const steps: Step[] = ["account", "profile", "address", "agree"];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <Link href="/shop/auth/login" className="text-sm text-gray-400 hover:text-black mb-6 inline-block">
            Already have an account? Sign in
          </Link>
          <h1 className="text-3xl font-black tracking-tighter">Create Account</h1>
          <div className="flex items-center justify-center gap-2 mt-6">
            {/* step indicator: account / profile / address / agree */}
            {steps.map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${
                step === s ? "w-8 bg-black" : steps.indexOf(step) > i ? "w-4 bg-black/30" : "w-4 bg-black/10"
              }`} />
            ))}
          </div>
        </div>

        {step === "account" && (
          <div className="space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-widest text-gray-500">Account Info</h2>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Password *</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" placeholder="8+ characters" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Confirm Password *</label>
              <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" placeholder="confirm password" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
            <button onClick={() => {
              if (password !== passwordConfirm) { setError("Passwords do not match"); return; }
              if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
              setError(""); setStep("profile");
            }} disabled={!email || !password || !passwordConfirm}
              className="w-full bg-black text-white rounded-xl py-3 text-sm font-bold hover:bg-gray-900 transition-colors disabled:opacity-50">Next</button>
          </div>
        )}

        {step === "profile" && (
          <div className="space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-widest text-gray-500">Profile</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Last Name *</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" placeholder="Yamada" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">First Name *</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" placeholder="Taro" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">User ID <span className="normal-case font-normal text-gray-400">(optional)</span></label>
              <div className="flex items-center border border-black/20 rounded-xl overflow-hidden focus-within:border-black">
                <span className="px-3 text-gray-400 text-sm">@</span>
                <input type="text" value={displayId} onChange={(e) => setDisplayId(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  className="flex-1 px-2 py-3 text-sm focus:outline-none" placeholder="rt18fan" />
              </div>
              <p className="text-xs text-gray-400 mt-1">If left blank, an anonymous ID will be assigned. Can be changed later.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep("account")} className="flex-1 border border-black/20 rounded-xl py-3 text-sm font-bold hover:border-black transition-colors">Back</button>
              <button onClick={() => setStep("address")} disabled={!lastName || !firstName}
                className="flex-1 bg-black text-white rounded-xl py-3 text-sm font-bold hover:bg-gray-900 transition-colors disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {step === "address" && (
          <div className="space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-widest text-gray-500">Address</h2>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Postal Code *</label>
              <div className="flex gap-2">
                <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 7))}
                  className="flex-1 border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" placeholder="1234567" maxLength={7} />
                <button onClick={fetchAddress} disabled={postalCode.length < 7 || postalLoading}
                  className="px-4 py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-900 transition-colors disabled:opacity-50">
                  {postalLoading ? "..." : "Search"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Prefecture *</label>
              <input type="text" value={prefecture} onChange={(e) => setPrefecture(e.target.value)}
                className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" placeholder="Tokyo" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">City / Town *</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" placeholder="Shibuya-ku" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Address Line 1 *</label>
              <input type="text" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" placeholder="1-2-3 Shinjuku" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Address Line 2 <span className="normal-case font-normal text-gray-400">(optional)</span></label>
              <input type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" placeholder="Room 101" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Country *</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-black/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-white">
                <option value="Japan">Japan</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="Canada">Canada</option>
                <option value="France">France</option>
                <option value="Germany">Germany</option>
                <option value="Italy">Italy</option>
                <option value="Spain">Spain</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Belgium">Belgium</option>
                <option value="Singapore">Singapore</option>
                <option value="China">China</option>
                <option value="South Korea">South Korea</option>
                <option value="Taiwan">Taiwan</option>
                <option value="Hong Kong">Hong Kong</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep("profile")} className="flex-1 border border-black/20 rounded-xl py-3 text-sm font-bold hover:border-black transition-colors">Back</button>
              <button onClick={() => setStep('agree')}
                className="flex-1 border border-black/20 rounded-xl py-3 text-sm font-bold text-gray-400 hover:border-black hover:text-black transition-colors">
                Skip (Digital only)
              </button>
              <button onClick={() => setStep("agree")} disabled={!postalCode || !prefecture || !city || !addressLine1}
                className="flex-1 bg-black text-white rounded-xl py-3 text-sm font-bold hover:bg-gray-900 transition-colors disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {step === "agree" && (
          <div className="space-y-6">
            <h2 className="font-bold text-sm uppercase tracking-widest text-gray-500">Privacy Policy</h2>
            <div className="border border-black/10 rounded-2xl p-5 h-48 overflow-y-auto text-xs text-gray-600 leading-relaxed space-y-3">
              <p className="font-bold text-black">Privacy Policy / Terms of Service</p>
              <p>This shop collects your personal information (name, email, address) for the purpose of processing orders and delivering products.</p>
              <p>Your information will not be shared with third parties except as necessary to fulfill your order.</p>
              <p>Your data is stored securely and you may request deletion at any time by contacting us.</p>
              <p>By creating an account, you agree to receive order confirmation and shipping notification emails.</p>
              <p>All purchases are final unless the product is defective or not as described.</p>
              <p>For digital products, refunds are not available after the content has been delivered.</p>
              <p>For physical products, please contact us within 7 days of receipt if there is an issue.</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-black" />
              <span className="text-sm text-gray-700">I have read and agree to the Privacy Policy and Terms of Service.</span>
            </label>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
            <div className="flex gap-3">
              <button onClick={() => setStep("address")} className="flex-1 border border-black/20 rounded-xl py-3 text-sm font-bold hover:border-black transition-colors">Back</button>
              <button onClick={handleRegister} disabled={!agreed || loading}
                className="flex-1 bg-black text-white rounded-xl py-3 text-sm font-bold hover:bg-gray-900 transition-colors disabled:opacity-50">
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}