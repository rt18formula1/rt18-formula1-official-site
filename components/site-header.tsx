"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";

export function SiteHeader() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/rt18_formula1-icon.png" alt="rt18_formula1" width={170} height={48} className="h-12 w-auto" />
        </Link>
        <nav className="hidden lg:flex items-center gap-8 text-sm text-black">
          <Link href="/" className="hover:underline">
            {t("navHome")}
          </Link>
          <a href="/#profile" className="hover:underline">
            {t("navProfile")}
          </a>
          <Link href="/news" className="hover:underline">
            {t("navNews")}
          </Link>
          <Link href="/portfolio" className="hover:underline">
            {t("navPortfolio")}
          </Link>
          <a href="/#request" className="hover:underline">
            {t("navRequest")}
          </a>
          <a href="/#contact" className="hover:underline">
            {t("navContact")}
          </a>
        </nav>
        <div className="flex items-center gap-4 text-sm text-black">
          <button
            type="button"
            className="hover:underline"
            onClick={() => setLanguage(language === "ja" ? "en" : "ja")}
          >
            {t("languageToggle")}
          </button>
          <Link href="/admin" className="hover:underline">
            {t("admin")}
          </Link>
        </div>
      </div>
    </header>
  );
}
