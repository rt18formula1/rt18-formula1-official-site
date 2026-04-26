import { supabase } from "./supabaseClient";

export type DbNews = {
  id: string;
  title_en: string;
  title_ja: string;
  body_en: string;
  body_ja: string;
  image_url: string | null;
  published_at: string;
  created_at: string;
};

export type DbPortfolio = {
  id: string;
  title_en: string;
  title_ja: string;
  body_en: string;
  body_ja: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
};

export type DbAlbum = {
  id: string;
  name_en: string;
  name_ja: string;
  description_en: string;
  description_ja: string;
  cover_image_url: string | null;
  parent_id: string | null;
  type: "backnumber" | "portfolio";
  tags: string[];
  sort_order: number;
  created_at: string;
};

export type DbEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  is_all_day: boolean;
  color: string;
  source: 'manual' | 'google';
  created_at: string;
};


// ----------------------------------------------------------------------
// Storage Upload
// ----------------------------------------------------------------------

export async function uploadImageToStorage(
  bucket: "news-images" | "portfolio-images" | "album-covers" | "bucknumber-covers",
  file: File
): Promise<string> {
  const signRes = await fetch("/api/admin/upload", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      bucket,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    }),
  });

  if (!signRes.ok) {
    let errMsg = "Upload failed";
    try {
      const err = await signRes.json();
      errMsg = err.error || errMsg;
    } catch { /* ignore json parse error */ }
    throw new Error(`画像アップロード準備に失敗しました: ${errMsg} (HTTP ${signRes.status})`);
  }

  const signed = (await signRes.json()) as { uploadUrl?: string; url?: string };
  if (!signed.uploadUrl || !signed.url) {
    throw new Error("アップロードURLの取得に失敗しました");
  }

  const uploadRes = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      // CORS対応のための追加ヘッダー
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT, POST, GET, OPTIONS, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-MD5",
    },
    body: file,
  });

  if (!uploadRes.ok) {
    const message = await uploadRes.text().catch(() => "Unknown upload error");
    console.error("R2 upload failed:", {
      status: uploadRes.status,
      statusText: uploadRes.statusText,
      message,
      uploadUrl: signed.uploadUrl,
      contentType: file.type,
      fileSize: file.size,
    });
    throw new Error(`R2 への直接アップロードに失敗しました: ${message} (HTTP ${uploadRes.status})`);
  }

  return signed.url;
}

// ----------------------------------------------------------------------
// News CRUD
// ----------------------------------------------------------------------

export async function getNewsList() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching news:", error);
    return [];
  }
  return data as DbNews[];
}

export async function getNewsById(id: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("news").select("*").eq("id", id).single();
  if (error) return null;
  return data as DbNews;
}

export async function createNews(news: Partial<DbNews>) {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { data, error } = await supabase.from("news").insert(news).select().single();
  if (error) throw error;
  return data as DbNews;
}

export async function updateNews(id: string, news: Partial<DbNews>) {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { data, error } = await supabase.from("news").update(news).eq("id", id).select().single();
  if (error) throw error;
  return data as DbNews;
}

export async function deleteNews(id: string) {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) throw error;
}

// ----------------------------------------------------------------------
// Portfolio CRUD
// ----------------------------------------------------------------------

export async function getPortfolioList() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("portfolio").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching portfolio:", error);
    return [];
  }
  return data as DbPortfolio[];
}

export async function getPortfolioById(id: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("portfolio").select("*").eq("id", id).single();
  if (error) return null;
  return data as DbPortfolio;
}

export async function getPortfolioByIds(ids: string[]) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("portfolio").select("*").in("id", ids);
  if (error) return [];
  return data as DbPortfolio[];
}

export async function createPortfolio(portfolio: Partial<DbPortfolio>) {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { data, error } = await supabase.from("portfolio").insert(portfolio).select().single();
  if (error) throw error;
  return data as DbPortfolio;
}

export async function updatePortfolio(id: string, portfolio: Partial<DbPortfolio>) {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { data, error } = await supabase.from("portfolio").update(portfolio).eq("id", id).select().single();
  if (error) throw error;
  return data as DbPortfolio;
}

export async function deletePortfolio(id: string) {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { error } = await supabase.from("portfolio").delete().eq("id", id);
  if (error) throw error;
}

// ----------------------------------------------------------------------
// Albums CRUD
// ----------------------------------------------------------------------

export async function getAlbumsByType(type: "backnumber" | "portfolio") {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .eq("type", type)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching albums:", error);
    return [];
  }
  return data as DbAlbum[];
}

export async function createAlbum(album: Partial<DbAlbum>) {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { data, error } = await supabase.from("albums").insert(album).select().single();
  if (error) throw error;
  return data as DbAlbum;
}

export async function deleteAlbum(id: string) {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) throw error;
}

// ----------------------------------------------------------------------
// Intermediary Tables (Many-to-Many) - Corrected table names
// ----------------------------------------------------------------------

export async function addNewsToAlbum(album_id: string, news_id: string) {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { error } = await supabase.from("news_albums").insert({ album_id, news_id });
  if (error) throw error;
}

export async function addPortfolioToAlbum(album_id: string, portfolio_id: string) {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { error } = await supabase.from("portfolio_albums").insert({ album_id, portfolio_id });
  if (error) throw error;
}

export async function getNewsByAlbumId(album_id: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("news_albums")
    .select(`
      news_id,
      news (*)
    `)
    .eq("album_id", album_id);

  if (error) {
    console.error("Error fetching news for album:", error);
    return [];
  }
  return ((data as unknown as { news: DbNews | null }[]) ?? []).map(item => item.news).filter(Boolean) as DbNews[];
}

export async function getPortfolioByAlbumId(album_id: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("portfolio_albums")
    .select(`
      portfolio_id,
      portfolio (*)
    `)
    .eq("album_id", album_id);

  if (error) {
    console.error("Error fetching portfolio for album:", error);
    return [];
  }
  return ((data as unknown as { portfolio: DbPortfolio | null }[]) ?? []).map(item => item.portfolio).filter(Boolean) as DbPortfolio[];
}

export async function getPortfolioAlbumsMapping() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("portfolio_albums").select("*");
  if (error) return [];
  return data as { portfolio_id: string; album_id: string }[];
}

export async function getNewsAlbumsMapping() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("news_albums").select("*");
  if (error) return [];
  return data as { news_id: string; album_id: string }[];
}

// ----------------------------------------------------------------------
// Navigation Helpers (Prev/Next)
// ----------------------------------------------------------------------

export async function getAdjacentNews(currentPublishedAt: string) {
  if (!supabase) return { prev: null, next: null };
  const { data: prev } = await supabase
    .from("news")
    .select("id, title_en")
    .lt("published_at", currentPublishedAt)
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  const { data: next } = await supabase
    .from("news")
    .select("id, title_en")
    .gt("published_at", currentPublishedAt)
    .order("published_at", { ascending: true })
    .limit(1)
    .single();

  return { prev, next };
}

export async function getAdjacentPortfolio(currentSortOrder: number) {
  if (!supabase) return { prev: null, next: null };
  const { data: prev } = await supabase
    .from("portfolio")
    .select("id, title_en")
    .lt("sort_order", currentSortOrder)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const { data: next } = await supabase
    .from("portfolio")
    .select("id, title_en")
    .gt("sort_order", currentSortOrder)
    .order("sort_order", { ascending: true })
    .limit(1)
    .single();

  return { prev, next };
}

// ----------------------------------------------------------------------
// Events CRUD
// ----------------------------------------------------------------------

export async function getEvents() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_time", { ascending: true });
    
  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }
  return data as DbEvent[];
}

