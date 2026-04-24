import { SiteHeader } from "@/components/site-header";
import { getAlbumsByType, getNewsByAlbumId } from "@/lib/supabase-queries";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

export const revalidate = 60;

export default async function BacknumberAlbumPage({ params }: { params: { album_id: string } }) {
  // First verify the album exists
  const albums = await getAlbumsByType("backnumber");
  const album = albums.find((a) => a.id === params.album_id);

  if (!album) {
    notFound();
  }

  // Fetch news belonging to this album
  const newsList = await getNewsByAlbumId(album.id);

  return (
    <div className="min-h-screen bg-white text-black">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/news" className="text-gray-500 hover:underline mb-4 inline-block">
            ← Back to News
          </Link>
          <h1 className="text-4xl font-bold mb-2">
            {album.name_en}
          </h1>
          {album.description_en && (
            <p className="text-gray-600">{album.description_en}</p>
          )}
        </div>

        <div className="space-y-6">
          {newsList.length === 0 ? (
            <p className="text-gray-500">No articles in this album.</p>
          ) : (
            newsList.map((newsItem) => (
              <Link
                key={newsItem.id}
                href={`/news/${newsItem.id}`}
                className="border border-black/10 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer block"
              >
                <div className="p-6">
                  <div className="flex gap-4 mb-4">
                    <div className="w-24 h-24 bg-black/5 border border-black/10 rounded flex items-center justify-center flex-shrink-0 text-2xl relative overflow-hidden">
                      {newsItem.image_url ? (
                        <Image src={newsItem.image_url} alt="News thumbnail" fill className="object-cover" />
                      ) : (
                        <span>📰</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm mb-2 text-gray-500">{newsItem.published_at.split("T")[0]}</p>
                      <h2 className="text-2xl font-bold mb-3">{newsItem.title_en}</h2>
                    </div>
                  </div>
                  <div className="font-semibold hover:underline">Read more →</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
