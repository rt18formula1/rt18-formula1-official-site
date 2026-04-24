"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import {
  getNewsList,
  getPortfolioList,
  getAlbumsByType,
  createNews,
  createPortfolio,
  createAlbum,
  deleteNews,
  deletePortfolio,
  deleteAlbum,
  uploadImageToStorage,
  addNewsToAlbum,
  addPortfolioToAlbum,
  type DbNews,
  type DbPortfolio,
  type DbAlbum,
} from "@/lib/supabase-queries";

export default function AdminPage() {
  const [sessionOk, setSessionOk] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [news, setNews] = useState<DbNews[]>([]);
  const [portfolio, setPortfolio] = useState<DbPortfolio[]>([]);
  const [albums, setAlbums] = useState<DbAlbum[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setSessionOk(Boolean(data.ok));
        if (data.ok) loadData();
      })
      .catch(() => setSessionOk(false));
  }, []);

  const loadData = async () => {
    const [n, p, a] = await Promise.all([
      getNewsList(),
      getPortfolioList(),
      getAlbumsByType("portfolio").then((res) => res.concat(await getAlbumsByType("backnumber"))),
    ]);
    setNews(n);
    setPortfolio(p);
    setAlbums(a);
  };

  const login = async () => {
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "ログインに失敗しました");
      return;
    }
    setSessionOk(true);
    setPassword("");
    loadData();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setSessionOk(false);
  };

  // ------------------------------------------------------------------
  // CRUD Actions
  // ------------------------------------------------------------------

  const handleAddNews = async () => {
    const title_en = prompt("News title (English)?");
    if (!title_en) return;
    const body_en = prompt("News content (English)?") || "";
    
    // Create a temporary file input element
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      setLoading(true);
      try {
        let image_url = null;
        if (file) {
          image_url = await uploadImageToStorage("news-images", file);
        }
        await createNews({
          title_en,
          title_ja: title_en, // simplify for admin prompt
          body_en,
          body_ja: body_en,
          image_url,
          published_at: new Date().toISOString(),
        });
        await loadData();
        alert("Success!");
      } catch (err) {
        console.error(err);
        alert("Failed to add news.");
      } finally {
        setLoading(false);
      }
    };
    fileInput.click();
  };

  const handleAddPortfolio = async () => {
    const title_en = prompt("Portfolio title (English)?");
    if (!title_en) return;
    const body_en = prompt("Portfolio description (English)?") || "";
    
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      setLoading(true);
      try {
        let image_url = null;
        if (file) {
          image_url = await uploadImageToStorage("portfolio-images", file);
        }
        await createPortfolio({
          title_en,
          title_ja: title_en,
          body_en,
          body_ja: body_en,
          image_url,
          sort_order: portfolio.length,
        });
        await loadData();
        alert("Success!");
      } catch (err) {
        console.error(err);
        alert("Failed to add portfolio.");
      } finally {
        setLoading(false);
      }
    };
    fileInput.click();
  };

  const handleAddAlbum = async (type: "backnumber" | "portfolio") => {
    const name_en = prompt(`Enter ${type} album name (English)?`);
    if (!name_en) return;
    setLoading(true);
    try {
      await createAlbum({ name_en, name_ja: name_en, type, sort_order: albums.length });
      await loadData();
      alert("Success!");
    } catch (err) {
      console.error(err);
      alert("Failed to add album.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignNews = async (news_id: string) => {
    const album_id = prompt("Enter Backnumber Album ID to assign this news to:");
    if (!album_id) return;
    setLoading(true);
    try {
      await addNewsToAlbum(album_id, news_id);
      alert("Assigned successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to assign. Check Album ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPortfolio = async (portfolio_id: string) => {
    const album_id = prompt("Enter Portfolio Album ID to assign this item to:");
    if (!album_id) return;
    setLoading(true);
    try {
      await addPortfolioToAlbum(album_id, portfolio_id);
      alert("Assigned successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to assign. Check Album ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("Delete this news?")) return;
    setLoading(true);
    await deleteNews(id);
    await loadData();
    setLoading(false);
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm("Delete this portfolio item?")) return;
    setLoading(true);
    await deletePortfolio(id);
    await loadData();
    setLoading(false);
  };

  if (!sessionOk) {
    return (
      <div className="min-h-screen bg-white text-black">
        <SiteHeader />
        <div className="container mx-auto px-4 py-12 max-w-md">
          <h1 className="text-3xl font-black mb-6">Admin</h1>
          <label className="block text-sm font-semibold mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-black/20 rounded-lg mb-4"
          />
          {error ? <p className="text-sm mb-4 text-red-500">{error}</p> : null}
          <button type="button" onClick={login} className="w-full px-4 py-3 bg-black text-white font-semibold rounded-lg">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black pb-24">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black">Supabase Admin</h1>
            <p className="mt-2 text-green-600 font-bold">Connected to Supabase Database & Storage</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button type="button" onClick={logout} className="text-sm underline">Logout</button>
          </div>
        </div>

        {loading && <div className="fixed top-0 left-0 w-full h-1 bg-blue-500 animate-pulse z-50"></div>}

        <section className="border border-black/10 rounded-xl p-6 space-y-3">
          <h2 className="text-xl font-bold">Actions</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleAddNews} disabled={loading} className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50">
              + Add News (with Image)
            </button>
            <button type="button" onClick={handleAddPortfolio} disabled={loading} className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50">
              + Add Portfolio (with Image)
            </button>
            <button type="button" onClick={() => handleAddAlbum("backnumber")} disabled={loading} className="px-4 py-2 border border-black text-black rounded-lg disabled:opacity-50">
              + Add Backnumber
            </button>
            <button type="button" onClick={() => handleAddAlbum("portfolio")} disabled={loading} className="px-4 py-2 border border-black text-black rounded-lg disabled:opacity-50">
              + Add Portfolio Album
            </button>
          </div>
        </section>

        <section className="border border-black/10 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold">News ({news.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-black/10">
                  <th className="py-2 pr-4">Image</th>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {news.map((n) => (
                  <tr key={n.id} className="border-b border-black/5">
                    <td className="py-2 pr-4">
                      {n.image_url ? (
                        <img src={n.image_url} alt="" className="w-16 h-10 object-cover rounded" />
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 font-bold">{n.title_en}</td>
                    <td className="py-2 pr-4">{n.published_at.split("T")[0]}</td>
                    <td className="py-2 pr-4 text-right flex gap-3 justify-end">
                      <button onClick={() => handleAssignNews(n.id)} className="text-blue-500 underline">Assign</button>
                      <button onClick={() => handleDeleteNews(n.id)} className="text-red-500 underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border border-black/10 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold">Portfolio ({portfolio.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-black/10">
                  <th className="py-2 pr-4">Image</th>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((p) => (
                  <tr key={p.id} className="border-b border-black/5">
                    <td className="py-2 pr-4">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-10 h-10 object-cover rounded-full" />
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 font-bold">{p.title_en}</td>
                    <td className="py-2 pr-4">{p.created_at.split("T")[0]}</td>
                    <td className="py-2 pr-4 text-right flex gap-3 justify-end">
                      <button onClick={() => handleAssignPortfolio(p.id)} className="text-blue-500 underline">Assign</button>
                      <button onClick={() => handleDeletePortfolio(p.id)} className="text-red-500 underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border border-black/10 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold">Albums ({albums.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-black/10">
                  <th className="py-2 pr-4">ID (For assignment)</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {albums.map((a) => (
                  <tr key={a.id} className="border-b border-black/5">
                    <td className="py-2 pr-4 font-mono text-xs">{a.id}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded text-xs ${a.type === 'backnumber' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {a.type}
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-bold">{a.name_en}</td>
                    <td className="py-2 pr-4 text-right">
                      <button onClick={async () => {
                        if (confirm("Delete album?")) {
                          await deleteAlbum(a.id);
                          loadData();
                        }
                      }} className="text-red-500 underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
