"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";

export function SiteHeader() {
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const navLinks = [
    { href: "/#top",       label: t("navHome") },
    { href: "/news",       label: t("navNews") },
    { href: "/portfolio",  label: t("navPortfolio") },
    { href: "/calendar",   label: t("navCalendar") },
    { href: "/f1-database",label: "F1 DB" },
    { href: "/shop",       label: language === "ja" ? "ショップ" : "Shop" },
  ];
  const subLinks = [
    { href: "/#profile",  label: t("navProfile") },
    { href: "/#request",  label: t("navRequest") },
    { href: "/#contact",  label: t("navContact") },
  ];


  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link href="/#top" className="flex items-center gap-2">
          <img src="/logo.png" alt="rt18_formula1" className="h-10 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-5 text-sm text-black">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="font-medium hover:text-blue-600 transition-colors whitespace-nowrap">
              {link.label}
            </Link>
          ))}

        </nav>

        <div className="flex items-center gap-4 text-sm text-black">
          <button
            type="button"
            onClick={() => setLanguage(language === "ja" ? "en" : "ja")}
            className="text-xs font-black uppercase tracking-widest border border-black/15 rounded-full px-3 py-1.5 hover:border-black hover:bg-black hover:text-white transition-all"
          >
            {language === "ja" ? "EN" : "JA"}
          </button>
          <span className="text-black/10 select-none">|</span>
          {subLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="font-medium hover:text-blue-600 transition-colors whitespace-nowrap">
              {link.label}
            </Link>
          ))}
          <span className="text-black/10 select-none">|</span>
          <Link href="/admin" className="hover:underline hidden lg:inline">
            {t("admin")}
          </Link>

          {/* Hamburger button (mobile/tablet) */}
          <button
            type="button"
            className="lg:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu" aria-expanded={menuOpen}
          >
            <span className={`block w-6 h-[2px] bg-black transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block w-6 h-[2px] bg-black transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-[2px] bg-black transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-[73px] z-40 bg-white overflow-y-auto">
          <nav className="container mx-auto px-4 py-8 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeMenu}
                className="py-4 text-lg font-black border-b border-black/5 hover:text-blue-600 transition-colors flex items-center justify-between">
                {link.label}
                <span className="text-gray-300 text-sm">&#8594;</span>
              </Link>
            ))}

            <span className="text-black/10 select-none">|</span>
          {subLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="font-medium hover:text-blue-600 transition-colors whitespace-nowrap">
              {link.label}
            </Link>
          ))}
          <span className="text-black/10 select-none">|</span>
          <Link href="/admin" onClick={closeMenu}
              className="py-3 text-sm font-bold text-gray-400 hover:text-black transition-colors mt-2">
              Admin
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}