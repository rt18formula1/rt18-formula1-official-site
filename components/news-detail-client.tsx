"use client";

import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { useLanguage } from "@/components/providers/language-provider";
import type { DbNews, DbPortfolio } from "@/lib/supabase-queries";

export default function NewsDetailClient({ 
  newsItem, 
  embeddedPortfolio = [] 
}: { 
  newsItem: DbNews;
  embeddedPortfolio?: DbPortfolio[];
}) {
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

  const title = language === "ja" ? newsItem.title_ja || newsItem.title_en : newsItem.title_en;
  const body = (language === "ja" ? newsItem.body_ja || newsItem.body_en : newsItem.body_en) || "";

  // Helper to render body with embedded cards
  const renderBody = (text: string) => {
    if (!text) return null;
    
    const parts = text.split(/(\[portfolio:[a-f0-9-]+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[portfolio:([a-f0-9-]+)\]/);
      if (match) {
        const id = match[1];
        const item = embeddedPortfolio.find(p => p.id === id);
        if (item) {
          return (
            <div key={index} className="my-8 border border-black/10 rounded-xl overflow-hidden bg-white shadow-sm max-w-sm mx-auto">
              <Link href={`/portfolio/${item.id}`}>
                <div className="aspect-square relative bg-black/5">
                  {item.image_url && <img src={item.image_url} alt={item.title_en} className="w-full h-full object-cover" />}
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm">{item.title_en}</h4>
                  <p className="text-xs text-blue-500 mt-2 font-bold">View Artwork →</p>
                </div>
              </Link>
            </div>
          );
        }
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <SiteHeader />
      <article className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-8 border-b border-black/10 pb-8">
          <p className="text-sm text-gray-500 mb-4">{newsItem.published_at.split("T")[0]}</p>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{title}</h1>
          {newsItem.image_url && (
            <div className="aspect-video relative rounded-2xl overflow-hidden bg-black/5 border border-black/10">
              <img src={newsItem.image_url} alt={title} className="w-full h-full object-cover" />
            </div>
          )}
        </header>

        <div className="prose prose-lg max-w-none text-black leading-relaxed">
          {renderBody(body)}
        </div>
      </article>
    </div>
  );
}
