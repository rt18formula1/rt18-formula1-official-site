"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  awaiting_payment: "bg-orange-100 text-orange-700",
  paid: "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  requested: "bg-yellow-100 text-yellow-700",
  reviewing: "bg-blue-100 text-blue-700",
  quoted: "bg-purple-100 text-purple-700",
  approved: "bg-green-100 text-green-700",
  agreement_sent: "bg-orange-100 text-orange-700",
  agreed: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  checking: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-600",
};

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "commissions" | "profile">("orders");

  useEffect(() => {
    const load = async () => {
      if (!supabase) { router.push("/shop/auth/login"); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/shop/auth/login"); return; }
      setUser(user);
      const [{ data: prof }, { data: ords }, { data: comms }] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("id", user.id).single(),
        supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("commissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (prof) setProfile(prof);
      if (ords) setOrders(ords);
      if (comms) setCommissions(comms);
      setLoading(false);
    };
    load();
  }, [router]);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/shop");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">My Page</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
          {profile?.display_id && <p className="text-xs text-gray-400 mt-0.5">@{profile.display_id}</p>}
        </div>
        <button onClick={handleSignOut}
          className="text-sm text-gray-400 hover:text-black border border-black/10 px-4 py-2 rounded-xl hover:border-black transition-colors">
          Sign Out
        </button>
      </div>

      <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
        {(["orders", "commissions", "profile"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"}`}>
            {t === "orders" ? `Orders (${orders.length})` : t === "commissions" ? `Commissions (${commissions.length})` : "Profile"}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div>
          {orders.length === 0 ? (
            <div className="text-center py-16 border border-black/10 rounded-2xl text-gray-400">
              <p className="font-bold mb-3">No orders yet</p>
              <Link href="/shop" className="text-sm underline hover:text-black">Browse Shop</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-black/10 rounded-2xl p-6 hover:border-black/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-black text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-2xl font-black">{String.fromCharCode(165)}{order.total_price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "commissions" && (
        <div>
          {commissions.length === 0 ? (
            <div className="text-center py-16 border border-black/10 rounded-2xl text-gray-400">
              <p className="font-bold mb-3">No commission requests yet</p>
              <Link href="/shop/commission" className="text-sm underline hover:text-black">Request a Commission</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {commissions.map((c) => (
                <div key={c.id} className="border border-black/10 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-black text-sm">#{c.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-600"}`}>
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{c.detail}</p>
                  <div className="flex gap-4 text-xs text-gray-400">
                    {c.budget && <span>Budget: {String.fromCharCode(165)}{c.budget.toLocaleString()}</span>}
                    {c.quoted_price && <span className="font-bold text-black">Quote: {String.fromCharCode(165)}{c.quoted_price.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6">
            <Link href="/shop/commission" className="inline-block border border-black rounded-xl px-6 py-3 text-sm font-bold hover:bg-black hover:text-white transition-colors">
              + New Request
            </Link>
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="space-y-4">
          <div className="border border-black/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-xs uppercase tracking-widest text-gray-400">Account</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs mb-1">User ID</p><p className="font-bold">@{profile?.display_id || "not set"}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">Email</p><p className="font-bold">{user?.email}</p></div>
              {(profile?.last_name || profile?.first_name) && (
                <div><p className="text-gray-400 text-xs mb-1">Name</p><p className="font-bold">{profile?.last_name} {profile?.first_name}</p></div>
              )}
            </div>
          </div>
          {profile?.address_line1 && (
            <div className="border border-black/10 rounded-2xl p-6 space-y-3">
              <h2 className="font-black text-xs uppercase tracking-widest text-gray-400">Shipping Address</h2>
              <div className="text-sm text-gray-600 space-y-0.5">
                {profile?.postal_code && <p>{profile.postal_code}</p>}
                <p>{profile?.prefecture} {profile?.city}</p>
                <p>{profile?.address_line1}</p>
                {profile?.address_line2 && <p>{profile.address_line2}</p>}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 text-center pt-2">
            To update your profile, contact us via the{" "}
            <Link href="/shop/inquiry" className="underline hover:text-black">inquiry form</Link>.
          </p>
        </div>
      )}
    </div>
  );
}