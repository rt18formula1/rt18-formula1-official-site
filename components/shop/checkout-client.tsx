"use client";
import { useCart } from "./cart-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMyProfile } from "@/lib/supabase-queries";
import { supabase } from "@/lib/supabaseClient";

export function CheckoutClient() {
  const { items, totalPrice } = useCart();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [postalLoading, setPostalLoading] = useState(false);
  const router = useRouter();

  const [shipping, setShipping] = useState({
    lastName: "",
    firstName: "",
    postalCode: "",
    prefecture: "",
    city: "",
    address1: "",
    address2: "",
    country: "Japan",
  });

  // All items digital/skill -> no physical shipping needed
  const isAllDigital = items.every(i => i.type === "digital" || i.type === "skill");

  const requiredFields = isAllDigital
    ? []
    : [shipping.lastName, shipping.firstName, shipping.postalCode, shipping.prefecture, shipping.city, shipping.address1];

  const canCheckout = requiredFields.every(v => v.trim().length > 0) && items.length > 0 && !loading;

  useEffect(() => {
    async function init() {
      if (!supabase) {
        setCheckoutError("Shop authentication is not configured in this environment.");
        setLoading(false);
        return;
      }
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
          country: profile.country || "Japan",
        });
      }
      setLoading(false);
    }
    init();
  }, [router]);

  const fetchAddress = async () => {
    if (shipping.postalCode.replace(/-/g, "").length < 7) return;
    setPostalLoading(true);
    try {
      const code = shipping.postalCode.replace(/-/g, "");
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${code}`);
      const data = await res.json();
      if (data.results?.[0]) {
        setShipping(s => ({
          ...s,
          prefecture: data.results[0].address1,
          city: data.results[0].address2 + data.results[0].address3,
        }));
      }
    } catch {}
    setPostalLoading(false);
  };

  const handleCheckout = async () => {
    setCheckoutError("");
    if (!canCheckout && !isAllDigital) {
      setCheckoutError("Please complete the required shipping fields before continuing.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, userId: user?.id, shipping: isAllDigital ? null : shipping }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setCheckoutError(data.error);
      }
    } catch (err) {
      setCheckoutError("Failed to initiate checkout.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold border border-black/5 focus:bg-white focus:border-black/20 focus:outline-none transition-colors";
  const labelClass = "text-[10px] font-black text-gray-400 uppercase tracking-widest";

  if (loading && !user) return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto" />
    </div>
  );

  if (!supabase) return (
    <div className="max-w-3xl mx-auto px-4 py-24">
      <div className="rounded-3xl border border-black/10 bg-gray-50 p-8 text-center">
        <h1 className="text-2xl font-black tracking-tight mb-3">Checkout unavailable</h1>
        <p className="text-sm font-bold text-gray-500">{checkoutError}</p>
      </div>
    </div>
  );

  if (items.length === 0) { router.push("/shop/cart"); return null; }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <a href="/shop" className="hover:text-black transition-colors">Shop</a>
        <span>/</span>
        <a href="/shop/cart" className="hover:text-black transition-colors">Cart</a>
        <span>/</span>
        <span className="text-black font-medium">Checkout</span>
      </div>

      <h1 className="text-4xl font-black tracking-tighter mb-10">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left: Forms */}
        <div className="flex-1 space-y-10">

          {/* Digital-only notice */}
          {isAllDigital && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <span className="text-xl">⚡</span>
              <div>
                <p className="font-black text-sm text-blue-800">Digital Delivery</p>
                <p className="text-xs text-blue-600 mt-0.5">No shipping address required. Content will be delivered to your email after payment.</p>
              </div>
            </div>
          )}

          {/* Shipping Info */}
          {!isAllDigital && (
            <section className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-black text-xs">1</div>
                <h2 className="text-lg font-black uppercase tracking-tight">Shipping Information</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Last Name <span className="text-red-400">*</span></label>
                  <input type="text" value={shipping.lastName}
                    onChange={e => setShipping({ ...shipping, lastName: e.target.value })}
                    className={inputClass} placeholder="Yamada" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>First Name <span className="text-red-400">*</span></label>
                  <input type="text" value={shipping.firstName}
                    onChange={e => setShipping({ ...shipping, firstName: e.target.value })}
                    className={inputClass} placeholder="Taro" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Postal Code <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <input type="text" value={shipping.postalCode}
                    onChange={e => setShipping({ ...shipping, postalCode: e.target.value.replace(/[^0-9-]/g, "").slice(0, 8) })}
                    onBlur={fetchAddress}
                    className={inputClass + " flex-1"} placeholder="1234567" maxLength={8} />
                  <button onClick={fetchAddress} disabled={shipping.postalCode.replace(/-/g, "").length < 7 || postalLoading}
                    className="px-4 py-3 bg-black text-white rounded-2xl text-xs font-bold hover:bg-gray-900 disabled:opacity-40 whitespace-nowrap">
                    {postalLoading ? "..." : "Auto-fill"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Prefecture <span className="text-red-400">*</span></label>
                  <input type="text" value={shipping.prefecture}
                    onChange={e => setShipping({ ...shipping, prefecture: e.target.value })}
                    className={inputClass} placeholder="Tokyo" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>City <span className="text-red-400">*</span></label>
                  <input type="text" value={shipping.city}
                    onChange={e => setShipping({ ...shipping, city: e.target.value })}
                    className={inputClass} placeholder="Shibuya-ku" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Address Line 1 <span className="text-red-400">*</span></label>
                <input type="text" value={shipping.address1}
                  onChange={e => setShipping({ ...shipping, address1: e.target.value })}
                  className={inputClass} placeholder="1-2-3 Shinjuku" />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Address Line 2 <span className="text-gray-300">(Optional)</span></label>
                <input type="text" value={shipping.address2}
                  onChange={e => setShipping({ ...shipping, address2: e.target.value })}
                  className={inputClass} placeholder="Room 101" />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Country <span className="text-red-400">*</span></label>
                <select value={shipping.country}
                  onChange={e => setShipping({ ...shipping, country: e.target.value })}
                  className={inputClass + " bg-gray-50 appearance-none"}>
                  {["Japan","United States","United Kingdom","Australia","Canada","France","Germany","Italy","Spain","Netherlands","Belgium","Singapore","China","South Korea","Taiwan","Hong Kong","Other"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </section>
          )}

          {/* Payment */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-black text-xs">{isAllDigital ? "1" : "2"}</div>
              <h2 className="text-lg font-black uppercase tracking-tight">Payment</h2>
            </div>
            <div className="p-6 border border-black/10 rounded-2xl bg-gray-50 flex items-center gap-4">
              <span className="text-3xl">💳</span>
              <div>
                <p className="font-bold text-sm">Stripe Secure Checkout</p>
                <p className="text-xs text-gray-400 mt-0.5">Credit card, Apple Pay, Google Pay and more</p>
              </div>
            </div>
            {checkoutError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {checkoutError}
              </div>
            )}
          </section>
        </div>

        {/* Right: Order Summary */}
        <div className="w-full lg:w-[380px]">
          <div className="bg-black text-white rounded-3xl p-8 shadow-2xl sticky top-8">
            <h2 className="text-base font-black uppercase tracking-widest mb-6">Order Summary</h2>

            <div className="space-y-4 mb-8 max-h-[280px] overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name_en} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-tight truncate">{item.name_en}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        {item.type} · Qty {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-black text-sm shrink-0">&yen;{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-6 border-t border-white/10 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                <span className="font-bold text-gray-200">&yen;{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Shipping</span>
                <span className="font-bold text-green-400">{isAllDigital ? "N/A" : "FREE"}</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="font-black text-lg uppercase tracking-tight">Total</span>
                <span className="font-black text-3xl">&yen;{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <button onClick={handleCheckout} disabled={!isAllDigital && !canCheckout}
              className="w-full py-5 bg-white text-black rounded-2xl font-black text-sm hover:bg-gray-100 transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? "Redirecting..." : `Pay ¥${totalPrice.toLocaleString()}`}
            </button>

            <p className="text-[10px] text-center text-gray-500 font-bold mt-5 uppercase tracking-widest">
              Secured by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
