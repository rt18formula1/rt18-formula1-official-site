"use client";

import { useCart } from "./cart-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMyProfile } from "@/lib/supabase-queries";
import { supabase } from "@/lib/supabaseClient";

export function CheckoutClient() {
  const { items, totalPrice, totalCount } = useCart();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [shipping, setShipping] = useState({
    lastName: "",
    firstName: "",
    postalCode: "",
    prefecture: "",
    city: "",
    address1: "",
    address2: "",
  });

  useEffect(() => {
    async function init() {
      if (!supabase) return;
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push("/shop/auth/login?next=/shop/checkout");
        return;
      }

      const profile = await getMyProfile();
      setUser(authUser);
      
      if (profile) {
        setShipping({
          lastName: profile.last_name || "",
          firstName: profile.first_name || "",
          postalCode: profile.postal_code || "",
          prefecture: profile.prefecture || "",
          city: profile.city || "",
          address1: profile.address_line1 || "",
          address2: profile.address_line2 || "",
        });
      }
      setLoading(false);
    }
    init();
  }, [router]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error("Checkout failed", err);
      alert("Failed to initiate checkout.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) return <div className="max-w-4xl mx-auto px-4 py-24 text-center font-bold">Loading checkout...</div>;

  if (items.length === 0) {
    router.push("/shop/cart");
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-black tracking-tighter mb-10">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left: Forms */}
        <div className="flex-1 space-y-12">
          {/* Shipping Info */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-black text-xs">1</div>
              <h2 className="text-xl font-black uppercase tracking-tight">Shipping Information</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
                <input
                  type="text"
                  value={shipping.lastName}
                  onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })}
                  className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold border border-black/5 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">First Name</label>
                <input
                  type="text"
                  value={shipping.firstName}
                  onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })}
                  className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold border border-black/5 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Postal Code</label>
                <input
                  type="text"
                  value={shipping.postalCode}
                  onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                  className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold border border-black/5 focus:bg-white transition-colors"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prefecture</label>
                <input
                  type="text"
                  value={shipping.prefecture}
                  onChange={(e) => setShipping({ ...shipping, prefecture: e.target.value })}
                  className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold border border-black/5 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">City</label>
              <input
                type="text"
                value={shipping.city}
                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold border border-black/5 focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address Line 1</label>
              <input
                type="text"
                value={shipping.address1}
                onChange={(e) => setShipping({ ...shipping, address1: e.target.value })}
                className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold border border-black/5 focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={shipping.address2}
                onChange={(e) => setShipping({ ...shipping, address2: e.target.value })}
                className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold border border-black/5 focus:bg-white transition-colors"
              />
            </div>
          </section>

          {/* Payment (Managed Payments) */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-black text-xs">2</div>
              <h2 className="text-xl font-black uppercase tracking-tight">Payment Method</h2>
            </div>
            
            <div className="p-8 border-2 border-black/10 rounded-3xl bg-gray-50 text-center">
              <p className="font-bold text-gray-400 mb-2">Secure Payment via Stripe Checkout</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Managed Payments Enabled</p>
            </div>
          </section>
        </div>

        {/* Right: Order Summary */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-black text-white rounded-[32px] p-8 shadow-2xl sticky top-8">
            <h2 className="text-xl font-black uppercase tracking-tight mb-8">Order Summary</h2>
            
            <div className="space-y-6 mb-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-sm leading-tight">{item.name_en}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-black text-sm">
                    ¥{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-8 border-t border-white/10 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                <span className="font-bold text-gray-200">¥{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Shipping</span>
                <span className="font-bold text-green-400">FREE</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="font-black text-lg uppercase tracking-tight">Total</span>
                <span className="font-black text-3xl">¥{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-5 bg-white text-black rounded-2xl font-black text-sm hover:bg-gray-100 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? "Redirecting..." : "Pay with Stripe"}
            </button>
            
            <p className="text-[10px] text-center text-gray-500 font-bold mt-6 uppercase tracking-widest">
              Secured by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
