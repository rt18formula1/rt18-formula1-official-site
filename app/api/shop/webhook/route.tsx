import React from "react";
import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";
import { resend } from "../../../../lib/resend";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { OrderConfirmationEmail } from "../../../../components/emails/order-confirmation";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { user_id, item_ids } = session.metadata || {};
    const supabaseAdmin = getSupabaseAdmin();

    if (!user_id) {
      console.error("No user_id in session metadata");
      return NextResponse.json({ received: true });
    }

    // 1. Get line items from Stripe
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ["data.price.product"] });

    // 2. Get products from DB by item_ids
    let dbProducts: any[] = [];
    if (item_ids) {
      const ids = item_ids.split(",").filter(Boolean);
      const { data } = await supabaseAdmin.from("products").select("*").in("id", ids);
      if (data) dbProducts = data;
    }

    // 3. Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id,
        status: "paid",
        total_price: session.amount_total,
        stripe_payment_intent_id: session.payment_intent,
        stripe_checkout_session_id: session.id,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
    }

    // 4. Create order_items
    if (dbProducts.length > 0) {
      const orderItems = dbProducts.map((p: any) => {
        const lineItem = lineItems.data.find((li: any) => li.description === (p.name_en || p.name_ja));
        const quantity = lineItem?.quantity || 1;
        return { order_id: order.id, product_id: p.id, quantity, price: p.price };
      });
      const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);
      if (itemsError) console.error("Order items error:", itemsError);
    }

    // 5. Handle digital content delivery
    for (const p of dbProducts) {
      if (p.type === "digital") {
        const { data: digitalContent } = await supabaseAdmin
          .from("digital_contents")
          .select("*")
          .eq("product_id", p.id)
          .single();

        if (digitalContent?.delivery_type === "activate_code") {
          // Assign an unused code
          const { data: code } = await supabaseAdmin
            .from("activate_codes")
            .select("*")
            .eq("product_id", p.id)
            .eq("is_used", false)
            .limit(1)
            .single();

          if (code) {
            await supabaseAdmin.from("activate_codes")
              .update({ is_used: true, used_by: user_id, used_at: new Date().toISOString() })
              .eq("id", code.id);
          }
        }
      }
    }

    // 6. Get user info for email
    const { data: profile } = await supabaseAdmin.from("user_profiles").select("*").eq("id", user_id).single();
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(user_id);

    // 7. Send confirmation email
    if (authData.user?.email) {
      try {
        await resend.emails.send({
          from: "rt18_formula1 Shop <onboarding@resend.dev>",
          to: authData.user.email,
          subject: "Order Confirmation - rt18_formula1",
          react: React.createElement(OrderConfirmationEmail, {
            orderId: order.id,
            customerName: profile?.display_name || profile?.last_name || "Customer",
            totalPrice: order.total_price,
          }),
        });
      } catch (emailError) {
        console.error("Email send error:", emailError);
      }
    }
  }

  return NextResponse.json({ received: true });
}