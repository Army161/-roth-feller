import { DocPage } from "@/components/doc-page";
export const metadata = { title: "Docs — Roth-Feller" };
export default function Page() {
  return <DocPage title="Docs" lede="Everything your desk does, from your first paper ticket to live trading." sections={[
    ["Start on paper", ["Create a free account. Your desk opens in paper mode with no broker keys and no card. Ask the Market Analyst for a brief, then ask for a ticket."]],
    ["How a ticket is sized", ["The Risk Manager takes your account size and the percent you are willing to risk, then sizes the trade on a stressed stop: the distance to your stop, plus slippage of 10 basis points of the entry, plus the taker fee on both the entry and the exit. Size equals your risk in dollars divided by that stressed distance, rounded down to the venue's lot size."]],
    ["Approving and expiry", ["A ticket waits for your approval for 15 minutes. Approve it in the app or by replying with its id in a connected chat app. An expired ticket can never be sent; ask for a fresh one."]],
    ["Graduation", ["A strategy moves from backtest to paper to shadow (live prices, simulated fills) to live with a small starting size. Each step needs results and your written limits."]],
    ["Connecting a broker", ["Open Connections, choose your broker, and sign in with it or paste a trade-only key. Withdrawal permission must be off. You can remove a connection at any time."]],
  ]} />;
}
