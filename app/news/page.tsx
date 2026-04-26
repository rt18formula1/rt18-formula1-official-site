import NewsPageClient from "@/components/news-page-client";
import { getNewsAlbumsMapping, getNewsList, getAlbumsByType } from "@/lib/supabase-queries";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function NewsPage() {
  const [news, albums, mapping] = await Promise.all([
    getNewsList(),
    getAlbumsByType("backnumber"),
    getNewsAlbumsMapping(),
  ]);

  return <NewsPageClient news={news} albums={albums} mapping={mapping} />;
}
