import NewsPageClient from "@/components/news-page-client";
import { getNewsList, getAlbumsByType } from "@/lib/supabase-queries";

export const revalidate = 60;

export default async function NewsPage() {
  const [news, albums] = await Promise.all([
    getNewsList(),
    getAlbumsByType("backnumber"),
  ]);

  return <NewsPageClient news={news} albums={albums} />;
}
