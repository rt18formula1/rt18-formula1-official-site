"use client";

import { useEffect } from "react";
import { useCart } from "@/components/shop/cart-context";
import Link from "next/link";

export default function SuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-8">🏁</div>
      <h1 className="text-4xl font-black tracking-tighter mb-4">Payment Successful!</h1>
      <p className="text-gray-500 mb-10 max-w-md mx-auto">
        Thank you for your purchase. We've received your order and are processing it.
        A confirmation email has been sent to your inbox.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link
          href="/shop/mypage/orders"
          className="px-8 py-4 bg-black text-white rounded-2xl font-black text-sm hover:bg-gray-900 transition-colors shadow-lg"
        >
          View My Orders
        </Link>
        <Link
          href="/shop"
          className="px-8 py-4 border border-black/10 rounded-2xl font-black text-sm hover:bg-gray-50 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
