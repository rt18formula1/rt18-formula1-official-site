"use client";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/shop/cart-context";
import Link from "next/link";

export default function SuccessPage() {
  const { clearCart, items, totalPrice } = useCart();
  const cleared = useRef(false);
  const [purchasedItems, setPurchasedItems] = useState<typeof items>([]);
  const [purchasedTotal, setPurchasedTotal] = useState(0);

  useEffect(() => {
    if (!cleared.current) {
      cleared.current = true;
      // Capture before clearing
      setPurchasedItems([...items]);
      setPurchasedTotal(totalPrice);
      clearCart();
      // Belt-and-suspenders: directly nuke localStorage in case state update races
      try { localStorage.removeItem("rt18_cart"); } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-24">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-6">🏆</div>
        <h1 className="text-4xl font-black tracking-tighter mb-4">Payment Successful!</h1>
        <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
          Thank you for your purchase. We&apos;ve received your order and are processing it.
          A confirmation email has been sent to your inbox.
        </p>
      </div>

      {/* Purchased items summary */}
      {purchasedItems.length > 0 && (
        <div className="bg-gray-50 rounded-3xl p-6 mb-10 border border-black/5">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-5">Order Summary</h2>
          <div className="space-y-4">
            {purchasedItems.map(item => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-black/5 shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name_en} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-gray-300">
                      {(item.type || "").toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.name_en}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    {item.type} · Qty {item.quantity}
                  </p>
                </div>
                <p className="font-black text-sm shrink-0">&yen;{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-black/8 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Total Paid</span>
            <span className="font-black text-xl">&yen;{purchasedTotal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Next steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="text-center p-4 bg-gray-50 rounded-2xl">
          <div className="text-2xl mb-2">📧</div>
          <p className="text-xs font-bold text-gray-600">Check your email for the order confirmation</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-2xl">
          <div className="text-2xl mb-2">📦</div>
          <p className="text-xs font-bold text-gray-600">Track your order status in My Page</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-2xl">
          <div className="text-2xl mb-2">🏎️</div>
          <p className="text-xs font-bold text-gray-600">Keep up with F1 on our Instagram</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link href="/shop/mypage"
          className="px-8 py-4 bg-black text-white rounded-2xl font-black text-sm hover:bg-gray-900 transition-colors shadow-lg text-center active:scale-[0.98]">
          View My Orders
        </Link>
        <Link href="/shop"
          className="px-8 py-4 border border-black/10 rounded-2xl font-black text-sm hover:bg-gray-50 transition-colors text-center">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
