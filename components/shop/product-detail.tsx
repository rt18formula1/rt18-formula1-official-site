"use client";

import { useState } from "react";
import { useCart } from "./cart-context";
import Link from "next/link";

type Product = {
  id: string;
  name_ja: string;
  name_en: string;
  description_ja: string;
  description_en: string;
  type: "digital" | "physical" | "skill";
  price: number;
  stock: number | null;
  status: "on_sale" | "sold_out" | "draft";
  image_url: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  digital: "Digital Content",
  physical: "Physical Good",
  skill: "Skill / Commission",
};

export function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [lang, setLang] = useState<"ja" | "en">("ja");

  // Check language from local storage or default to ja
  useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("language");
      if (stored === "en") setLang("en");
    }
  });

  const handleAddToCart = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const name = lang === "ja" ? product.name_ja : product.name_en;
  const description = lang === "ja" ? product.description_ja : product.description_en;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/shop" className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-2">
          <span>←</span> Back to Shop
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Left: Image */}
        <div className="flex-1">
          <div className="aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-black/5 shadow-sm">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 font-black text-4xl">
                {(product.type || "item").toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="w-full md:w-[400px] flex flex-col">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-black/5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
              {TYPE_LABELS[product.type || "digital"]}
            </span>
            <h1 className="text-3xl font-black tracking-tighter leading-tight mb-2">
              {name}
            </h1>
            <p className="text-2xl font-black">
              ¥{product.price.toLocaleString()}
            </p>
          </div>

          <div className="prose prose-sm mb-10 text-gray-600 leading-relaxed">
            {description ? (
              <p className="whitespace-pre-wrap">{description}</p>
            ) : (
              <p className="italic text-gray-400">No description available.</p>
            )}
          </div>

          <div className="mt-auto space-y-4">
            {product.status === "on_sale" ? (
              <>
                <button
                  onClick={handleAddToCart}
                  disabled={added}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${
                    added
                      ? "bg-green-500 text-white"
                      : "bg-black text-white hover:bg-gray-900"
                  }`}
                >
                  {added ? "✓ Added to Cart" : "Add to Cart"}
                </button>
                <Link
                  href="/shop/cart"
                  className="w-full block py-4 text-center border border-black/10 rounded-2xl font-black text-sm hover:bg-gray-50 transition-colors"
                >
                  Go to Cart
                </Link>
              </>
            ) : (
              <button
                disabled
                className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-sm cursor-not-allowed"
              >
                {product.status === "sold_out" ? "Sold Out" : "Coming Soon"}
              </button>
            )}
            
            <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">
              Secure Checkout with Stripe
            </p>
          </div>
        </div>
      </div>

      {/* Features / Details */}
      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-black/5">
        <div className="p-6 bg-gray-50 rounded-2xl">
          <div className="text-2xl mb-4">🚚</div>
          <h3 className="font-bold text-sm mb-2 uppercase tracking-tight">Worldwide Shipping</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            We deliver F1 passion across the globe. Fast and tracked shipping available for all physical goods.
          </p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl">
          <div className="text-2xl mb-4">⚡</div>
          <h3 className="font-bold text-sm mb-2 uppercase tracking-tight">Instant Digital Access</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Digital content is delivered immediately to your email after checkout. No waiting required.
          </p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl">
          <div className="text-2xl mb-4">🛡️</div>
          <h3 className="font-bold text-sm mb-2 uppercase tracking-tight">Secure Payment</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            All transactions are handled securely by Stripe. Your payment information never touches our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
