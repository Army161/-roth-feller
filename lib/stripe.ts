import Stripe from "stripe";

// Webhook signature checks need only the endpoint secret, never an API key.
const verifier = new Stripe("sk_unused_for_signature_checks");

export function verifyStripeEvent(body: string, signature: string, secret: string): Stripe.Event {
  return verifier.webhooks.constructEvent(body, signature, secret);
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
