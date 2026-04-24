import HomeClient from "@/components/home-client";
import { getNewsList, getPortfolioList } from "@/lib/supabase-queries";

export const revalidate = 60;

export default async function Home() {
  const [news, portfolio] = await Promise.all([
    getNewsList(),
    getPortfolioList(),
  ]);

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
      <HomeClient news={news} portfolio={portfolio} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
