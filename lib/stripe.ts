import Stripe from "stripe";

let client: Stripe | null = null;

// Returns null until STRIPE_SECRET_KEY is set, so the site still builds and runs without billing.
export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
