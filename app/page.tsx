import HomeClient from "@/components/home-client";
import { getNewsList, getPortfolioList, getEvents } from "@/lib/supabase-queries";
import { fetchGoogleEvents } from "@/lib/calendar-service";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function Home() {
  const [news, portfolio, manualEvents, googleEvents] = await Promise.all([
    getNewsList(),
    getPortfolioList(),
    getEvents(),
    fetchGoogleEvents(),
  ]);

  const allEvents = [...manualEvents, ...googleEvents].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "rt18_formula1 Official Website",
    description: "F1 art portfolio and race news by rt18_formula1",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://rt18-formula1-official-site.vercel.app",
    inLanguage: ["en", "ja"],
    author: {
      "@type": "Person",
      name: "rt18_formula1",
    },
  };

  return (
    <>
      <HomeClient news={news} portfolio={portfolio} events={allEvents} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
