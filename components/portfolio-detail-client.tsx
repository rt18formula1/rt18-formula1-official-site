"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";
import type { DbPortfolio } from "@/lib/supabase-queries";
import Image from "next/image";

export default function PortfolioDetailClient({ portfolioItem }: { portfolioItem: DbPortfolio }) {
  const { language } = useLanguage();

  if (!portfolioItem) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Portfolio not found</h1>
          <Link href="/portfolio" className="underline">
            Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-white border-b border-black/10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/portfolio" className="hover:underline">
            ← Back to Portfolio
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">
            {language === "ja" ? portfolioItem.title_ja || portfolioItem.title_en : portfolioItem.title_en}
          </h2>
          <p className="text-gray-500">{portfolioItem.created_at?.split("T")[0]}</p>
        </div>
        <div className="w-full bg-black/5 border border-black/10 rounded-lg overflow-hidden aspect-video flex items-center justify-center text-7xl relative">
          {portfolioItem.image_url ? (
            <Image src={portfolioItem.image_url} alt="Portfolio image" fill className="object-cover" />
          ) : (
            <span>🎨</span>
          )}
        </div>
        <div className="mt-8 max-w-none">
          <p className="whitespace-pre-wrap">
            {language === "ja" 
              ? portfolioItem.body_ja || portfolioItem.body_en 
              : portfolioItem.body_en || "No description yet."}
          </p>
        </div>
      </main>
    </div>
  );
}
