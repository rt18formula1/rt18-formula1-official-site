"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const ja = {
  lang: "ja" as const,
  title: "プライバシーポリシー / Cookie ポリシー",
  updated: "最終更新日：2026年7月17日",
  intro: "rt18_formula1（以下「当サイト」）は、ユーザーのプライバシーを尊重し、個人情報の適切な取扱いに努めます。本ポリシーは当サイトにおける情報の収集・利用・管理方法についてご説明するものです。",
  tocTitle: "目次",
  switchLabel: "English",
  backHome: "← ホームに戻る",
  contact: "お問い合わせ →",
  sections: [
    { id: "s1", title: "1. 収集する情報", body: [
      "当サイトでは、以下の情報を収集することがあります。",
      "● アクセスログ（IPアドレス・ブラウザ種別・閲覧ページ・参照元URL・端末情報）：Google Analytics により匿名化された状態で収集されます。個人を特定する情報は含まれません。",
      "● お問い合わせ・ご依頼フォーム：氏名・メールアドレス・フォームに入力された内容。",
      "● ショップご利用時：配送先氏名・住所・メールアドレス・注文内容。決済情報（クレジットカード番号等）は Stripe により安全に処理され、当サイトのサーバーには保存されません。",
      "● Cookie・ローカルストレージ：言語設定・カート内容・Cookie同意状態などを保存するために使用します。",
    ]},
    { id: "s2", title: "2. 情報の利用目的", body: [
      "収集した情報は以下の目的に限り使用します。",
      "● サービスの提供・改善・パーソナライズ",
      "● お問い合わせ・ご依頼への対応",
      "● 商品の注文処理・配送手配",
      "● サイトアクセス状況の分析とコンテンツ改善",
      "● 法令に基づく義務の履行",
    ]},
    { id: "s3", title: "3. Cookie について", body: [
      "当サイトでは、以下の目的で Cookie およびローカルストレージを使用しています。",
      "● Google Analytics によるアクセス解析（詳細は第4条参照）",
      "● 言語設定（日本語 / 英語）の保持",
      "● ショッピングカート情報の一時保存",
      "● Cookie 同意バナーの表示管理",
      "初回アクセス時に表示される Cookie 同意バナーで「拒否」を選択された場合、解析系の Cookie は設定されません。ブラウザの設定から Cookie を無効にすることもできますが、一部機能が正常に動作しなくなる場合があります。",
    ]},
    { id: "s4", title: "4. Google Analytics", body: [
      "当サイトは Google LLC が提供する Google Analytics を使用しています。Google Analytics は Cookie を使用してアクセスデータを収集しますが、個人を特定する情報は収集しません。",
      "収集されたデータは Google のサーバーに送信・保管され、Google のプライバシーポリシーに従って取り扱われます。",
      "データ収集を拒否するには Google アナリティクス オプトアウト ブラウザ アドオン（https://tools.google.com/dlpage/gaoptout）をご利用ください。",
      "Google プライバシーポリシー：https://policies.google.com/privacy",
    ]},
    { id: "s5", title: "5. 第三者への情報提供", body: [
      "当サイトは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。",
      "● ユーザーご本人の同意がある場合",
      "● 法令に基づく開示が必要な場合",
      "● サービス提供に必要な業務委託先（配送業者・Stripe等の決済サービス）への提供。これらの事業者は当サイトの個人情報を目的外に使用することはできません。",
      "現時点で当サイトが利用する主な第三者サービス：",
      "  ・Supabase（DB・認証）／Vercel（ホスティング）／Stripe（決済）／Google Analytics／Google Forms",
    ]},
    { id: "s6", title: "6. セキュリティ", body: [
      "当サイトは個人情報への不正アクセス・級失・破壊・改ざん・漏えいを防ぐため、適切な技術的・組織的なセキュリティ措置を講じています。",
      "・通信はすべて HTTPS（TLS 暗号化）で保護されています。",
      "・認証機能は Supabase Auth により管理されています。",
      "・決済情報は Stripe が処理し、当サイトのデータベースには一切保存されません。",
      "ただし、インターネットを経由した情報送信の完全な安全性を保証することはできません。",
    ]},
    { id: "s7", title: "7. 外部リンク", body: [
      "当サイトには、Instagram・X（Twitter）・YouTube・TikTok・Tumblr・Bluesky・note・Threads・LINE・GitHub・Suzuri など、外部サービスへのリンクが含まれています。",
      "これらのサービスにおける個人情報の取扱いについては、当サイトは責任を負いかねません。各サービスのプライバシーポリシーをご確認ください。",
    ]},
    { id: "s8", title: "8. 未成年者のプライバシー", body: [
      "当サイトは13歳未満の方からの意図的な個人情報収集を行っておりません。13歳未満の方がお問い合わせフォームを通じて個人情報を送信された場合、確認後速やかに削除します。",
    ]},
    { id: "s9", title: "9. ユーザーの権利", body: [
      "当サイトに提供された個人情報について、以下の権利を行使できます。",
      "● 開示・確認の請求",
      "● 訂正・追加・削除の請求",
      "● 利用停止・消去の請求",
      "ご請求はサイト内のお問い合わせフォームよりご連絡ください。本人確認を行ったうえで、法令の範囲内で対応いたします。",
    ]},
    { id: "s10", title: "10. お問い合わせ", body: [
      "本ポリシーに関するご質問・個人情報の開示・訂正・削除のご依頼は、サイト内のお問い合わせフォームよりご連絡ください。",
      "なお、法令下の義務に基づく場合を除き、ご本人確認後に対応いたします。",
    ]},
    { id: "s11", title: "11. ポリシーの変更", body: [
      "本ポリシーは必要に応じて改定することがあります。重要な変更がある場合は本ページ上でお知らせします。",
      "最新のプライバシーポリシーは常に本ページに掃載されます。",
    ]},
  ],
};

