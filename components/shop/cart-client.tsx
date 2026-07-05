"use client";
import { useCart } from "./cart-context";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function CartClient() {
  const { items, removeItem, updateQuantity, totalPrice, totalCount } = useCart();
  const [lang, setLang] = useState<"ja" | "en">("ja");
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("language");
    if (stored === "en") setLang("en");
    const checkUser = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();
  }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-8">🛒</div>
        <h1 className="text-3xl font-black tracking-tighter mb-4">Your cart is empty</h1>
        <p className="text-gray-500 mb-10">Add some F1 passion to your collection.</p>
        <Link
          href="/shop"
          className="inline-block px-8 py-4 bg-black text-white rounded-2xl font-black text-sm hover:bg-gray-900 transition-colors shadow-lg"
        >
          Explore Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-black tracking-tighter">Cart</h1>
        <p className="text-sm text-gray-400">{totalCount} item{totalCount !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Item List */}
        <div className="space-y-4">
          {items.map((item) => {
            const isDigital = item.type === "digital" || item.type === "skill";
            return (
              <div key={item.id} className="flex gap-5 items-center border border-black/8 rounded-2xl p-5 hover:border-black/20 transition-colors">
                <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-black/5">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name_en} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-300">
                      {(item.type || "item").toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm leading-tight mb-0.5 truncate">
                    {lang === "ja" ? item.name_ja : item.name_en}
                  </h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">
                    {item.type}
                  </p>

                  <div className="flex items-center gap-4">
                    {isDigital ? (
                      <span className="text-[10px] font-black text-gray-400 border border-black/10 rounded-full px-3 py-1 uppercase tracking-widest">
                        Qty: 1 (Digital)
                      </span>
                    ) : (
                      <div className="flex items-center border border-black/10 rounded-full px-1 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors text-gray-600 font-bold"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors text-gray-600 font-bold"
                        >
                          +
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[10px] font-black text-red-400 hover:text-red-600 transition-colors uppercase tracking-tighter"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-black text-sm">&yen;{(item.price * item.quantity).toLocaleString()}</p>
                  {!isDigital && item.quantity > 1 && (
                    <p className="text-[10px] text-gray-400 mt-0.5">&yen;{item.price.toLocaleString()} each</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-3xl p-8 border border-black/5">
          <div className="space-y-3 mb-8">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Subtotal ({totalCount} item{totalCount !== 1 ? "s" : ""})</span>
              <span className="font-bold">&yen;{totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Shipping</span>
              <span className="text-gray-400">Calculated at checkout</span>
            </div>
            <div className="pt-4 border-t border-black/10 flex justify-between items-center">
              <span className="font-black text-lg">Total</span>
              <span className="font-black text-2xl">&yen;{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          {user ? (
            <Link
              href="/shop/checkout"
              className="w-full block py-4 bg-black text-white text-center rounded-2xl font-black text-sm hover:bg-gray-900 transition-colors shadow-lg active:scale-[0.98]"
            >
              Proceed to Checkout →
            </Link>
          ) : (
            <div className="space-y-3">
              <Link
                href="/shop/auth/login"
                className="w-full block py-4 bg-black text-white text-center rounded-2xl font-black text-sm hover:bg-gray-900 transition-colors shadow-lg active:scale-[0.98]"
              >
                Login to Purchase
              </Link>
              <p className="text-[10px] text-center text-gray-400">Login or create an account to complete your purchase</p>
            </div>
          )}

          <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold mt-4">
            Secure Payments via Stripe
          </p>
        </div>

        <div className="text-center">
          <Link href="/shop" className="text-sm text-gray-400 hover:text-black transition-colors font-bold">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
