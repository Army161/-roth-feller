import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { stripe, siteUrl } from "@/lib/stripe";
import { lookupKey, paidPlans, type Interval, type PlanId } from "@/lib/plans";

// Form POST from the pricing menu: plan + interval -> Stripe Checkout.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const plan = String(form.get("plan")) as PlanId;
  const interval = (String(form.get("interval")) === "year" ? "year" : "month") as Interval;
  const base = siteUrl();

  if (!paidPlans.some((p) => p.id === plan)) return NextResponse.redirect(`${base}/#pricing`, 303);

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const next = encodeURIComponent(`/desk?plan=${plan}&interval=${interval}`);
    return NextResponse.redirect(`${base}/login?mode=signup&next=${next}`, 303);
  }

  const s = stripe();
  if (!s) return NextResponse.redirect(`${base}/desk?billing=soon`, 303);

  const prices = await s.prices.list({ lookup_keys: [lookupKey(plan, interval)], active: true, limit: 1 });
  const price = prices.data[0];
  if (!price) return NextResponse.redirect(`${base}/desk?billing=soon`, 303);

  const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("owner", user.id).maybeSingle();

  const session = await s.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: price.id, quantity: 1 }],
    client_reference_id: user.id,
    ...(sub?.stripe_customer_id ? { customer: sub.stripe_customer_id } : { customer_email: user.email }),
    subscription_data: { metadata: { owner: user.id } },
    metadata: { owner: user.id },
    allow_promotion_codes: true,
    success_url: `${base}/desk?billing=success`,
    cancel_url: `${base}/#pricing`,
  });

  return NextResponse.redirect(session.url!, 303);
}
