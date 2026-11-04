import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseLookupKey } from "@/lib/plans";

// Stripe is the source of truth for plans; this mirrors it into Supabase.
export async function POST(req: NextRequest) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return new NextResponse("billing not configured", { status: 503 });

  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new NextResponse("bad signature", { status: 400 });
  }

  const db = supabaseAdmin();

  if (event.type === "checkout.session.completed") {
    const cs = event.data.object as Stripe.Checkout.Session;
    const owner = cs.client_reference_id ?? cs.metadata?.owner;
    if (owner && typeof cs.customer === "string") {
      await db.from("subscriptions").upsert({ owner, stripe_customer_id: cs.customer, updated_at: new Date().toISOString() });
    }
  }

  if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as Stripe.Subscription;
    const owner = sub.metadata?.owner;
    const item = sub.items.data[0];
    const parsed = parseLookupKey(item?.price.lookup_key);
    const ended = event.type === "customer.subscription.deleted" || ["canceled", "unpaid", "incomplete_expired"].includes(sub.status);
    const plan = ended || !parsed ? "free" : parsed.plan;
    const periodEnd = (item as unknown as { current_period_end?: number })?.current_period_end
      ?? (sub as unknown as { current_period_end?: number }).current_period_end;
    if (owner) {
      await db.from("subscriptions").upsert({
        owner,
        stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        stripe_subscription_id: ended ? null : sub.id,
        plan,
        billing_interval: parsed?.interval ?? null,
        status: sub.status,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      });
      await db.from("profiles").update({ plan }).eq("id", owner);
    }
  }

  return NextResponse.json({ received: true });
}
