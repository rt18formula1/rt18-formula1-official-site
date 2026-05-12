import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Shop | rt18_formula1",
  description: "rt18_formula1 Official Shop - Digital contents, goods, and illustration commissions.",
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}