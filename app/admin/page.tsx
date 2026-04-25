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

import { AdminImageCard } from "@/components/admin-image-card";

export default function AdminPage() {
  const [sessionOk, setSessionOk] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [news, setNews] = useState<DbNews[]>([]);
  const [portfolio, setPortfolio] = useState<DbPortfolio[]>([]);
  const [albums, setAlbums] = useState<DbAlbum[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [activeModal, setActiveModal] = useState<"news" | "portfolio" | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    file: null as File | null,
    previewUrl: "",
    albumId: "",
  });

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
    const [n, p, a1, a2] = await Promise.all([
      getNewsList(),
      getPortfolioList(),
      getAlbumsByType("portfolio"),
      getAlbumsByType("backnumber"),
    ]);
    setNews(n);
    setPortfolio(p);
    setAlbums([...a1, ...a2]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
  };

  const handlePost = async () => {
    if (!formData.title || !formData.file) {
      alert("Title and Image are required!");
      return;
    }
    setLoading(true);
    try {
      if (activeModal === "news") {
        const image_url = await uploadImageToStorage("news-images", formData.file);
        await createNews({
          title_en: formData.title,
          title_ja: formData.title,
          body_en: formData.content,
          body_ja: formData.content,
          image_url,
          published_at: new Date().toISOString(),
        });
      } else if (activeModal === "portfolio") {
        const image_url = await uploadImageToStorage("portfolio-images", formData.file);
        const p = await createPortfolio({
          title_en: formData.title,
          title_ja: formData.title,
          body_en: formData.content,
          body_ja: formData.content,
          image_url,
          sort_order: portfolio.length,
        });
        if (formData.albumId) {
          await addPortfolioToAlbum(formData.albumId, p.id);
        }
      }
      await loadData();
      setActiveModal(null);
      setFormData({ title: "", content: "", file: null, previewUrl: "", albumId: "" });
      alert("Shared successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to post.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlbum = async (type: "backnumber" | "portfolio") => {
    const name_en = prompt(`Enter ${type} album name (English)?`);
    if (!name_en) return;
    setLoading(true);
    try {
      await createAlbum({ name_en, name_ja: name_en, type, sort_order: albums.length });
      await loadData();
    } catch (err) {
      console.error(err);
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
      <div className="container mx-auto px-4 py-10 max-w-6xl space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">Admin Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveModal("portfolio")}
              className="px-6 py-2 bg-black text-white font-bold rounded-full hover:bg-black/80 transition"
            >
              + Create Portfolio
            </button>
            <button
              onClick={() => setActiveModal("news")}
              className="px-6 py-2 border-2 border-black font-bold rounded-full hover:bg-black/5 transition"
            >
              + Create News
            </button>
            <button onClick={logout} className="text-sm underline">Logout</button>
          </div>
        </div>

        {loading && <div className="fixed top-0 left-0 w-full h-1 bg-blue-500 animate-pulse z-50"></div>}

        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <h2 className="text-xl font-bold">Portfolio ({portfolio.length})</h2>
            <button onClick={() => handleAddAlbum("portfolio")} className="text-sm font-bold underline">+ New Album</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {portfolio.map((p) => (
              <AdminImageCard
                key={p.id}
                id={p.id}
                title={p.title_en}
                imageUrl={p.image_url}
                date={p.created_at}
                type="portfolio"
                onDelete={() => handleDeletePortfolio(p.id)}
                onAssign={() => {
                  const aid = prompt("Album ID?");
                  if (aid) addPortfolioToAlbum(aid, p.id).then(() => alert("Assigned!"));
                }}
                onCopyEmbed={() => {
                  navigator.clipboard.writeText(`[portfolio:${p.id}]`);
                  alert("Copied to clipboard!");
                }}
              />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <h2 className="text-xl font-bold">News ({news.length})</h2>
            <button onClick={() => handleAddAlbum("backnumber")} className="text-sm font-bold underline">+ New Backnumber</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {news.map((n) => (
              <AdminImageCard
                key={n.id}
                id={n.id}
                title={n.title_en}
                imageUrl={n.image_url}
                date={n.published_at}
                type="news"
                onDelete={() => handleDeleteNews(n.id)}
                onAssign={() => {
                  const aid = prompt("Album ID?");
                  if (aid) addNewsToAlbum(aid, n.id).then(() => alert("Assigned!"));
                }}
                onCopyEmbed={() => {
                  navigator.clipboard.writeText(`[news:${n.id}]`);
                  alert("Copied to clipboard!");
                }}
              />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <h2 className="text-xl font-bold">Albums ({albums.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {albums.map((a) => (
              <div key={a.id} className="p-4 border border-black/10 rounded-lg flex items-center justify-between bg-white shadow-sm">
                <div>
                  <p className="text-[10px] font-mono text-gray-400">{a.id}</p>
                  <p className="font-bold">{a.name_en}</p>
                  <span className="text-[10px] uppercase bg-black/5 px-1.5 py-0.5 rounded">{a.type}</span>
                </div>
                <button onClick={() => {
                  if (confirm("Delete?")) deleteAlbum(a.id).then(() => loadData());
                }} className="text-red-500 text-xs hover:underline">Delete</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Instagram-style Creation Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-10">
          <div className="bg-white w-full max-w-4xl h-full max-h-[600px] rounded-xl overflow-hidden flex flex-col">
            <div className="h-12 border-b border-black/10 flex items-center justify-between px-4 shrink-0">
              <button onClick={() => setActiveModal(null)} className="font-bold text-sm">Cancel</button>
              <h3 className="font-bold">Create New {activeModal === "news" ? "News" : "Post"}</h3>
              <button
                onClick={handlePost}
                disabled={loading}
                className="text-blue-500 font-bold text-sm disabled:opacity-30"
              >
                {loading ? "Posting..." : "Share"}
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Image Preview */}
              <div className="flex-1 bg-black/5 flex flex-col items-center justify-center relative group min-h-[300px]">
                {formData.previewUrl ? (
                  <img src={formData.previewUrl} className="w-full h-full object-contain" alt="Preview" />
                ) : (
                  <div className="text-center p-10">
                    <div className="text-6xl mb-4">🖼️</div>
                    <p className="text-sm font-bold text-gray-500 mb-4">Drag photos and videos here</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="modal-file-input"
                    />
                    <label
                      htmlFor="modal-file-input"
                      className="px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg cursor-pointer hover:bg-blue-600"
                    >
                      Select from computer
                    </label>
                  </div>
                )}
                {formData.previewUrl && (
                  <button
                    onClick={() => setFormData({ ...formData, file: null, previewUrl: "" })}
                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Right Column: Metadata */}
              <div className="w-full md:w-[350px] border-l border-black/10 flex flex-col bg-white overflow-y-auto">
                <div className="p-4 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-xs">RT</div>
                    <span className="font-bold text-sm">rt18_formula1</span>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter title..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full text-sm font-bold focus:outline-none border-b border-black/5 pb-2"
                    />
                    <textarea
                      placeholder="Write a caption..."
                      rows={8}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full text-sm resize-none focus:outline-none"
                    />
                  </div>

                  {activeModal === "portfolio" && (
                    <div className="pt-4 border-t border-black/10">
                      <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Add to Album</label>
                      <select
                        value={formData.albumId}
                        onChange={(e) => setFormData({ ...formData, albumId: e.target.value })}
                        className="w-full text-sm bg-transparent focus:outline-none font-semibold"
                      >
                        <option value="">None (Standalone)</option>
                        {albums.filter(a => a.type === "portfolio").map(a => (
                          <option key={a.id} value={a.id}>{a.name_en}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
