"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_KEY = "rt18_cookie_consent";

type ConsentState = "accepted" | "rejected" | null;

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(COOKIE_KEY) as ConsentState | null;
    setConsent(stored);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setConsent("accepted");
  };

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, "rejected");
    setConsent("rejected");
  };

  if (!mounted || consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden">
        {!showDetail ? (
          // Main banner
          <div className="p-6">
            <div className="flex items-start gap-3 mb-5">
              <span className="text-2xl">🍪</span>
              <div>
                <h3 className="font-black text-base mb-1">Cookie について</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  このサイトはGoogle Analytics などの Cookie を使用してアクセス解析・利便性向上を行っています。
                  同意することで最適なエクスペリエンスを提供できます。
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={accept}
                className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-black hover:bg-gray-900 transition-colors active:scale-[0.98]"
              >
                すべて同意
              </button>
              <button
                onClick={reject}
                className="flex-1 py-3 border border-black/20 rounded-xl text-sm font-black hover:bg-gray-50 transition-colors active:scale-[0.98]"
              >
                同意しない
              </button>
              <button
                onClick={() => setShowDetail(true)}
                className="sm:w-auto px-4 py-3 text-sm font-bold text-gray-400 hover:text-black transition-colors"
              >
                詳細 →
              </button>
            </div>
          </div>
        ) : (
          // Detail view
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-base">Cookie の詳細設定</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-black transition-colors text-sm font-bold"
              >
                ← 戻る
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-black">必須 Cookie</span>
                  <span className="text-[10px] font-black text-white bg-black rounded-full px-2 py-0.5">常に有効</span>
                </div>
                <p className="text-xs text-gray-500">サイトの基本機能（ログイン状態の保持など）に必要です。</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-black">分析 Cookie</span>
                  <span className="text-[10px] font-bold text-gray-500">Google Analytics</span>
                </div>
                <p className="text-xs text-gray-500">アクセス状況の把握・サービス改善のために使用します。個人を特定する情報は収集しません。</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={accept}
                className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-black hover:bg-gray-900 transition-colors"
              >
                すべて同意
              </button>
              <button
                onClick={reject}
                className="flex-1 py-3 border border-black/20 rounded-xl text-sm font-black hover:bg-gray-50 transition-colors"
              >
                同意しない
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 text-center">
              設定はいつでも変更できます。詳しくは
              <Link href="/privacy" className="underline hover:text-black">プライバシーポリシー</Link>
              をご確認ください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
