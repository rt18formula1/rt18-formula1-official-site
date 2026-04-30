"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useLanguage } from "@/components/providers/language-provider";
import { linktreeLinks, snsLinks } from "@/lib/content";
import { generateImageProps } from "@/lib/seo-utils";
import type { DbNews, DbPortfolio, DbEvent } from "@/lib/supabase-queries";

export default function HomeClient({ 
  news, 
  portfolio,
  events = []
}: { 
  news: DbNews[]; 
  portfolio: DbPortfolio[];
  events?: DbEvent[];
}) {
  const { language, t } = useLanguage();
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);

  const heroText =
    language === "ja"
      ? "このアカウントは #rt18_formula1 が制作したF1イラストとニュースを投稿しています。フォロー・いいね・リポスト・シェアしていただけると嬉しいです。"
      : "This account posts F1 illustrations and news created by #rt18_formula1. We would be happy if you followed, liked, reposted, and shared!";

  const profileText =
    language === "ja"
      ? "F1ファンアート、イラスト、最新のF1ニュースをチェックしてください。rt18_formula1は、象徴的なF1の瞬間、ドライバー、マシンを題材にした作品で、F1の世界観に浸れるビジュアルコンテンツを制作しています。"
      : "Check out F1 fan art, illustrations, and the latest F1 news. rt18_formula1 creates visual content to immerse you in Formula 1. Featuring exquisite artwork of iconic F1 moments, drivers, and cars. Follow and share the latest F1 news, session results, and creative illustrations every day.";

  const homeNews = [...news]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 3);
  
  // Always show latest portfolio items (not albums)
  const displayWorks = portfolio.slice(0, 9);

  // Portfolio carousel state - always use portfolio items
  const carouselItems = displayWorks.map(w => ({ 
    id: w.id, 
    href: `/portfolio/${w.id}`, 
    imageUrl: w.image_url, 
    title: language === "ja" ? w.title_ja || w.title_en : w.title_en, 
    sub: "" 
  }));

  const [carouselIndex, setCarouselIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (carouselItems.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % carouselItems.length);
    }, 5000);
  }, [carouselItems.length]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goTo = (idx: number) => {
    setCarouselIndex(idx);
    startTimer();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col text-black">
      <SiteHeader />
      <main className="flex-1">
        <section id="top" className="py-12 md:py-24 text-center bg-white">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 md:mb-6 tracking-tighter px-4">rt18_formula1</h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto px-4 mb-6 md:mb-8 text-gray-600 font-medium">{heroText}</p>
        </section>
        
        <div className="h-px bg-black/10" />

        {/* News Section - 3 items */}
        <section id="news" className="pt-6 md:pt-8 pb-12 md:pb-20 border-b border-black/10">
          <div className="container mx-auto px-4">
            <div className="sticky top-[73px] z-10 bg-white/95 backdrop-blur-sm py-3 md:py-4 mb-4 md:mb-6 border-b border-black flex items-end justify-between">
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter">{t("newsSection")}</h2>
              <Link href="/news" className="text-xs md:text-sm font-black uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2">
                {t("newsMore")}
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {homeNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="group bg-white border border-black/10 rounded-2xl overflow-hidden hover:shadow-2xl transition-all block"
                >
                  <div className="w-full bg-black/5 border-b border-black/10 aspect-video relative overflow-hidden">
                    {item.image_url ? (() => {
                        const imageProps = generateImageProps(item.image_url, language === "ja" ? item.title_ja || item.title_en : item.title_en, "news");
                        return imageProps ? (
                          <img 
                            {...imageProps}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : null;
                      })() : (
                      <div className="w-full h-full flex items-center justify-center text-4xl md:text-6xl">📰</div>
                    )}
                  </div>
                  <div className="p-4 md:p-6">
                    <p className="text-xs font-bold mb-2 md:mb-3 text-gray-400 uppercase tracking-widest">{item.published_at.split('T')[0]}</p>
                    <h3 className="text-base md:text-xl font-black line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {language === "ja" ? item.title_ja || item.title_en : item.title_en}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio Section - Carousel on mobile, grid on desktop */}
        <section id="portfolio" className="pt-6 md:pt-8 pb-12 md:pb-20 border-b border-black/10 bg-gray-50/30">
          <div className="container mx-auto px-4">
            <div className="sticky top-[73px] z-10 bg-white/95 backdrop-blur-sm py-3 md:py-4 mb-4 md:mb-6 border-b border-black flex items-end justify-between">
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter">{t("portfolioSection")}</h2>
              <Link href="/portfolio" className="text-xs md:text-sm font-black uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2">
                {t("newsMore")}
              </Link>
            </div>

            {/* Mobile/Tablet: Single-column carousel with auto-slide */}
            <div className="lg:hidden">
              <div className="overflow-hidden rounded-2xl">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                >
                  {carouselItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="w-full shrink-0 group border border-black/10 rounded-2xl overflow-hidden bg-white block"
                    >
                      <div className="aspect-square bg-black/5 relative overflow-hidden">
                        {item.imageUrl ? (() => {
                          const imageProps = generateImageProps(item.imageUrl, item.title, "portfolio");
                          return imageProps ? (
                            <img {...imageProps} className="w-full h-full object-cover" />
                          ) : null;
                        })() : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">🎨</div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-black text-lg line-clamp-2">{item.title}</h3>
                        {item.sub && <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mt-1">{item.sub}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              {/* Dots indicator */}
              {carouselItems.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {carouselItems.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`w-2.5 h-2.5 rounded-full transition-all ${idx === carouselIndex ? "bg-black scale-110" : "bg-black/20"}`}
                      onClick={() => goTo(idx)}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: 3-column carousel with auto-slide */}
            <div className="hidden lg:block">
              <div className="overflow-hidden rounded-2xl">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${carouselIndex * (100/3)}%)` }}
                >
                  {carouselItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="w-1/3 shrink-0 group border border-black/10 rounded-2xl overflow-hidden bg-white block px-2"
                    >
                      <div className="aspect-square bg-black/5 relative overflow-hidden">
                        {item.imageUrl ? (() => {
                          const imageProps = generateImageProps(item.imageUrl, item.title, "portfolio");
                          return imageProps ? (
                            <img {...imageProps} className="w-full h-full object-cover" />
                          ) : null;
                        })() : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">🎨</div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="font-black text-lg line-clamp-2">{item.title}</h3>
                        {item.sub && <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mt-1">{item.sub}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              {/* Dots indicator */}
              {carouselItems.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {carouselItems.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`w-2.5 h-2.5 rounded-full transition-all ${idx === carouselIndex ? "bg-black scale-110" : "bg-black/20"}`}
                      onClick={() => goTo(idx)}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Calendar Section */}
        <section id="calendar" className="pt-6 md:pt-8 pb-12 md:pb-20 border-b border-black/10">
          <div className="container mx-auto px-4">
            <div className="sticky top-[73px] z-10 bg-white/95 backdrop-blur-sm py-3 md:py-4 mb-4 md:mb-6 border-b border-black flex items-end justify-between">
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter">{t("navCalendar")}</h2>
              <Link href="/calendar" className="text-xs md:text-sm font-black uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2">
                {t("newsMore")}
              </Link>
            </div>

            <div className="max-w-4xl">
              {events
                .filter(event => new Date(event.end_time || event.start_time).getTime() > new Date().getTime())
                .slice(0, 5)
                .map((event) => (
                <button 
                  key={event.id} 
                  onClick={() => setSelectedEvent(event)}
                  className="w-full group border-b border-black/5 py-4 md:py-6 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 hover:bg-gray-50/50 px-4 -mx-4 rounded-xl transition-all text-left"
                >
                  <div className="md:w-48 shrink-0">
                    <p className="text-xs md:text-sm font-black text-gray-400">
                      {new Date(event.start_time).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-black group-hover:text-blue-600 transition-colors">
                      {event.title}
                    </h3>
                    {event.location && (
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mt-1">
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                  <div className="md:w-24 shrink-0 flex md:justify-end">
                    <span className="text-[10px] font-black px-2 py-1 bg-black/5 rounded uppercase tracking-widest text-gray-500">
                      {event.source === 'google' ? 'Race' : 'Event'}
                    </span>
                  </div>
                </button>
              ))}
              {events.length === 0 && (
                <p className="text-gray-400 font-medium">No upcoming events scheduled.</p>
              )}
            </div>
          </div>
        </section>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <div 
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl md:rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`h-2 shrink-0 ${selectedEvent.source === 'google' ? 'bg-blue-600' : 'bg-black'}`} />
              
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <div className="p-6 md:p-12">
                  <div className="flex justify-between items-start mb-6 md:mb-8">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedEvent.source === 'google' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {selectedEvent.source === 'google' ? 'Race Schedule' : 'Event'}
                    </span>
                    <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-black text-2xl p-2 -mr-2 -mt-2 transition-colors">✕</button>
                  </div>
                  
                  <h3 className="text-2xl md:text-4xl font-black tracking-tighter mb-6 md:mb-8 leading-tight">
                    {selectedEvent.title}
                  </h3>
                  
                  <div className="space-y-6 md:space-y-8">
                    <div className="flex items-start gap-4 md:gap-5">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-lg md:text-xl shrink-0">📅</div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Date & Time</p>
                        <p className="font-bold text-base md:text-lg">
                          {new Date(selectedEvent.start_time).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {selectedEvent.location && (
                      <div className="flex items-start gap-4 md:gap-5">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-lg md:text-xl shrink-0">📍</div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Location</p>
                          <p className="font-bold text-base md:text-lg">{selectedEvent.location}</p>
                        </div>
                      </div>
                    )}

                    {selectedEvent.description && (
                      <div className="pt-6 md:pt-8 border-t border-black/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Details</p>
                        <div className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap break-words">
                          {selectedEvent.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-8 border-t border-black/5 bg-gray-50/50">
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="w-full py-3 md:py-4 bg-black text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-gray-800 transition-all shadow-xl"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <section id="profile" className="pt-6 md:pt-8 pb-12 md:pb-20 border-b border-black/10 bg-gray-50/30">
          <div className="container mx-auto px-4">
            <div className="sticky top-[73px] z-10 bg-white/95 backdrop-blur-sm py-3 md:py-4 mb-4 md:mb-6 border-b border-black">
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter">Profile</h2>
            </div>
            <div className="max-w-4xl">
              <p className="text-base md:text-xl font-medium mb-8 md:mb-12 leading-relaxed text-gray-700">{profileText}</p>

              <div className="flex flex-wrap justify-start gap-4 md:gap-6 mb-10 md:mb-16">
                {snsLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-14 h-14 md:w-20 md:h-20 bg-white border border-black/10 rounded-2xl hover:bg-black/5 hover:scale-110 transition-all shadow-sm"
                    title={link.name}
                  >
                    <img {...generateImageProps(link.icon, link.name, "sns")} className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                  </a>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {linktreeLinks.map((link) => (
                  <a
                    key={link.title}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 border border-black/10 rounded-xl text-center hover:bg-black hover:text-white transition-all text-[10px] md:text-xs font-black uppercase tracking-widest shadow-sm"
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact/Request */}
        <div className="flex flex-col">
          <section id="request" className="pt-6 md:pt-8 pb-16 md:pb-24 px-4 border-b border-black/10 text-center bg-white">
            <div className="sticky top-[73px] z-10 bg-white/95 backdrop-blur-sm py-3 md:py-4 mb-4 md:mb-6 border-b border-black text-left container mx-auto">
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter">{t("requestHeading")}</h2>
            </div>
            <p className="mb-8 md:mb-10 text-gray-500 font-medium text-sm md:text-base">{t("requestText")}</p>
            <a
              href="https://forms.gle/7vbRQrDKF4MZpv1G8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 md:px-10 py-3 md:py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-black/90 transition-all rounded-full text-sm"
            >
              {t("requestBtn")}
            </a>
          </section>

          <section id="contact" className="pt-6 md:pt-8 pb-12 md:pb-20 px-4 text-center bg-gray-50/30">
            <div className="sticky top-[73px] z-10 bg-white/95 backdrop-blur-sm py-3 md:py-4 mb-4 md:mb-6 border-b border-black text-left container mx-auto">
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter">{t("contactHeading")}</h2>
            </div>
            <p className="mb-8 md:mb-10 text-gray-500 font-medium text-sm md:text-base">{t("contactText")}</p>
            <a
              href="https://forms.gle/sCnwiNJ5gkLLt9Bn8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 md:px-10 py-3 md:py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-black/90 transition-all rounded-full text-sm"
            >
              {t("contactBtn")}
            </a>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
