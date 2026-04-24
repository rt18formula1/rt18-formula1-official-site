import PortfolioPageClient from "@/components/portfolio-page-client";
import { getPortfolioList, getAlbumsByType, getAlbumRelations } from "@/lib/supabase-queries";

export const revalidate = 60;

export default async function PortfolioPage() {
  const [portfolio, albums, relations] = await Promise.all([
    getPortfolioList(),
    getAlbumsByType("portfolio"),
    getAlbumRelations(),
  ]);

  return <PortfolioPageClient portfolio={portfolio} albums={albums} relations={relations} />;
}
