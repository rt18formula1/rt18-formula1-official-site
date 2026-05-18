import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, userId, shipping } = body;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const itemIds = items.map((i: any) => i.id);
    const { data: dbProducts, error: dbError } = await supabaseAdmin
      .from("products").select("*").in("id", itemIds);

    if (dbError || !dbProducts || dbProducts.length === 0) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    let totalAmount = 0;
    items.forEach((item: any) => {
      const p = dbProducts.find((p: any) => p.id === item.id);
      if (p) totalAmount += p.price * item.quantity;
    });
    if (totalAmount === 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    const origin = request.headers.get("origin") || "https://rt18-formula1-official-site.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item: any) => {
        const p = dbProducts.find((p: any) => p.id === item.id);
        return {
          price_data: {
            currency: "jpy",
            unit_amount: p.price,
            product_data: {
              name: p.name_en || p.name_ja,
              images: p.image_url ? [p.image_url] : [],
            },
          },
          quantity: item.quantity,
        };
      }),
      success_url: `${origin}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/cart`,
      metadata: {
        user_id: userId,
        item_ids: itemIds.join(","),
        shipping_name: shipping ? `${shipping.lastName} ${shipping.firstName}`.trim() : "",
        shipping_postal_code: shipping?.postalCode || "",
        shipping_prefecture: shipping?.prefecture || "",
        shipping_city: shipping?.city || "",
        shipping_address_line1: shipping?.address1 || "",
        shipping_address_line2: shipping?.address2 || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}