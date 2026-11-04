// Illustrative tickets for the landing page. Every figure is computed, so it adds up;
// none is a real customer's trade.
import { sizeTicket } from "./ticket.ts";

export type SampleTicket = {
  id: string;
  venue: string;
  mode: string;
  market: string;
  evidence: string[];
  rows: [string, string][];
  approve: string;
};

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const eth = sizeTicket({ equity: 10_200, riskPct: 0.5, entry: 3000, stop: 2900 });
const aapl = sizeTicket({ equity: 25_000, riskPct: 0.5, entry: 228.4, stop: 221, takerFeePct: 0, sizeDecimals: 0 });

export const sampleTickets: SampleTicket[] = [
  {
    id: "RF-20261104-01",
    evidence: ["Market Analyst · funding +0.0100%/h, depth $4.1M at 10 bps", "Strategist · breakout retest, 4h close above 2,980"],
    venue: "Hyperliquid",
    mode: "Paper",
    market: "ETH perpetual",
    rows: [
      ["Side", "Buy"],
      ["Size", `${fmt(eth.size, 4)} ETH`],
      ["Entry", "limit 3,000.00"],
      ["Stop", "2,900.00, sent with entry"],
      ["Stressed stop", `${fmt(eth.stressedDistance)} per ETH`],
      ["Risk", `$${fmt(eth.riskUsd)} · 0.5% of equity`],
    ],
    approve: "approve RF-20261104-01",
  },
  {
    id: "RF-20261104-02",
    evidence: ["Research Analyst · earnings in 9 days, no guidance change", "Market Analyst · spread 1 cent, volume 1.2× average"],
    venue: "Charles Schwab",
    mode: "Paper",
    market: "AAPL shares",
    rows: [
      ["Side", "Buy"],
      ["Size", `${aapl.size} shares`],
      ["Entry", "limit 228.40"],
      ["Stop", "221.00, good till cancelled"],
      ["Stressed stop", `${fmt(aapl.stressedDistance)} per share`],
      ["Risk", `$${fmt(aapl.size * aapl.stressedDistance)} of $125.00 budget`],
    ],
    approve: "approve RF-20261104-02",
  },
  {
    id: "RF-20261104-03",
    evidence: ["Research Analyst · next FOMC meeting December 9–10", "Odds Lens · options imply 58%, crowd says 62%"],
    venue: "Kalshi",
    mode: "Paper",
    market: "Fed cuts in December",
    rows: [
      ["Side", "Buy YES"],
      ["Size", "80 contracts"],
      ["Price", "$0.62 each"],
      ["Cost", "$49.60"],
      ["Most you can lose", "$49.60"],
      ["Pays if right", "$80.00"],
    ],
    approve: "approve RF-20261104-03",
  },
  {
    id: "RF-20261104-04",
    evidence: ["Strategist · defined-risk call, 45 days to expiry", "Market Analyst · implied volatility 14.2%, below 30-day mean"],
    venue: "Interactive Brokers",
    mode: "Paper",
    market: "SPY 590 call, Dec 19",
    rows: [
      ["Side", "Buy to open"],
      ["Size", "1 contract"],
      ["Premium", "$6.20 × 100"],
      ["Cost", "$620.00 + $0.65 fee"],
      ["Most you can lose", "$620.65"],
      ["Risk", "0.48% of $130,000"],
    ],
    approve: "approve RF-20261104-04",
  },
];

export type Venue = {
  name: string;
  market: string;
  connect: string;
  practice: string;
  status: string;
  detail: string;
};

// From the connectors present in the four source repositories.
export const venues: Venue[] = [
  { name: "Interactive Brokers", market: "Stocks, options, futures", connect: "Gateway", practice: "Paper account", status: "Stocks", detail: "Stocks, options, futures and forex in one account. Your desk backtests on the same strategy code it trades with." },
  { name: "Charles Schwab", market: "Stocks, options", connect: "OAuth", practice: "Simulated", status: "Stocks", detail: "Sign in with Schwab; no password ever reaches us. Tickets carry the option chain your Strategist used." },
  { name: "Alpaca", market: "Stocks, crypto", connect: "OAuth", practice: "Paper account", status: "Stocks", detail: "Free paper trading from the first minute, so your desk can prove itself before real money." },
  { name: "Hyperliquid", market: "Crypto perpetuals", connect: "API wallet", practice: "Testnet", status: "Crypto", detail: "An API wallet that can trade but can never withdraw. Entry and stop leave together as one grouped order, once." },
  { name: "Binance", market: "Spot, perpetuals", connect: "Trade-only key", practice: "Testnet", status: "Crypto", detail: "Withdrawal rights off, IP-locked key. The Risk Manager sizes on the stressed stop, fees on both legs included." },
  { name: "Kalshi", market: "Event contracts", connect: "API key", practice: "Demo", status: "Events", detail: "Regulated event contracts in the US. The most you can lose is printed on every ticket before you approve." },
  { name: "Polymarket", market: "Prediction markets", connect: "Wallet", practice: "Simulated", status: "Events", detail: "Odds Lens sets the crowd's odds beside what options markets imply for the same event." },
  { name: "Tradovate", market: "Futures", connect: "OAuth", practice: "Demo", status: "Futures", detail: "Micro and full-size futures with the stop sent alongside the entry." },
  { name: "Jupiter and Uniswap", market: "DeFi swaps", connect: "Your wallet", practice: "Simulated", status: "DeFi", detail: "Your wallet signs every swap. Roth-Feller never holds a key that can move your coins." },
];
