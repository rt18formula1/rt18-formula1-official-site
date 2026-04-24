import { supabase } from "./supabaseClient";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export type DbNews = {
  id: string;
  title_en: string;
  title_ja: string | null;
  body_en: any | null; // jsonb
  body_ja: any | null; // jsonb
  image_url: string | null;
  published_at: string;
  created_at: string;
};

export type DbPortfolio = {
  id: string;
  title_en: string;
  title_ja: string | null;
  body_en: string | null; // text
  body_ja: string | null; // text
  image_url: string | null;
  sort_order: number;
  created_at: string;
};

export type DbAlbum = {
  id: string;
  name_en: string;
  name_ja: string | null;
  description_en: string | null;
  description_ja: string | null;
  cover_image_url: string | null;
  type: "backnumber" | "portfolio" | null;
  tags: string[] | null;
  sort_order: number;
  created_at: string;
};

// ----------------------------------------------------------------------
// Storage Upload
// ----------------------------------------------------------------------

export async function uploadImageToStorage(
  bucket: "news-images" | "portfolio-images",
  file: File
): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("Storage upload error:", error);
    return null;
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

// ----------------------------------------------------------------------
// News CRUD
// ----------------------------------------------------------------------

export async function getNewsList() {
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
  const { data, error } = await supabase.from("news").select("*").eq("id", id).single();
  if (error) return null;
  return data as DbNews;
}

export async function createNews(news: Partial<DbNews>) {
  const { data, error } = await supabase.from("news").insert(news).select().single();
  if (error) throw error;
  return data as DbNews;
}

export async function deleteNews(id: string) {
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) throw error;
}

// ----------------------------------------------------------------------
// Portfolio CRUD
// ----------------------------------------------------------------------

export async function getPortfolioList() {
  const { data, error } = await supabase
    .from("portfolio")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching portfolio:", error);
    return [];
  }
  return data as DbPortfolio[];
}

export async function getPortfolioById(id: string) {
  const { data, error } = await supabase.from("portfolio").select("*").eq("id", id).single();
  if (error) return null;
  return data as DbPortfolio;
}

export async function createPortfolio(portfolio: Partial<DbPortfolio>) {
  const { data, error } = await supabase.from("portfolio").insert(portfolio).select().single();
  if (error) throw error;
  return data as DbPortfolio;
}

export async function deletePortfolio(id: string) {
  const { error } = await supabase.from("portfolio").delete().eq("id", id);
  if (error) throw error;
}

// ----------------------------------------------------------------------
// Albums CRUD
// ----------------------------------------------------------------------

export async function getAlbumsByType(type: "backnumber" | "portfolio") {
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

export async function createAlbum(album: Partial<DbAlbum>, parentId?: string) {
  const { data, error } = await supabase.from("albums").insert(album).select().single();
  if (error) throw error;

  if (parentId && data) {
    // 中間テーブルに親子関係を登録
    await supabase.from("album_relations").insert({
      parent_id: parentId,
      child_id: data.id,
      sort_order: 0,
    });
  }

  return data as DbAlbum;
}

export async function deleteAlbum(id: string) {
  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) throw error;
}

export async function getAlbumRelations() {
  const { data, error } = await supabase.from("album_relations").select("*");
  if (error) {
    console.error("Error fetching album relations:", error);
    return [];
  }
  return data as { parent_id: string; child_id: string; sort_order: number }[];
}

// ----------------------------------------------------------------------
// Intermediary Tables (Many-to-Many)
// ----------------------------------------------------------------------

export async function addNewsToAlbum(album_id: string, news_id: string) {
  const { error } = await supabase.from("album_news").insert({ album_id, news_id, sort_order: 0 });
  if (error) throw error;
}

export async function addPortfolioToAlbum(album_id: string, portfolio_id: string) {
  const { error } = await supabase.from("album_portfolio").insert({ album_id, portfolio_id, sort_order: 0 });
  if (error) throw error;
}

export async function getNewsByAlbumId(album_id: string) {
  const { data, error } = await supabase
    .from("album_news")
    .select(`
      news_id,
      news (*)
    `)
    .eq("album_id", album_id)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching news for album:", error);
    return [];
  }
  // data is an array of { news_id: string, news: DbNews }
  return data.map((item: any) => item.news as DbNews).filter(Boolean);
}

export async function getPortfolioByAlbumId(album_id: string) {
  const { data, error } = await supabase
    .from("album_portfolio")
    .select(`
      portfolio_id,
      portfolio (*)
    `)
    .eq("album_id", album_id)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching portfolio for album:", error);
    return [];
  }
  // data is an array of { portfolio_id: string, portfolio: DbPortfolio }
  return data.map((item: any) => item.portfolio as DbPortfolio).filter(Boolean);
}

