import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/stripe";
import { billingPortalUrl } from "@/lib/plans";

// Change plan, update card or cancel: Stripe's hosted customer portal (emailed sign-in link).
export async function POST() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${siteUrl()}/login`, 303);
  const url = new URL(billingPortalUrl);
  if (user.email) url.searchParams.set("prefilled_email", user.email);
  return NextResponse.redirect(url.toString(), 303);
}
