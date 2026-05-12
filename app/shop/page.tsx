import { Suspense } from "react";
import { ShopClient } from "@/components/shop/shop-client";

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" /></div>}>
      <ShopClient />
    </Suspense>
  );
}