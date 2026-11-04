import { createClient } from "@supabase/supabase-js";

// Server-only client for webhooks. Uses the secret key, bypasses RLS: never import from client code.
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
}
