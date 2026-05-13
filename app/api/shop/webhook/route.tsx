import React from "react";
import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";
import { resend } from "../../../../lib/resend";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { OrderConfirmationEmail } from "../../../../components/emails/order-confirmation";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { user_id } = session.metadata;

    // 1. Create order in DB
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id,
        status: "paid",
        total_price: session.amount_total,
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_checkout_session_id: session.id,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
    }

    // 2. Get user profile for email
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user_id);

    // 3. Send confirmation email
    if (authUser.user?.email) {
      await resend.emails.send({
        from: "rt18_formula1 <shop@rt18-formula1-official-site.vercel.app>",
        to: authUser.user.email,
        subject: "Order Confirmation - rt18_formula1",
        react: <OrderConfirmationEmail orderId={order.id} customerName={profile?.display_name || "Customer"} totalPrice={order.total_price} />,
      });
    }
  }

  if (event.type === "payment_intent.succeeded") {
    // Keep this for direct payment intent flows if any, but checkout.session.completed is primary now
    console.log("Payment Intent Succeeded:", event.data.object.id);
  }

  return NextResponse.json({ received: true });
}
