"use client";

import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useLanguage } from "@/components/providers/language-provider";
import { linktreeLinks, snsLinks } from "@/lib/content";
import type { DbNews, DbPortfolio } from "@/lib/supabase-queries";

export default function HomeClient({ news, portfolio }: { news: DbNews[]; portfolio: DbPortfolio[] }) {
  const { language, t } = useLanguage();

  const heroText =
    language === "ja"
      ? "このアカウントは #rt18_formula1 が制作したF1イラストとニュースを投稿しています。フォロー・いいね・リポスト・シェアしていただけると嬉しいです。"
      : "This account posts F1 illustrations and news created by #rt18_formula1. We would be happy if you followed, liked, reposted, and shared!";

  const profileText =
    language === "ja"
      ? "F1ファンアート、イラスト、最新のF1ニュースをチェックしてください。rt18_formula1は、象徴的なF1の瞬間、ドライバー、マシンを題材にした作品で、F1の世界観に浸れるビジュアルコンテンツを制作しています。"
      : "Check out F1 fan art, illustrations, and the latest F1 news. rt18_formula1 creates visual content to immerse you in Formula 1. Featuring exquisite artwork of iconic F1 moments, drivers, and cars. Follow and share the latest F1 news, session results, and creative illustrations every day.";

  const homeNews = [...news].slice(0, 2);
  const homePortfolio = [...portfolio];

  return (
    <div className="min-h-screen bg-white flex flex-col text-black">
      <SiteHeader />
      <main className="flex-1">
        <section id="top" className="py-16 md:py-24 text-center bg-white">
          <h1 className="text-5xl md:text-7xl font-black mb-6">rt18_formula1</h1>
          <p className="text-lg max-w-2xl mx-auto px-4 mb-8">{heroText}</p>
        </section>
        <div className="h-px bg-black/10" />

        <section className="py-12 border-b border-black/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black">{t("newsSection")}</h2>
              <Link href="/news" className="font-semibold hover:underline">
                {t("newsMore")}
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {homeNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="bg-white border border-black/10 rounded-lg overflow-hidden hover:shadow-lg transition block"
                >
                  <div className="w-full bg-black/5 border-b border-black/10 flex items-center justify-center text-6xl aspect-video relative">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={language === "ja" ? item.title_ja || item.title_en : item.title_en} fill className="object-cover" />
                    ) : (
                      <span>📰</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs mb-2 text-gray-500">{item.published_at}</p>
                    <h3 className="font-bold mb-2 line-clamp-2">
                      {language === "ja" ? item.title_ja || item.title_en : item.title_en}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 border-b border-black/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black">{t("portfolioSection")}</h2>
              <Link href="/portfolio" className="font-semibold hover:underline">
                {t("portfolioMore")}
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
              {homePortfolio.map((item) => (
                <Link
                  key={item.id}
                  href={`/portfolio/${item.id}`}
                  className="flex-shrink-0 w-40 bg-white border border-black/10 rounded-lg overflow-hidden hover:shadow-lg transition"
                >
                  <div className="w-full h-40 bg-black/5 border-b border-black/10 flex items-center justify-center text-5xl relative">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={language === "ja" ? item.title_ja || item.title_en : item.title_en} fill className="object-cover" />
                    ) : (
                      <span>🎨</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-sm line-clamp-3">
                      {language === "ja" ? item.title_ja || item.title_en : item.title_en}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="profile" className="py-12 border-b border-black/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-black mb-8">{t("profileHeading")}</h2>
            <p className="text-base max-w-3xl mx-auto mb-8 leading-relaxed">{profileText}</p>

            <div className="flex flex-wrap gap-4 mb-8">
              {snsLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-16 h-16 bg-white border border-black/10 rounded-lg hover:bg-black/5 transition"
                  title={link.name}
                >
                  <Image src={link.icon} alt={link.name} width={40} height={40} className="w-10 h-10 object-contain" />
                </a>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {linktreeLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border border-black/10 rounded-lg text-center hover:bg-black/5 transition text-sm font-semibold"
                >
                  {link.title}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="request" className="py-12 border-b border-black/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-black mb-4">{t("requestHeading")}</h2>
            <p className="mb-6">{t("requestText")}</p>
            <a
              href="https://forms.gle/7vbRQrDKF4MZpv1G8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-black text-white font-semibold hover:bg-black/90 transition rounded-lg"
            >
              {t("requestBtn")}
            </a>
          </div>
        </section>

        <section id="contact" className="py-12 border-b border-black/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-black mb-4">{t("contactHeading")}</h2>
            <p className="mb-6">{t("contactText")}</p>
            <a
              href="https://forms.gle/sCnwiNJ5gkLLt9Bn8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-black text-white font-semibold hover:bg-black/90 transition rounded-lg"
            >
              {t("contactBtn")}
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
