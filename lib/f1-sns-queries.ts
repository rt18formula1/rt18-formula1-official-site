import { getSupabaseAdmin } from "./supabaseAdmin";
import type { SnsTemplateResult, SnsTemplateType } from "./f1-sns-service";

export type DbSnsCache = {
  id: string;
  year: number;
  round: number;
  template_type: SnsTemplateType;
  grand_prix: string;
  session_label: string | null;
  data: Record<string, unknown>;
  text_output: string;
  provider: string;
  fetched_at: string;
};

function cacheId(year: number, round: number, templateType: SnsTemplateType) {
  return `${year}-${round}-${templateType}`;
}

export async function getSnsCache(
  year: number,
  round?: number
): Promise<DbSnsCache[]> {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("f1_sns_cache").select("*").eq("year", year);
    if (round !== undefined) query = query.eq("round", round);
    const { data, error } = await query.order("round").order("template_type");
    if (error) {
      if (error.code === "42P01") return [];
      console.warn("f1_sns_cache read error:", error.message);
      return [];
    }
    return (data ?? []) as DbSnsCache[];
  } catch {
    return [];
  }
}

export async function getSnsCacheEntry(
  year: number,
  round: number,
  templateType: SnsTemplateType
): Promise<DbSnsCache | null> {
  const rows = await getSnsCache(year, round);
  return rows.find((r) => r.template_type === templateType) ?? null;
}

export async function upsertSnsCache(result: SnsTemplateResult, year: number, round: number) {
  try {
    const supabase = getSupabaseAdmin();
    const row = {
      id: cacheId(year, round, result.templateType),
      year,
      round,
      template_type: result.templateType,
      grand_prix: result.grandPrix,
      session_label: result.sessionLabel ?? null,
      data: result.data as unknown as Record<string, unknown>,
      text_output: result.textOutput,
      provider: result.provider,
      fetched_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("f1_sns_cache").upsert(row, { onConflict: "id" });
    if (error) {
      if (error.code === "42P01") return false;
      console.warn("f1_sns_cache upsert error:", error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function cacheToResult(row: DbSnsCache): SnsTemplateResult {
  return {
    templateType: row.template_type,
    grandPrix: row.grand_prix,
    sessionLabel: row.session_label ?? undefined,
    data: row.data as unknown as SnsTemplateResult["data"],
    textOutput: row.text_output,
    provider: row.provider as SnsTemplateResult["provider"],
  };
}
