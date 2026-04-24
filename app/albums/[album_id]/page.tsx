import { SiteHeader } from "@/components/site-header";
import { getAlbumsByType, getPortfolioByAlbumId } from "@/lib/supabase-queries";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

export const revalidate = 60;

export default async function PortfolioAlbumPage({ params }: { params: { album_id: string } }) {
  // First verify the album exists
  const albums = await getAlbumsByType("portfolio");
  const album = albums.find((a) => a.id === params.album_id);

  if (!album) {
    notFound();
  }

  // Fetch portfolio items belonging to this album
  const portfolioList = await getPortfolioByAlbumId(album.id);

  return (
    <div className="min-h-screen bg-white text-black">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/portfolio" className="text-gray-500 hover:underline mb-4 inline-block">
            ← Back to Portfolio
          </Link>
          <h1 className="text-4xl font-bold mb-2">
            {album.name_en}
          </h1>
          {album.description_en && (
            <p className="text-gray-600">{album.description_en}</p>
          )}
        </div>

        {portfolioList.length === 0 ? (
          <p className="text-gray-500">No works in this album.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioList.map((work) => (
              <Link
                key={work.id}
                href={`/portfolio/${work.id}`}
                className="border border-black/10 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
              >
                <div className="aspect-square bg-black/5 border-b border-black/10 overflow-hidden flex items-center justify-center text-5xl relative">
                  {work.image_url ? (
                    <Image src={work.image_url} alt="Portfolio item" fill className="object-cover" />
                  ) : (
                    <span>🎨</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{work.title_en}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
