import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { verifyStripeEvent } from "@/lib/stripe";

// Stripe is the source of truth for plans. After checking Stripe's signature, this hands
// each event to public.stripe_sync, which records it and updates the member's plan.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const token = process.env.STRIPE_SYNC_TOKEN;
  if (!secret || !token) return new NextResponse("billing not configured", { status: 503 });

  let event: Stripe.Event;
  try {
    event = verifyStripeEvent(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new NextResponse("bad signature", { status: 400 });
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const id = (x: string | { id: string } | null) => (typeof x === "string" ? x : x?.id ?? null);
  let args: Record<string, unknown> | null = null;

  if (event.type === "checkout.session.completed") {
    const cs = event.data.object as Stripe.Checkout.Session;
    const customer = id(cs.customer);
    if (customer) {
      args = {
        p_customer: customer,
        p_owner: cs.client_reference_id,
        p_subscription: id(cs.subscription as string | { id: string } | null),
        p_lookup: cs.metadata?.rf_lookup ?? null,
      };
    }
  } else if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as Stripe.Subscription;
    const item = sub.items.data[0];
    const end = (item as unknown as { current_period_end?: number })?.current_period_end
      ?? (sub as unknown as { current_period_end?: number }).current_period_end;
    args = {
      p_customer: id(sub.customer),
      p_subscription: sub.id,
      p_lookup: item?.price.lookup_key ?? sub.metadata?.rf_lookup ?? null,
      p_status: sub.status,
      p_period_end: end ? new Date(end * 1000).toISOString() : null,
      p_ended: event.type === "customer.subscription.deleted" || ["canceled", "unpaid", "incomplete_expired"].includes(sub.status),
    };
  }

  if (args) {
    const { error } = await db.rpc("stripe_sync", { p_token: token, ...args });
    if (error) return new NextResponse("sync failed", { status: 500 });
  }
  return NextResponse.json({ received: true });
}
