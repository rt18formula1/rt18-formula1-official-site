"use server";

import { supabaseAdmin } from "./supabaseAdmin";
import type { DbNews, DbPortfolio, DbAlbum, DbEvent } from "./supabase-queries";

export async function createNewsAction(news: Partial<DbNews>) {
  const { data, error } = await supabaseAdmin.from("news").insert(news).select().single();
  if (error) throw error;
  return data as DbNews;
}

export async function createPortfolioAction(portfolio: Partial<DbPortfolio>) {
  const { data, error } = await supabaseAdmin.from("portfolio").insert(portfolio).select().single();
  if (error) throw error;
  return data as DbPortfolio;
}

export async function createAlbumAction(album: Partial<DbAlbum>) {
  const { data, error } = await supabaseAdmin.from("albums").insert(album).select().single();
  if (error) throw error;
  return data as DbAlbum;
}

export async function addNewsToAlbumAction(album_id: string, news_id: string) {
  const { error } = await supabaseAdmin.from("news_albums").insert({ album_id, news_id });
  if (error) throw error;
}

export async function addPortfolioToAlbumAction(album_id: string, portfolio_id: string) {
  const { error } = await supabaseAdmin.from("portfolio_albums").insert({ album_id, portfolio_id });
  if (error) throw error;
}

export async function deleteNewsAction(id: string) {
  const { error } = await supabaseAdmin.from("news").delete().eq("id", id);
  if (error) throw error;
}

export async function deletePortfolioAction(id: string) {
  const { error } = await supabaseAdmin.from("portfolio").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAlbumAction(id: string) {
  const { error } = await supabaseAdmin.from("albums").delete().eq("id", id);
  if (error) throw error;
}

// ----------------------------------------------------------------------
// Events
// ----------------------------------------------------------------------

export async function createEventAction(event: Partial<DbEvent>) {
  const { data, error } = await supabaseAdmin.from("events").insert(event).select().single();
  if (error) throw error;
  return data as DbEvent;
}

export async function deleteEventAction(id: string) {
  const { error } = await supabaseAdmin.from("events").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}
// ----------------------------------------------------------------------
// Shop & Products
// ----------------------------------------------------------------------

export async function createProductAction(product: any) {
  const { data, error } = await supabaseAdmin.from("products").insert(product).select().single();
  if (error) throw error;
  return data;
}

export async function updateProductAction(id: string, product: any) {
  const { data, error } = await supabaseAdmin.from("products").update(product).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProductAction(id: string) {
  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}

// ----------------------------------------------------------------------
// Commissions
// ----------------------------------------------------------------------

export async function updateCommissionStatusAction(id: string, status: string) {
  const { data, error } = await supabaseAdmin.from("commissions").update({ status }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
