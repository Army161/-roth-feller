"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { sizeTicket, TicketError } from "@/lib/ticket";

const assetClasses = ["crypto", "stocks", "options", "futures", "forex", "prediction", "defi"] as const;
type AssetClass = (typeof assetClasses)[number];

const back = (params: Record<string, string>): never => redirect(`/desk?${new URLSearchParams(params)}#tickets`);

// "Function not found" means the paper-ticket migration is not on this database yet.
const friendly = (e: { code?: string; message: string }) =>
  e.code === "PGRST202" || e.code === "42883"
    ? "Paper tickets are still switching on for your desk. Try again in a few minutes."
    : e.message;

const num = (form: FormData, k: string) => Number(String(form.get(k) ?? "").replace(/[,\s$%]/g, ""));

export async function createPaperTicket(form: FormData) {
  const market = String(form.get("market") ?? "").trim();
  const assetClass = String(form.get("asset_class") ?? "crypto") as AssetClass;
  if (!market) back({ error: "Name the market, for example BTC-PERP or AAPL." });
  if (!assetClasses.includes(assetClass)) back({ error: "Pick a market type from the list." });

  const equity = num(form, "equity");
  const riskPct = num(form, "risk_pct");
  const entry = num(form, "entry");
  const stop = num(form, "stop");

  let sizing;
  try {
    sizing = sizeTicket({ equity, riskPct, entry, stop });
  } catch (e) {
    if (e instanceof TicketError) back({ error: e.message });
    throw e;
  }
  if (sizing.size <= 0) {
    back({ error: "That risk is too small to buy one unit at this stop. Raise the risk or move the stop closer." });
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("create_paper_ticket", {
    p_market: market,
    p_asset_class: assetClass,
    p_side: sizing.side,
    p_size: sizing.size,
    p_entry: entry,
    p_stop: stop,
    p_risk_usd: sizing.riskUsd,
    p_stressed_distance: sizing.stressedDistance,
    p_evidence: [
      {
        role: "Risk Manager",
        note: `risked ${riskPct}% of ${equity}; stressed stop distance ${sizing.stressedDistance.toFixed(6)} per unit`,
      },
    ],
  });
  if (error) back({ error: friendly(error) });
  revalidatePath("/desk");
  back({ created: (data as { id: string }).id });
}

export async function approvePaperTicket(form: FormData) {
  const id = String(form.get("ticket_id") ?? "");
  const supabase = await supabaseServer();
  const approved = await supabase.rpc("approve_ticket", { p_ticket_id: id });
  if (approved.error) back({ error: friendly(approved.error) });
  const filled = await supabase.rpc("fill_paper_ticket", { p_ticket_id: id });
  if (filled.error) back({ error: friendly(filled.error) });
  revalidatePath("/desk");
  back({ filled: id });
}
