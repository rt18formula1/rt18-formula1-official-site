"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";
import type { DbNews } from "@/lib/supabase-queries";
import Image from "next/image";

export default function NewsDetailClient({ newsItem }: { newsItem: DbNews }) {
  const { language } = useLanguage();

  if (!newsItem) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">News not found</h1>
          <Link href="/news" className="underline">
            Back to News
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-white border-b border-black/10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/news" className="hover:underline">
            ← Back to News
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">
            {language === "ja" ? newsItem.title_ja || newsItem.title_en : newsItem.title_en}
          </h2>
          <p className="text-gray-500">{newsItem.published_at}</p>
        </div>
        <div className="w-full bg-black/5 border border-black/10 rounded-lg aspect-video flex items-center justify-center text-7xl mb-8 relative overflow-hidden">
          {newsItem.image_url ? (
            <Image src={newsItem.image_url} alt="News thumbnail" fill className="object-cover" />
          ) : (
            <span>📰</span>
          )}
        </div>
        <div className="max-w-none">
          {/* In a real app with JSONB, we'd render it here. For now just JSON.stringify or extract text */}
          <div className="whitespace-pre-wrap">
            {language === "ja" 
              ? (typeof newsItem.body_ja === "string" ? newsItem.body_ja : JSON.stringify(newsItem.body_ja)) || 
                (typeof newsItem.body_en === "string" ? newsItem.body_en : JSON.stringify(newsItem.body_en))
              : (typeof newsItem.body_en === "string" ? newsItem.body_en : JSON.stringify(newsItem.body_en))
            }
          </div>
        </div>
      </main>
    </div>
  );
}
