import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { createClient } from "../../../../lib/supabaseServer";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, userId, shipping } = body;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
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

    const cartItems = items
      .map((item: any) => {
        const product = dbProducts.find((p: any) => p.id === item.id);
        return product ? { id: product.id, quantity: Math.max(1, Number(item.quantity) || 1) } : null;
      })
      .filter(Boolean);

    if (shipping) {
      const profileUpdate = {
        id: userId,
        last_name: cleanText(shipping.lastName),
        first_name: cleanText(shipping.firstName),
        postal_code: cleanText(shipping.postalCode),
        prefecture: cleanText(shipping.prefecture),
        city: cleanText(shipping.city),
        address_line1: cleanText(shipping.address1),
        address_line2: cleanText(shipping.address2) || null,
        country: cleanText(shipping.country) || "Japan",
      };
      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .upsert(profileUpdate, { onConflict: "id" });

      if (profileError) {
        console.error("Profile upsert error:", profileError);
      }
    }

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
        cart_quantities: cartItems.map((item: any) => `${item.id}:${item.quantity}`).join(","),
        shipping_name: shipping ? `${shipping.lastName} ${shipping.firstName}`.trim() : "",
        shipping_postal_code: shipping?.postalCode || "",
        shipping_prefecture: shipping?.prefecture || "",
        shipping_city: shipping?.city || "",
        shipping_address_line1: shipping?.address1 || "",
        shipping_address_line2: shipping?.address2 || "",
        shipping_country: shipping?.country || "Japan",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
