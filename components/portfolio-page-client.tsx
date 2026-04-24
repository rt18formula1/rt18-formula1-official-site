"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { useLanguage } from "@/components/providers/language-provider";
import type { DbPortfolio, DbAlbum } from "@/lib/supabase-queries";
import Image from "next/image";

type Crumb = { id: string | null; title: string };
type Relation = { parent_id: string; child_id: string; sort_order: number };

export default function PortfolioPageClient({
  portfolio,
  albums,
  relations,
}: {
  portfolio: DbPortfolio[];
  albums: DbAlbum[];
  relations: Relation[];
}) {
  const { language } = useLanguage();

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([{ id: null, title: language === "ja" ? "ホーム" : "Home" }]);
  const currentAlbumId = breadcrumbs[breadcrumbs.length - 1]?.id ?? null;

  const childAlbums = useMemo(() => {
    if (currentAlbumId === null) {
      // Find root albums (those that are never a child in relations)
      const childIds = new Set(relations.map((r) => r.child_id));
      return albums.filter((a) => !childIds.has(a.id));
    } else {
      // Find children of currentAlbumId
      const childIds = new Set(relations.filter((r) => r.parent_id === currentAlbumId).map((r) => r.child_id));
      return albums.filter((a) => childIds.has(a.id));
    }
  }, [albums, relations, currentAlbumId]);

  const title = language === "ja" ? "ポートフォリオ" : "Portfolio";

  return (
    <div className="min-h-screen bg-white text-black">
      <SiteHeader />

      <div className="border-b border-black/10 sticky top-[73px] bg-white z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold mb-4">{title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center gap-2">
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => setBreadcrumbs(breadcrumbs.slice(0, index + 1))}
                >
                  {item.title}
                </button>
                {index < breadcrumbs.length - 1 ? <span className="text-black/40">›</span> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {childAlbums.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">{language === "ja" ? "アルバム" : "Albums"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {childAlbums.map((album) => (
                <Link
                  key={album.id}
                  href={`/albums/${album.id}`}
                  className="text-left border border-black/10 rounded-lg overflow-hidden hover:shadow-lg transition-shadow block bg-white"
                >
                  <div className="aspect-square bg-black/5 border-b border-black/10 flex items-center justify-center text-4xl relative overflow-hidden">
                    {album.cover_image_url ? (
                      <Image src={album.cover_image_url} alt="Album cover" fill className="object-cover" />
                    ) : (
                      <span>📁</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {language === "ja" ? album.name_ja || album.name_en : album.name_en}
                    </h3>
                    {album.description_en || album.description_ja ? (
                      <p className="text-sm line-clamp-2 text-gray-600">
                        {language === "ja" ? album.description_ja || album.description_en : album.description_en}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <h2 className="text-2xl font-bold mb-6">
            {currentAlbumId ? (language === "ja" ? "このアルバムの作品" : "Works in this album") : language === "ja" ? "全ての作品" : "All works"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((work) => (
              <Link
                key={work.id}
                href={`/portfolio/${work.id}`}
                className="border border-black/10 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
              >
                <div className="aspect-square bg-black/5 border-b border-black/10 overflow-hidden flex items-center justify-center text-5xl relative">
                  {work.image_url ? (
                    <Image src={work.image_url} alt="Portfolio item" fill className="object-cover" />
                  ) : (
                    <span>🎨</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">
                    {language === "ja" ? work.title_ja || work.title_en : work.title_en}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
