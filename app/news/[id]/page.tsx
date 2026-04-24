import NewsDetailClient from "@/components/news-detail-client";
import { getNewsById } from "@/lib/supabase-queries";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function NewsDetailPage({ params }: { params: { id: string } }) {
  const newsItem = await getNewsById(params.id);
  
  if (!newsItem) {
    notFound();
  }
  
  return <NewsDetailClient newsItem={newsItem} />;
}
