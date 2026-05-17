import React from "react";
import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("No stripe-signature header");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log("Webhook event type:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    console.log("Session ID:", session.id);
    console.log("Session metadata:", JSON.stringify(session.metadata));
    console.log("Amount total:", session.amount_total);

    const { user_id, item_ids } = session.metadata || {};

    if (!user_id) {
      console.error("No user_id in metadata");
      return NextResponse.json({ received: true });
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
      console.log("Supabase admin initialized");
    } catch (e: any) {
      console.error("Supabase admin init error:", e.message);
      return NextResponse.json({ error: "Supabase init failed" }, { status: 500 });
    }

    // Create order
    const insertData = {
      user_id,
      status: "paid",
      total_price: session.amount_total,
      stripe_payment_intent_id: session.payment_intent || null,
      stripe_checkout_session_id: session.id,
    };
    console.log("Inserting order:", JSON.stringify(insertData));

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert(insertData)
      .select()
      .single();

    if (orderError) {
      console.error("Order insert error:", JSON.stringify(orderError));
      return NextResponse.json({ error: "Order creation failed", detail: orderError.message }, { status: 500 });
    }

    console.log("Order created:", order.id);

    // Create order_items
    if (item_ids) {
      const ids = item_ids.split(",").filter(Boolean);
      const { data: dbProducts } = await supabaseAdmin.from("products").select("*").in("id", ids);

      if (dbProducts && dbProducts.length > 0) {
        const orderItems = dbProducts.map((p: any) => ({
          order_id: order.id,
          product_id: p.id,
          quantity: 1,
          price: p.price,
        }));
        const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);
        if (itemsError) console.error("Order items error:", JSON.stringify(itemsError));
        else console.log("Order items created:", orderItems.length);

        // Handle digital content delivery
        for (const p of dbProducts) {
          if (p.type === "digital") {
            const { data: dc } = await supabaseAdmin.from("digital_contents").select("*").eq("product_id", p.id).single();
            if (dc?.delivery_type === "activate_code") {
              const { data: code } = await supabaseAdmin.from("activate_codes")
                .select("*").eq("product_id", p.id).eq("is_used", false).limit(1).single();
              if (code) {
                await supabaseAdmin.from("activate_codes")
                  .update({ is_used: true, used_by: user_id, used_at: new Date().toISOString() })
                  .eq("id", code.id);
                console.log("Activate code assigned:", code.code);
              }
            }
          }
        }
      }
    }

    // Send confirmation email (optional - skip if Resend not configured)
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(user_id);
        const { data: profile } = await supabaseAdmin.from("user_profiles").select("*").eq("id", user_id).single();
        if (authData.user?.email) {
          const { Resend } = await import("resend");
          const resend = new Resend(resendKey);
          await resend.emails.send({
            from: "rt18_formula1 Shop <onboarding@resend.dev>",
            to: authData.user.email,
            subject: `Order Confirmation #${order.id.slice(0, 8).toUpperCase()} - rt18_formula1`,
            html: `<h1>Thank you for your order!</h1><p>Order ID: ${order.id.slice(0, 8).toUpperCase()}</p><p>Total: \${order.total_price.toLocaleString()}</p>`,
          });
          console.log("Confirmation email sent to:", authData.user.email);
        }
      }
    } catch (emailError: any) {
      console.error("Email error (non-fatal):", emailError.message);
    }
  }

  return NextResponse.json({ received: true });
}