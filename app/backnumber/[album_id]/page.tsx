import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getAlbumsByType, getNewsByAlbumId } from "@/lib/supabase-queries";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function BacknumberAlbumPage({ params }: { params: Promise<{ album_id: string }> }) {
  const { album_id } = await params;
  const albums = await getAlbumsByType("backnumber");
  const album = albums.find((a) => a.id === album_id);

  if (!album) {
    notFound();
  }

  const newsList = await getNewsByAlbumId(album.id);
  const childAlbums = albums.filter((item) => item.parent_id === album.id);

  const breadcrumbs: typeof albums = [];
  let cursor: (typeof album) | null = album;
  while (cursor) {
    breadcrumbs.unshift(cursor);
    const parentId: string | null = cursor.parent_id;
    cursor = parentId ? albums.find((item) => item.id === parentId) ?? null : null;
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        <header className="mb-12 border-b border-black/10 pb-12">
          <nav className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-gray-400 mb-8">
            <Link href="/news" className="hover:text-black transition-colors">News</Link>
            <span className="opacity-30">/</span>
            <Link href="/news" className="hover:text-black transition-colors">Backnumbers</Link>
            {breadcrumbs.map((crumb) => (
              <div key={crumb.id} className="flex items-center gap-3">
                <span className="opacity-30">/</span>
                <Link 
                  href={`/backnumber/${crumb.id}`} 
                  className={crumb.id === album.id ? "text-black border-b-2 border-black" : "hover:text-black transition-colors"}
                >
                  {crumb.name_en}
                </Link>
              </div>
            ))}
          </nav>
          
          <h1 className="text-5xl font-black mb-4 tracking-tighter">{album.name_en}</h1>
          {album.description_en && (
            <p className="text-xl text-gray-500 font-medium max-w-3xl leading-relaxed">{album.description_en}</p>
          )}
        </header>

        <div className="space-y-20 mb-20">
          {childAlbums.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-10">Subcollections</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {childAlbums.map((child) => (
                  <Link
                    key={child.id}
                    href={`/backnumber/${child.id}`}
                    className="group border border-black/10 rounded-2xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                  >
                    <div className="aspect-[4/3] bg-black/5 relative overflow-hidden">
                      {child.cover_image_url ? (
                        <img 
                          src={child.cover_image_url} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">📁</div>
                      )}
                    </div>
                    <div className="p-8">
                      <h3 className="text-2xl font-black mb-2">{child.name_en}</h3>
                      <p className="text-sm text-gray-500 font-medium line-clamp-2">{child.description_en}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-10">Articles</h2>
            <div className="grid grid-cols-1 gap-8">
              {newsList.length === 0 ? (
                <p className="text-gray-400 font-bold italic">No articles found in this collection.</p>
              ) : (
                newsList.map((newsItem) => (
                  <Link
                    key={newsItem.id}
                    href={`/news/${newsItem.id}`}
                    className="group flex flex-col md:flex-row gap-8 border border-black/10 rounded-3xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 p-6"
                  >
                    <div className="w-full md:w-48 aspect-video md:aspect-square bg-black/5 rounded-2xl overflow-hidden flex-shrink-0">
                      {newsItem.image_url ? (
                        <img src={newsItem.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">📰</div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{newsItem.published_at.split("T")[0]}</p>
                      <h3 className="text-3xl font-black mb-4 group-hover:text-blue-600 transition-colors leading-tight">{newsItem.title_en}</h3>
                      <p className="text-sm font-bold text-black group-hover:translate-x-2 transition-transform">Read full article →</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
