"use client";

import { useState } from "react";
import { sizeTicket, TicketError } from "@/lib/ticket";
import { createPaperTicket } from "./actions";

const markets = [
  ["crypto", "Crypto"],
  ["stocks", "Stocks"],
  ["options", "Options"],
  ["futures", "Futures"],
  ["forex", "Forex"],
  ["prediction", "Prediction markets"],
] as const;

const money = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const clean = (s: string) => Number(s.replace(/[,\s$%]/g, ""));

export function TicketForm() {
  const [v, setV] = useState({ market: "BTC-PERP", asset_class: "crypto", equity: "10000", risk_pct: "0.5", entry: "", stop: "" });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV({ ...v, [k]: e.target.value });

  let preview: string;
  try {
    if (!v.entry || !v.stop) throw new TicketError("Enter an entry and a stop, and the Risk Manager sizes it here.");
    const s = sizeTicket({ equity: clean(v.equity), riskPct: clean(v.risk_pct), entry: clean(v.entry), stop: clean(v.stop) });
    preview =
      s.size > 0
        ? `${s.side === "buy" ? "Buy" : "Sell"} ${s.size} at ${money(clean(v.entry))}, about $${money(s.notional)}. If the stop hits you lose about $${money(s.riskUsd)}, slippage and fees included.`
        : "That risk is too small to buy one unit at this stop.";
  } catch (e) {
    preview = e instanceof TicketError ? e.message : "Check the numbers.";
  }

  return (
    <form action={createPaperTicket} className="ticket-form">
      <label>
        Market
        <input name="market" value={v.market} onChange={set("market")} maxLength={80} required />
      </label>
      <label>
        Type
        <select name="asset_class" value={v.asset_class} onChange={set("asset_class")}>
          {markets.map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      </label>
      <label>
        Paper account ($)
        <input name="equity" inputMode="decimal" value={v.equity} onChange={set("equity")} required />
      </label>
      <label>
        Risk per trade (%)
        <input name="risk_pct" inputMode="decimal" value={v.risk_pct} onChange={set("risk_pct")} required />
      </label>
      <label>
        Entry price
        <input name="entry" inputMode="decimal" value={v.entry} onChange={set("entry")} placeholder="100000" required />
      </label>
      <label>
        Stop price
        <input name="stop" inputMode="decimal" value={v.stop} onChange={set("stop")} placeholder="98000" required />
      </label>
      <p className="ticket-preview" aria-live="polite">{preview}</p>
      <button className="btn" type="submit">Send to Risk Manager</button>
    </form>
  );
}
