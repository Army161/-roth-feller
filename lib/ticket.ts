// Ticket sizing for the Risk Manager.
// Ported from hypergrok-trading-desk (MIT, (c) galleonlabs) desk-risk-limits §2.2 and
// scripts/stop_cost.py. See THIRD_PARTY_NOTICES.md.
//
// Invariant: a position is sized on the *stressed* stop distance (slippage + both
// taker legs), never the drawn distance, so a triggered stop costs no more than the
// risk budget the user wrote.

export type TicketInput = {
  equity: number; // account equity in quote currency
  riskPct: number; // percent of equity the user accepts to lose, e.g. 0.5
  entry: number;
  stop: number;
  takerFeePct?: number; // percent per leg, default 0.045 (Hyperliquid base perp tier)
  slipBps?: number; // slippage floor in bps of entry, default 10
  sizeDecimals?: number; // lot precision, default 4
};

export type TicketSizing = {
  side: "buy" | "sell";
  riskUsd: number;
  drawnDistance: number;
  slip: number;
  stopFill: number;
  feesPerUnit: number;
  stressedDistance: number;
  size: number;
  notional: number;
};

export class TicketError extends Error {}

const roundDown = (value: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.floor(value * f + 1e-9) / f;
};

export function sizeTicket(input: TicketInput): TicketSizing {
  const { equity, riskPct, entry, stop } = input;
  const takerFeePct = input.takerFeePct ?? 0.045;
  const slipBps = input.slipBps ?? 10;
  const sizeDecimals = input.sizeDecimals ?? 4;

  for (const [name, v] of Object.entries({ equity, riskPct, entry, stop })) {
    if (!Number.isFinite(v) || v <= 0) throw new TicketError(`${name} must be a positive number`);
  }
  if (riskPct > 10) throw new TicketError("risk above 10% of equity is outside every desk limit");
  if (entry === stop) throw new TicketError("the stop must differ from the entry");

  const long = stop < entry;
  const riskUsd = (equity * riskPct) / 100;
  const slip = (entry * slipBps) / 10_000;
  const stopFill = long ? stop - slip : stop + slip;
  if (stopFill <= 0) throw new TicketError("slippage leaves no positive stop fill");
  const feesPerUnit = ((entry + stopFill) * takerFeePct) / 100;
  const stressedDistance = Math.abs(entry - stopFill) + feesPerUnit;
  const size = roundDown(riskUsd / stressedDistance, sizeDecimals);

  return {
    side: long ? "buy" : "sell",
    riskUsd,
    drawnDistance: Math.abs(entry - stop),
    slip,
    stopFill,
    feesPerUnit,
    stressedDistance,
    size,
    notional: size * entry,
  };
}

// Ticket ids: RF-YYYYMMDD-NN, unique per desk per day.
export function ticketId(date: Date, sequence: number): string {
  const d = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `RF-${d}-${String(sequence).padStart(2, "0")}`;
}
