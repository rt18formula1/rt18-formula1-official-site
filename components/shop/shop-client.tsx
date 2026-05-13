"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: string;
  name_ja: string;
  name_en: string;
  type: "digital" | "physical" | "skill";
  price: number;
  status: "on_sale" | "sold_out" | "draft";
  image_url: string | null;
  sort_order: number;
};

const TYPE_COLORS: Record<string, string> = {
  digital: "bg-blue-100 text-blue-700",
  physical: "bg-green-100 text-green-700",
  skill: "bg-purple-100 text-purple-700",
};

export function ShopClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [lang, setLang] = useState<"ja" | "en">("ja");

  useEffect(() => {
    const stored = localStorage.getItem("language");
    if (stored === "en") setLang("en");
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!supabase) {
        console.error("⚠️ Supabase client is null. Check environment variables.");
        setLoading(false);
        return;
      }
      
      try {
        console.log("🔍 Fetching products with status 'on_sale'...");
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query: any = supabase
          .from("products")
          .select("*")
          .eq("status", "on_sale");
          
        if (filter !== "all") query = query.eq("type", filter);
        
        const { data, error } = await query.order("sort_order", { ascending: true });
        
        if (error) {
          console.error("❌ Supabase error:", error.message, error.details);
        } else {
          console.log("✅ Products fetched:", data);
          if (data) setProducts(data);
        }
      } catch (err) {
        console.error("❌ Unexpected error during fetch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filter]);

  const filters = [
    { value: "all", label: "All" },
    { value: "digital", label: "Digital" },
    { value: "physical", label: "Goods" },
    { value: "skill", label: "Skill" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tighter mb-2">Shop</h1>
        <p className="text-gray-500 text-sm">
          Digital contents, goods, and illustration commissions
        </p>
      </div>

      <Link
        href="/shop/commission"
        className="block mb-10 bg-black text-white rounded-2xl p-8 hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Illustration Commission
            </p>
            <h2 className="text-2xl font-black">Order Original Illustration</h2>
            <p className="text-gray-400 text-sm mt-2">
              Custom F1 driver, car, and team illustrations made to order
            </p>
          </div>
          <span className="text-4xl">&#8594;</span>
        </div>
      </Link>

      <div className="flex gap-3 mb-8 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${
              filter === f.value
                ? "bg-black text-white border-black"
                : "bg-white text-black border-black/20 hover:border-black"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-100 rounded-2xl aspect-square mb-3" />
              <div className="bg-gray-100 h-4 rounded mb-2" />
              <div className="bg-gray-100 h-3 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="font-bold text-lg mb-2">Coming soon</p>
          <p className="text-sm">Products will be available soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/shop/${product.id}`} className="group">
              <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={lang === "ja" ? product.name_ja : product.name_en}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">
                  {(product.type || "item").toUpperCase()}
                </div>
              )}
              <span className={`absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full ${product.type ? TYPE_COLORS[product.type] : "bg-gray-100 text-gray-700"}`}>
                {product.type || "item"}
              </span>
                {product.status === "sold_out" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-black text-sm">SOLD OUT</span>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-sm leading-tight mb-1 group-hover:underline">
                {lang === "ja" ? product.name_ja : product.name_en}
              </h3>
              <p className="font-black text-sm">
                {String.fromCharCode(165)}{product.price.toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-16 pt-8 border-t border-black/10 text-center">
        <p className="text-sm text-gray-500 mb-3">
          Feel free to contact us with any questions
        </p>
        <Link
          href="/shop/inquiry"
          className="inline-block px-6 py-3 border border-black rounded-full text-sm font-bold hover:bg-black hover:text-white transition-colors"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}
