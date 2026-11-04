import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/stripe";
import { lookupKey, paidPlans, paymentLinks, type Interval, type PlanId } from "@/lib/plans";

// Form POST from the pricing menu: plan + interval -> the matching Stripe Payment Link,
// tagged with the signed-in user's id so the webhook can credit the right desk.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  return go(String(form.get("plan")) as PlanId, String(form.get("interval")) === "year" ? "year" : "month");
}

// GET lets the login flow resume a purchase: /api/checkout?plan=pro&interval=year
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  return go(String(q.get("plan")) as PlanId, q.get("interval") === "year" ? "year" : "month");
}

async function go(plan: PlanId, interval: Interval) {
  const base = siteUrl();
  if (!paidPlans.some((p) => p.id === plan)) return NextResponse.redirect(`${base}/#pricing`, 303);

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const next = encodeURIComponent(`/api/checkout?plan=${plan}&interval=${interval}`);
    return NextResponse.redirect(`${base}/login?mode=signup&next=${next}`, 303);
  }

  const link = paymentLinks[lookupKey(plan, interval)];
  if (!link) return NextResponse.redirect(`${base}/desk?billing=soon`, 303);

  const url = new URL(link);
  url.searchParams.set("client_reference_id", user.id);
  if (user.email) url.searchParams.set("prefilled_email", user.email);
  return NextResponse.redirect(url.toString(), 303);
}
