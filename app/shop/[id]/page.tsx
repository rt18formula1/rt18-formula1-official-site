import { getProductById } from "@/lib/supabase-queries";
import { ProductDetail } from "@/components/shop/product-detail";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product as any} />;
}
