import PortfolioDetailClient from "@/components/portfolio-detail-client";
import { getPortfolioById } from "@/lib/supabase-queries";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function PortfolioDetailPage({ params }: { params: { id: string } }) {
  const portfolioItem = await getPortfolioById(params.id);
  
  if (!portfolioItem) {
    notFound();
  }
  
  return <PortfolioDetailClient portfolioItem={portfolioItem} />;
}
