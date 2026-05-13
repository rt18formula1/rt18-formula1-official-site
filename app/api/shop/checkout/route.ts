import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";
import { createClient } from "../../../../lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    const supabase = await createClient();

    // 1. Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch products from DB to verify prices
    const itemIds = items.map((i: any) => i.id);
    const { data: dbProducts, error: dbError } = await supabase
      .from("products")
      .select("*")
      .in("id", itemIds);

    if (dbError || !dbProducts) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    // 3. Calculate total
    let totalAmount = 0;
    items.forEach((item: any) => {
      const dbProduct = dbProducts.find((p: any) => p.id === item.id);
      if (dbProduct) {
        totalAmount += dbProduct.price * item.quantity;
      }
    });

    if (totalAmount === 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 4. Create Checkout Session following Managed Payments blueprint
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item: any) => {
        const dbProduct = dbProducts.find((p: any) => p.id === item.id);
        return {
          price: dbProduct.stripe_price_id || undefined, // Use existing Stripe price if synced
          price_data: !dbProduct.stripe_price_id ? {
            currency: "jpy",
            unit_amount: dbProduct.price,
            product_data: {
              name: dbProduct.name_en || dbProduct.name_ja,
              tax_code: "txcd_10103100",
            },
          } : undefined,
          quantity: item.quantity,
        };
      }),
      success_url: `${request.headers.get("origin")}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/shop/cart`,
      metadata: {
        user_id: user.id,
        item_ids: itemIds.join(","),
      },
      // Managed Payments enabled as per blueprint
      managed_payments: {
        enabled: true,
      },
    } as any, {
      headers: {
        "stripe-version": "2026-02-25.preview"
      }
    });

    return NextResponse.json({
      clientSecret: session.client_secret, // Note: For Checkout Session, you usually redirect or use client_secret in some flows
      url: session.url,
    });
  } catch (err: any) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
