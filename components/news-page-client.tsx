"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { useLanguage } from "@/components/providers/language-provider";
import type { DbNews, DbAlbum } from "@/lib/supabase-queries";
import Image from "next/image";

export default function NewsPageClient({ news, albums }: { news: DbNews[]; albums: DbAlbum[] }) {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState<"all" | "albums">("all");

  const labels =
    language === "ja"
      ? { all: "すべて", albums: "バックナンバー（アルバム）", emptyAlbums: "アルバムがありません" }
      : { all: "All", albums: "Backnumbers (Albums)", emptyAlbums: "No albums yet" };

  return (
    <div className="min-h-screen bg-white text-black">
      <SiteHeader />

      <div className="border-b border-black/10">
        <div className="container mx-auto px-4 flex gap-8">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`py-4 px-2 font-semibold border-b-2 ${tab === "all" ? "border-black" : "border-transparent hover:underline"}`}
          >
            {labels.all}
          </button>
          <button
            type="button"
            onClick={() => setTab("albums")}
            className={`py-4 px-2 font-semibold border-b-2 ${tab === "albums" ? "border-black" : "border-transparent hover:underline"}`}
          >
            {labels.albums}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {tab === "all" ? (
          <>
            <h1 className="text-4xl font-black mb-12">{t("navNews")}</h1>
            <div className="space-y-6">
              {news.map((newsItem) => (
                <Link
                  key={newsItem.id}
                  href={`/news/${newsItem.id}`}
                  className="border border-black/10 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer block"
                >
                  <div className="p-6">
                    <div className="flex gap-4 mb-4">
                      <div className="w-24 h-24 bg-black/5 border border-black/10 rounded flex items-center justify-center flex-shrink-0 text-2xl relative overflow-hidden">
                        {newsItem.image_url ? (
                          <Image src={newsItem.image_url} alt="News thumbnail" fill className="object-cover" />
                        ) : (
                          <span>📰</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-2 text-gray-500">{newsItem.published_at}</p>
                        <h2 className="text-2xl font-bold mb-3">
                          {language === "ja" ? newsItem.title_ja || newsItem.title_en : newsItem.title_en}
                        </h2>
                        {/* Note: JSONB content rendering might need specific handling later */}
                      </div>
                    </div>
                    <div className="font-semibold hover:underline">{t("readMore")}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-black mb-8">{labels.albums}</h1>
            {albums.length === 0 ? (
              <p>{labels.emptyAlbums}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {albums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/backnumber/${album.id}`}
                    className="bg-white border border-black/10 rounded-lg overflow-hidden block hover:shadow-lg transition-shadow"
                  >
                    <div className="w-full aspect-square bg-black/5 border-b border-black/10 flex items-center justify-center text-4xl relative">
                      {album.cover_image_url ? (
                        <Image src={album.cover_image_url} alt="Album cover" fill className="object-cover" />
                      ) : (
                        <span>📁</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-black">
                        {language === "ja" ? album.name_ja || album.name_en : album.name_en}
                      </h3>
                      <p className="text-sm mt-2 text-gray-600 line-clamp-2">
                        {language === "ja" ? album.description_ja || album.description_en : album.description_en}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
