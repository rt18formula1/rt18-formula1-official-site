"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage } from "@/components/providers/language-provider";
import type { DbNews, DbAlbum } from "@/lib/supabase-queries";

export default function NewsPageClient({ 
  news, 
  albums,
  mapping = [] 
}: { 
  news: DbNews[]; 
  albums: DbAlbum[];
  mapping?: { news_id: string; album_id: string }[];
}) {
  const { language } = useLanguage();

  // Root albums for backnumbers
  const rootAlbums = albums.filter(a => a.type === "backnumber" && !a.parent_id);
  
  // News not in any album (Recent News)
  const albumNewsIds = new Set(mapping.map(m => m.news_id));
  const recentNews = news.filter(n => !albumNewsIds.has(n.id)).slice(0, 10);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <header className="bg-white border-b border-black/10 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 uppercase">News</h1>
            <div className="h-2 w-24 bg-black mb-8" />
            <p className="text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">
              Stay updated with the latest F1 session results, race analysis, and paddock stories.
            </p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-20">
          {/* Backnumbers (Albums) */}
          <section className="mb-32">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-12 flex items-center gap-4">
              Backnumbers <div className="h-px flex-1 bg-black/5" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {rootAlbums.map((album) => (
                <Link
                  key={album.id}
                  href={`/backnumber/${album.id}`}
                  className="group border border-black/10 rounded-3xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="aspect-video bg-black/5 relative overflow-hidden">
                    {album.cover_image_url ? (
                      <img 
                        src={album.cover_image_url} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">📁</div>
                    )}
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-black mb-3">{album.name_en}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-2">
                      {album.description_en}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Latest News */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-12 flex items-center gap-4">
              Latest Updates <div className="h-px flex-1 bg-black/5" />
            </h2>
            <div className="grid grid-cols-1 gap-8">
              {recentNews.length > 0 ? (
                recentNews.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.id}`}
                    className="group flex flex-col md:flex-row gap-10 border border-black/10 rounded-3xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 p-8"
                  >
                    <div className="w-full md:w-64 aspect-video bg-black/5 rounded-2xl overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">📰</div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        {item.published_at.split("T")[0]}
                      </p>
                      <h3 className="text-3xl md:text-4xl font-black mb-6 group-hover:text-blue-600 transition-colors leading-tight tracking-tight">
                        {language === "ja" ? item.title_ja || item.title_en : item.title_en}
                      </h3>
                      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                        Read Article <span>→</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center py-20 text-gray-400 font-bold italic">No recent news found.</p>
              )}
            </div>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