const en = {
  lang: "en" as const,
  title: "Privacy Policy & Cookie Policy",
  updated: "Last updated: July 17, 2026",
  intro: 'rt18_formula1 (the "Site") is committed to protecting your privacy. This policy explains how we collect, use, and manage information when you use this Site.',
  tocTitle: "Table of Contents",
  switchLabel: "日本語",
  backHome: "← Back to Home",
  contact: "Contact →",
  sections: [
    { id: "s1", title: "1. Information We Collect", body: [
      "We may collect the following information:",
      "● Access logs (IP address, browser type, pages visited, referrer URL, device info): collected anonymously via Google Analytics.",
      "● Contact / request forms: name, email address, and the content you submit.",
      "● Shop purchases: delivery name, address, email, and order details. Payment info is processed by Stripe and never stored on our servers.",
      "● Cookies & local storage: used to store language preference, cart contents, and cookie-consent state.",
    ]},
    { id: "s2", title: "2. How We Use Your Information", body: [
      "Collected information is used solely for:",
      "● Providing, maintaining, and improving services",
      "● Responding to inquiries and requests",
      "● Processing orders and arranging delivery",
      "● Analysing site traffic and improving content",
      "● Complying with legal obligations",
    ]},
    { id: "s3", title: "3. Cookies", body: [
      "We use cookies and local storage for:",
      "● Google Analytics for access analytics (see Section 4)",
      "● Saving language preferences (Japanese / English)",
      "● Temporarily storing shopping cart contents",
      "● Managing the cookie consent banner",
      'If you decline in the cookie consent banner, analytics cookies will not be set. You can also disable cookies in browser settings, though some features may not function correctly.',
    ]},
    { id: "s4", title: "4. Google Analytics", body: [
      "This Site uses Google Analytics by Google LLC. It collects data anonymously via cookies and does not identify individuals.",
      "Data is sent to Google servers and handled per Google's Privacy Policy.",
      "To opt out: https://tools.google.com/dlpage/gaoptout",
      "Google Privacy Policy: https://policies.google.com/privacy",
    ]},
    { id: "s5", title: "5. Sharing with Third Parties", body: [
      "We do not share your personal information except:",
      "● With your explicit consent",
      "● When required by law",
      "● With service providers necessary to operate the Site (carriers, Stripe, etc.).",
      "Key third-party services: Supabase (DB & auth) / Vercel (hosting) / Stripe (payments) / Google Analytics / Google Forms",
    ]},
    { id: "s6", title: "6. Security", body: [
      "We implement appropriate security measures to protect personal information.",
      "· All communications use HTTPS (TLS encryption).",
      "· Authentication is managed by Supabase Auth.",
      "· Payment info is processed by Stripe and never stored in our database.",
      "However, we cannot guarantee complete security over the internet.",
    ]},
    { id: "s7", title: "7. External Links", body: [
      "This Site links to Instagram, X (Twitter), YouTube, TikTok, Tumblr, Bluesky, note, Threads, LINE, GitHub, and Suzuri.",
      "We are not responsible for their privacy practices. Please review each service's privacy policy.",
    ]},
    { id: "s8", title: "8. Children's Privacy", body: [
      "We do not knowingly collect personal information from children under 13. If we learn a child under 13 submitted info via our forms, we will delete it promptly.",
    ]},
    { id: "s9", title: "9. Your Rights", body: [
      "You may request:",
      "● Access and confirmation",
      "● Correction, addition, or deletion",
      "● Suspension of use or erasure",
      "Contact us via the contact form. We will respond after verifying your identity.",
    ]},
    { id: "s10", title: "10. Contact", body: [
      "For questions or requests about your personal information, please use the contact form on the Site.",
      "We will respond after verifying your identity, except where required by law.",
    ]},
    { id: "s11", title: "11. Changes to This Policy", body: [
      "This policy may be revised as necessary. Significant changes will be announced on on this page.",
      "The latest version is always available on this page.",
    ]},
  ],
};

function PrivacyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramLang = searchParams.get("lang");
  const [lang, setLang] = useState<"ja" | "en">(paramLang === "en" ? "en" : "ja");

  useEffect(() => {
    if (paramLang === "en" || paramLang === "ja") setLang(paramLang);
  }, [paramLang]);

  const switchLang = () => {
    const next = lang === "ja" ? "en" : "ja";
    setLang(next);
    router.replace(`/cookie-privacy-policy?lang=${next}`, { scroll: false });
  };

  const c = lang === "ja" ? ja : en;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1 min-w-0 pr-4">
          <Link href="/" className="text-xs font-bold text-gray-400 hover:text-black transition-colors mb-3 inline-block">
            ← Home
          </Link>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight">{c.title}</h1>
          <p className="text-xs text-gray-400 mt-2 font-bold">{c.updated}</p>
        </div>
        <button onClick={switchLang} className="shrink-0 text-[10px] font-black uppercase tracking-widest border border-black/20 rounded-full px-3 py-1.5 hover:bg-black hover:text-white hover:border-black transition-all mt-1">
          {c.switchLabel}
        </button>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-10 p-5 bg-gray-50 rounded-2xl border border-black/5 font-medium">{c.intro}</p>
      <div className="mb-12 p-5 bg-black text-white rounded-2xl">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">{c.tocTitle}</h2>
        <ul className="space-y-2">
          {c.sections.map((s) => (
            <li key={s.id}><a href={`#${s.id}`} className="text-xs font-bold text-gray-300 hover:text-white transition-colors">{s.title}</a></li>
          ))}
        </ul>
      </div>
      <div className="space-y-12">
        {c.sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-sm md:text-base font-black mb-4 pb-2 border-b border-black/10">{s.title}</h2>
            <div className="space-y-2">
              {s.body.map((line, i) => (
                <p key={i} className={`text-sm leading-relaxed font-medium ${line.startsWith("●") || line.startsWith("·") || line.startsWith("  ·") ? "text-gray-700 pl-2" : "text-gray-600"}`}>{line}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-16 pt-8 border-t border-black/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Link href="/" className="text-sm font-bold text-gray-400 hover:text-black transition-colors">{c.backHome}</Link>
        <Link href="/shop/inquiry" className="text-sm font-bold text-gray-400 hover:text-black transition-colors">{c.contact}</Link>
      </div>
    </div>
  );
}

export default function CookiePrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col text-black">
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="py-20 text-center text-sm text-gray-400">Loading...</div>}>
          <PrivacyContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
