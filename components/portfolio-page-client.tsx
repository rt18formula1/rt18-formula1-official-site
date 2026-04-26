"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage } from "@/components/providers/language-provider";
import type { DbPortfolio, DbAlbum } from "@/lib/supabase-queries";

type Crumb = { id: string | null; title: string };

export default function PortfolioPageClient({
  portfolio,
  albums,
  mapping = [],
}: {
  portfolio: DbPortfolio[];
  albums: DbAlbum[];
  mapping?: { portfolio_id: string; album_id: string }[];
}) {
  const { language } = useLanguage();

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { id: null, title: language === "ja" ? "ホーム" : "Home" }
  ]);
  
  const currentAlbumId = breadcrumbs[breadcrumbs.length - 1]?.id ?? null;

  const currentLevelAlbums = useMemo(() => {
    return albums.filter(a => a.type === "portfolio" && a.parent_id === currentAlbumId);
  }, [albums, currentAlbumId]);

  const currentLevelWorks = useMemo(() => {
    if (currentAlbumId === null) {
      const inAlbumIds = new Set(mapping.map(m => m.portfolio_id));
      return portfolio.filter(p => !inAlbumIds.has(p.id));
    }
    const itemIds = new Set(mapping.filter(m => m.album_id === currentAlbumId).map(m => m.portfolio_id));
    return portfolio.filter(p => itemIds.has(p.id));
  }, [portfolio, currentAlbumId, mapping]);

  const title = language === "ja" ? "ポートフォリオ" : "Portfolio";

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />
      
      <div className="flex-1">
        <header className="bg-white border-b border-black/10 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-6xl font-black mb-8 tracking-tighter">{title}</h1>
            
            <nav className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-gray-400">
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.id || 'root'} className="flex items-center gap-3">
                  <button 
                    onClick={() => setBreadcrumbs(breadcrumbs.slice(0, idx + 1))}
                    className={`hover:text-black transition-colors ${idx === breadcrumbs.length - 1 ? 'text-black border-b-2 border-black' : ''}`}
                  >
                    {crumb.title}
                  </button>
                  {idx < breadcrumbs.length - 1 && <span className="opacity-30">/</span>}
                </div>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-16">
          {currentLevelAlbums.length > 0 && (
            <div className="mb-20">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-10">Collections</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {currentLevelAlbums.map((album) => (
                  <button
                    key={album.id}
                    onClick={() => setBreadcrumbs([...breadcrumbs, { id: album.id, title: language === "ja" ? album.name_ja || album.name_en : album.name_en }])}
                    className="group text-left border border-black/10 rounded-2xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                  >
                    <div className="aspect-square bg-black/5 relative overflow-hidden">
                      {album.cover_image_url ? (
                        <img 
                          src={album.cover_image_url} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">📁</div>
                      )}
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">Explore</span>
                      </div>
                    </div>
                    <div className="p-8">
                      <h3 className="font-black text-2xl mb-2">{language === "ja" ? album.name_ja || album.name_en : album.name_en}</h3>
                      <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-2">
                        {language === "ja" ? album.description_ja || album.description_en : album.description_en}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-10">
              {currentAlbumId ? "Works in this collection" : "All Works"}
            </h2>
            {currentLevelWorks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {currentLevelWorks.map((work) => (
                  <Link
                    key={work.id}
                    href={`/portfolio/${work.id}`}
                    className="group border border-black/10 rounded-2xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                  >
                    <div className="aspect-square bg-black/5 relative overflow-hidden">
                      {work.image_url ? (
                        <img 
                          src={work.image_url} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🎨</div>
                      )}
                    </div>
                    <div className="p-8">
                      <h3 className="font-black text-xl group-hover:text-blue-600 transition-colors">
                        {language === "ja" ? work.title_ja || work.title_en : work.title_en}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 font-bold italic">No works found in this collection.</p>
            )}
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
