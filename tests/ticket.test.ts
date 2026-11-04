import { test } from "node:test";
import assert from "node:assert/strict";
import { sizeTicket, ticketId, TicketError } from "../lib/ticket.ts";

// Pinned to hypergrok's published worked example (docs/STOP_COST.md, ticket HG-20260816-01).
test("long ETH matches the desk's stressed-stop sizing", () => {
  const t = sizeTicket({ equity: 10_200, riskPct: 0.5, entry: 3000, stop: 2900 });
  assert.equal(t.side, "buy");
  assert.equal(t.riskUsd, 51);
  assert.equal(t.slip, 3);
  assert.equal(t.stopFill, 2897);
  assert.equal(t.feesPerUnit.toFixed(2), "2.65");
  assert.equal(t.stressedDistance.toFixed(2), "105.65");
  assert.equal(t.size, 0.4827);
});

test("a stop above the entry is a short", () => {
  const t = sizeTicket({ equity: 5000, riskPct: 1, entry: 100, stop: 105 });
  assert.equal(t.side, "sell");
  assert.ok(t.size * t.stressedDistance <= t.riskUsd + 1e-9);
});

test("rejects impossible tickets", () => {
  assert.throws(() => sizeTicket({ equity: 1000, riskPct: 0.5, entry: 10, stop: 10 }), TicketError);
  assert.throws(() => sizeTicket({ equity: 1000, riskPct: 25, entry: 10, stop: 9 }), TicketError);
  assert.throws(() => sizeTicket({ equity: -1, riskPct: 1, entry: 10, stop: 9 }), TicketError);
});

test("ticket ids are dated and padded", () => {
  assert.equal(ticketId(new Date("2026-11-04T12:00:00Z"), 1), "RF-20261104-01");
});
