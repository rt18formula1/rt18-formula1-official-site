import { getPortfolioById, getAdjacentPortfolio } from "@/lib/supabase-queries";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareButtons } from "@/components/share-buttons";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getPortfolioById(id);

  if (!item) {
    notFound();
  }

  const { prev, next } = await getAdjacentPortfolio(item.sort_order);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <Link href="/portfolio" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Portfolio
          </Link>
        </div>

        <div className="space-y-12 mb-20">
          {item.image_url ? (
            <div className="rounded-3xl overflow-hidden border border-black/10 bg-black/5 shadow-2xl">
              <img src={item.image_url} alt={item.title_en} className="w-full h-auto" />
            </div>
          ) : (
            <div className="aspect-square bg-black/5 rounded-3xl flex items-center justify-center text-8xl">
              🎨
            </div>
          )}

          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">{item.title_en}</h1>
            {item.body_en && (
              <div className="prose prose-xl max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">
                {item.body_en}
              </div>
            )}
          </div>
        </div>

        {/* Share Section */}
        <ShareButtons title={item.title_en} />

        {/* Navigation */}
        <div className="border-t border-black/10 pt-12 flex flex-col md:flex-row gap-8 justify-between items-center mb-12">
          {prev ? (
            <Link href={`/portfolio/${prev.id}`} className="group flex-1 flex items-center gap-4 text-left w-full">
              <div className="text-4xl font-light text-gray-300 group-hover:text-black transition-colors">←</div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Previous</p>
                <p className="font-bold line-clamp-1">{prev.title_en}</p>
              </div>
            </Link>
          ) : <div className="flex-1" />}

          {next ? (
            <Link href={`/portfolio/${next.id}`} className="group flex-1 flex items-center gap-4 text-right justify-end w-full">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Next</p>
                <p className="font-bold line-clamp-1">{next.title_en}</p>
              </div>
              <div className="text-4xl font-light text-gray-300 group-hover:text-black transition-colors">→</div>
            </Link>
          ) : <div className="flex-1" />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

