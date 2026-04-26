import NewsDetailClient from "@/components/news-detail-client";
import { getNewsById, getPortfolioByIds, getAdjacentNews } from "@/lib/supabase-queries";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const newsItem = await getNewsById(id);
  
  if (!newsItem) {
    notFound();
  }

  const { prev, next } = await getAdjacentNews(newsItem.published_at);

  // Parse body for embedded portfolio items [portfolio:uuid]
  const bodyText = newsItem.body_en || "";
  const portfolioIds = (bodyText.match(/\[portfolio:([a-f0-9-]+)\]/g) || [])
    .map(m => m.match(/\[portfolio:([a-f0-9-]+)\]/)![1]);
  
  const embeddedPortfolio = portfolioIds.length > 0 
    ? await getPortfolioByIds(portfolioIds)
    : [];
  
  return (
    <NewsDetailClient 
      newsItem={newsItem} 
      embeddedPortfolio={embeddedPortfolio} 
      prev={prev} 
      next={next} 
    />
  );
}
