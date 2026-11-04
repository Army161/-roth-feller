import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { stripe, siteUrl } from "@/lib/stripe";

// Change plan, update card or cancel: Stripe's hosted customer portal.
export async function POST() {
  const base = siteUrl();
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${base}/login`, 303);

  const s = stripe();
  const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("owner", user.id).maybeSingle();
  if (!s || !sub?.stripe_customer_id) return NextResponse.redirect(`${base}/#pricing`, 303);

  const portal = await s.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: `${base}/desk` });
  return NextResponse.redirect(portal.url, 303);
}
