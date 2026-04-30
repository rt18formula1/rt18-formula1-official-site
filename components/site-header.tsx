"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";

export function SiteHeader() {
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/#top", label: t("navHome") },
    { href: "/news", label: t("navNews") },
    { href: "/portfolio", label: t("navPortfolio") },
    { href: "/calendar", label: t("navCalendar") },
    { href: "/f1-database", label: language === 'ja' ? 'F1データベース' : 'F1 Database' },
    { href: "/#profile", label: t("navProfile") },
    { href: "/#request", label: t("navRequest") },
    { href: "/#contact", label: t("navContact") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link href="/#top" className="flex items-center gap-2">
          <img src="/logo.png" alt="rt18_formula1" className="h-10 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8 text-sm text-black">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-sm text-black">
          <button
            type="button"
            className="hover:underline"
            onClick={() => setLanguage(language === "ja" ? "en" : "ja")}
          >
            {t("languageToggle")}
          </button>
          <Link href="/admin" className="hover:underline hidden lg:inline">
            {t("admin")}
          </Link>

          {/* Hamburger button (mobile/tablet) */}
          <button
            type="button"
            className="lg:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span
              className={`block w-6 h-[2px] bg-black transition-all duration-300 ${
                menuOpen ? "rotate-45 translate-y-[7px]" : ""
              }`}
            />
            <span
              className={`block w-6 h-[2px] bg-black transition-all duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-6 h-[2px] bg-black transition-all duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="lg:hidden border-t border-black/10 bg-white">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4 text-base">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2 font-bold hover:text-blue-600 transition-colors border-b border-black/5"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="py-2 font-bold text-gray-400 hover:text-black transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {t("admin")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
