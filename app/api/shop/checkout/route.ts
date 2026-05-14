import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch products from DB to verify prices
    const itemIds = items.map((i: any) => i.id);
    const { data: dbProducts, error: dbError } = await supabaseAdmin
      .from("products")
      .select("*")
      .in("id", itemIds);

    if (dbError || !dbProducts || dbProducts.length === 0) {
      console.error("DB error:", dbError);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    // Calculate total
    let totalAmount = 0;
    items.forEach((item: any) => {
      const dbProduct = dbProducts.find((p: any) => p.id === item.id);
      if (dbProduct) totalAmount += dbProduct.price * item.quantity;
    });

    if (totalAmount === 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const origin = request.headers.get("origin") || "https://rt18-formula1-official-site.vercel.app";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item: any) => {
        const dbProduct = dbProducts.find((p: any) => p.id === item.id);
        return {
          price_data: {
            currency: "jpy",
            unit_amount: dbProduct.price,
            product_data: {
              name: dbProduct.name_en || dbProduct.name_ja,
              images: dbProduct.image_url ? [dbProduct.image_url] : [],
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
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}