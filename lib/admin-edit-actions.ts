"use server";

import { supabaseAdmin } from "./supabaseAdmin";
import type { DbNews, DbPortfolio } from "./supabase-queries";

export async function updateNewsTitle(id: string, title_en: string, title_ja: string) {
  const { data, error } = await supabaseAdmin
    .from("news")
    .update({ title_en, title_ja })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as DbNews;
}

export async function updatePortfolioTitle(id: string, title_en: string, title_ja: string) {
  const { data, error } = await supabaseAdmin
    .from("portfolio")
    .update({ title_en, title_ja })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as DbPortfolio;
}

export async function updateNewsContent(id: string, body_en: string, body_ja: string) {
  const { data, error } = await supabaseAdmin
    .from("news")
    .update({ body_en, body_ja })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as DbNews;
}

export async function updatePortfolioContent(id: string, body_en: string, body_ja: string) {
  const { data, error } = await supabaseAdmin
    .from("portfolio")
    .update({ body_en, body_ja })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as DbPortfolio;
}
