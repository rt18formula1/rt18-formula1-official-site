"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import type { F1OfficialRace } from "@/lib/jolpica-api";
import {
  TEMPLATE_OPTIONS,
  isRoundCancelled,
  type SnsTemplateType,
  type SnsTemplateResult,
} from "@/lib/f1-sns-service";

interface CacheEntry {
  round: number;
  templateType: SnsTemplateType;
  textOutput: string;
  data: SnsTemplateResult["data"];
  sessionLabel?: string | null;
  grandPrix: string;
  provider: string;
  fetchedAt: string;
}

interface F1SnsTemplatesProps {
  year: number;
  races: F1OfficialRace[];
}

export default function F1SnsTemplates({ year, races }: F1SnsTemplatesProps) {
  const { language } = useLanguage();
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const [cache, setCache] = useState<CacheEntry[]>([]);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [modalResult, setModalResult] = useState<{
    result: SnsTemplateResult;
    templateType: SnsTemplateType;
    raceName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weekendStatus, setWeekendStatus] = useState<
    Record<number, { isSprintWeekend: boolean; templates: Array<{ type: SnsTemplateType; available: boolean }> }>
  >({});

  const loadCache = useCallback(async () => {
    try {
      const res = await fetch(`/api/f1-sns?year=${year}`);
      const data = await res.json();
      if (data.success) setCache(data.cache ?? []);
    } catch {
      /* ignore */
    }
  }, [year]);

  useEffect(() => {
    loadCache();
  }, [loadCache]);

  useEffect(() => {
    const interval = setInterval(loadCache, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadCache]);

  const getRaceLabel = (race: F1OfficialRace) => {
    const loc = race.location || race.country;
    return `Round ${race.round} ${loc}`;
  };

  const getCached = (round: number, templateType: SnsTemplateType) =>
    cache.find((c) => c.round === round && c.templateType === templateType);

  const fetchTemplate = async (
    race: F1OfficialRace,
    templateType: SnsTemplateType,
    force = false
  ) => {
    const key = `${race.round}-${templateType}`;
    setLoadingType(key);
    setError(null);
    try {
      const res = await fetch("/api/f1-sns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          round: race.round,
          templateType,
          raceName: race.name,
          force,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || (language === "ja" ? "データを取得できません" : "Failed to fetch"));
        return;
      }
      const result: SnsTemplateResult = {
        templateType: data.templateType,
        grandPrix: data.grandPrix,
        sessionLabel: data.sessionLabel,
        data: data.data,
        textOutput: data.textOutput,
        provider: data.provider,
      };
      setModalResult({ result, templateType, raceName: race.name });
      await loadCache();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setLoadingType(null);
    }
  };

  const loadWeekendStatus = async (race: F1OfficialRace) => {
    try {
      const res = await fetch(
        `/api/f1-sns?year=${year}&round=${race.round}&raceName=${encodeURIComponent(race.name)}`
      );
      const data = await res.json();
      if (data.weekendStatus) {
        setWeekendStatus((prev) => ({ ...prev, [race.round]: data.weekendStatus }));
      }
    } catch {
      /* ignore */
    }
  };

  const isOptionEnabled = (race: F1OfficialRace, templateType: SnsTemplateType) => {
    if (isRoundCancelled(year, race.round)) return false;

    const cached = getCached(race.round, templateType);
    if (cached) return true;

    const status = weekendStatus[race.round];
    if (status) {
      const t = status.templates.find((x) => x.type === templateType);
      if (t?.available) return true;
    }

    if (templateType === "schedule") return true;
    if (templateType === "race" && race.results && race.results.length > 0) return true;

    return false;
  };

  const copyText = () => {
    if (!modalResult) return;
    navigator.clipboard.writeText(modalResult.result.textOutput);
  };

  const saveJpeg = async () => {
    const el = document.getElementById("sns-output-card");
    if (!el || !modalResult) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const link = document.createElement("a");
    link.download =
      modalResult.result.grandPrix.replace(/\s+/g, "_") +
      "_" +
      (modalResult.result.sessionLabel || "SCHEDULE") +
      ".jpg";
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  const renderOutput = (result: SnsTemplateResult) => {
    if (result.templateType === "schedule" && result.data.sessions) {
      return (
        <div>
          <p className="text-sm font-bold mb-5 tracking-widest">{result.grandPrix}</p>
          <p className="text-sm font-bold mb-4">{"【Schedule】"}</p>
          {result.data.sessions.map((s, i) => (
            <div key={i} className="mb-5">
              <p className="text-sm mb-1">{s.name}</p>
              <p className="text-sm">
                {"TrackTime : "}
                {s.date} {s.trackTime}
              </p>
              <p className="text-sm">
                {"JapanTime : "}
                {s.japanDate ? s.japanDate + " " : ""}
                {s.japanTime}
              </p>
            </div>
          ))}
          <div className="mt-2">
            <p className="text-sm">{"TrackTime : "}{result.data.sessions[0]?.trackTimezone}</p>
            <p className="text-sm">{"JapanTime : UTC+9"}</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <p className="text-sm font-bold mb-1 tracking-widest">{result.grandPrix}</p>
        {result.sessionLabel && <p className="text-sm font-bold mb-5">{result.sessionLabel}</p>}
        <p className="text-sm font-bold mb-4">{"【Result】"}</p>
        {result.data.results?.map((r, i) => (
          <p key={i} className="text-sm mb-1.5">
            {r}
          </p>
        ))}
        {result.data.notes && (
          <p className="text-xs text-gray-600 mt-5 leading-relaxed whitespace-pre-wrap">
            {result.data.notes}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {language === "ja"
            ? "rt18_formula1 インスタ投稿定型文出力"
            : "rt18_formula1 Instagram Post Templates"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {language === "ja"
            ? "スケジュール: F1 Calendar → OpenRouter。結果: スプリント系=OpenF1、予選・レース=Jolpica→OpenF1、失敗時=OpenRouter無料API。"
            : "Schedule: F1 Calendar → OpenRouter. Results: Sprint=OpenF1, Qualifying/Race=Jolpica→OpenF1, fallback=OpenRouter free."}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white divide-y divide-gray-100">
        {races.map((race) => {
          const cancelled = isRoundCancelled(year, race.round);
          const isExpanded = expandedRound === race.round;

          return (
            <div key={race.round}>
              <button
                type="button"
                onClick={() => {
                  if (cancelled) return;
                  const next = isExpanded ? null : race.round;
                  setExpandedRound(next);
                  if (next !== null) loadWeekendStatus(race);
                }}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                  cancelled
                    ? "text-gray-400 cursor-default"
                    : "hover:bg-gray-50 cursor-pointer"
                }`}
              >
                <span className={`text-base ${cancelled ? "line-through" : "font-medium"}`}>
                  {getRaceLabel(race)}
                  {cancelled && (
                    <span className="ml-2 text-sm no-underline">
                      {language === "ja" ? "中止" : "Cancelled"}
                    </span>
                  )}
                </span>
                {!cancelled && (
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              {isExpanded && !cancelled && (
                <div className="bg-gray-50 border-t border-gray-100">
                  {TEMPLATE_OPTIONS.map((option) => {
                    const enabled = isOptionEnabled(race, option.type);
                    const cached = getCached(race.round, option.type);
                    const isLoading = loadingType === `${race.round}-${option.type}`;
                    const label = language === "ja" ? option.labelJa : option.labelEn;

                    return (
                      <button
                        key={option.type}
                        type="button"
                        disabled={!enabled || isLoading}
                        onClick={() => fetchTemplate(race, option.type, option.type === "schedule")}
                        className={`w-full flex items-center justify-between px-6 py-3 text-sm text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                          enabled
                            ? "text-gray-800 hover:bg-white cursor-pointer"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={enabled ? "" : "opacity-50"}>{label}</span>
                          {cached && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                              {language === "ja" ? "取得済" : "Ready"}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-2 text-gray-400">
                          {isLoading && (
                            <span className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full" />
                          )}
                          {option.type === "schedule" && enabled && (
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setModalResult(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">
                {language === "ja" ? "出力結果" : "Output"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyText}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  {language === "ja" ? "テキストコピー" : "Copy"}
                </button>
                <button
                  onClick={saveJpeg}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  JPEG保存
                </button>
                <button
                  onClick={() => setModalResult(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-8">
              <div id="sns-output-card" className="bg-white">
                <div style={{ fontFamily: "monospace" }}>{renderOutput(modalResult.result)}</div>
                <div className="mt-8 pt-4 border-t border-gray-200 flex items-center gap-2">
                  <span className="text-base">{"🏎"}</span>
                  <span className="text-sm font-bold tracking-wide">rt18_formula1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
