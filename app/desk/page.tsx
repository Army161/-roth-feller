import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { approvePaperTicket } from "./actions";
import { TicketForm } from "./ticket-form";

export const metadata = { title: "Your desk — Roth-Feller" };

// "today" marks roles that act on every paper ticket now; the rest join in later releases.
const roles: { name: string; job: string; today: string | null }[] = [
  { name: "Desk Lead", job: "Runs the floor and keeps every trade on the same path.", today: "Queues your ticket and starts its 15-minute approval clock." },
  { name: "Risk Manager", job: "Sizes every ticket from your account and can say no.", today: "Sizes each ticket on the stressed stop and refuses bad ones." },
  { name: "Execution Trader", job: "Sends the ticket you approved, once, and reconciles it.", today: "Fills your approved ticket on paper and logs the fill." },
  { name: "Market Analyst", job: "Live prices, depth and funding, each with source and time.", today: null },
  { name: "Research Analyst", job: "News, catalysts and filings that matter to your idea.", today: null },
  { name: "Strategist", job: "Turns ideas into rules and tests them on real history.", today: null },
  { name: "Trade Reviewer", job: "Grades process and outcome separately, in your journal.", today: null },
];

const statusLabel: Record<string, string> = {
  awaiting_approval: "Awaiting your approval",
  approved: "Approved",
  filled: "Filled (paper)",
  expired: "Expired",
  risk_reject: "Refused by Risk",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

type Search = { billing?: string; error?: string; created?: string; filled?: string };

export default async function DeskPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { billing, error, created, filled } = await searchParams;
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const [{ data: profile }, { data: desks }, { data: tickets }] = await Promise.all([
    supabase.from("profiles").select("display_name, plan").eq("id", auth.user.id).single(),
    supabase.from("desks").select("id, name, mode").order("created_at"),
    supabase
      .from("tickets")
      .select("id, market, side, size, entry, stop, risk_usd, status, expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const desk = desks?.[0];
  const now = Date.now();
  const hasTickets = !!tickets && tickets.length > 0;

  return (
    <main className="app">
      <header className="app-bar">
        <Link href="/" className="mark">Roth-Feller</Link>
        <span className="muted">{profile?.display_name} · {profile?.plan ?? "free"} plan</span>
        {profile?.plan && profile.plan !== "free" && (
          <form action="/api/billing/portal" method="post"><button className="link auth-alt" type="submit">Billing</button></form>
        )}
        <form action="/auth/signout" method="post"><button className="link auth-alt" type="submit">Sign out</button></form>
      </header>
      <section className="app-main" aria-labelledby="desk-title">
        <h1 id="desk-title">{desk?.name ?? "My desk"}</h1>
        {billing === "success" && <p role="status">Thank you. Your membership is active; it can take a moment to show here.</p>}
        {billing === "soon" && <p role="status">Paid plans open shortly. Your desk runs on the free Research plan until then.</p>}
        <p className="muted">Mode: {desk?.mode ?? "paper"}. Paper trades use pretend money. Live trading unlocks after your desk graduates from paper.</p>

        {!hasTickets && (
          <ol className="steps">
            <li><strong>Write a ticket.</strong> Pick a market, your entry and where you would get out if wrong.</li>
            <li><strong>Read the Risk Manager&rsquo;s size.</strong> It caps the loss at the risk you chose, slippage and fees included.</li>
            <li><strong>Approve it within 15 minutes.</strong> The Execution Trader fills it on paper and logs every step.</li>
          </ol>
        )}

        <h2 id="tickets">{hasTickets ? "Write another paper ticket" : "Write your first paper ticket"}</h2>
        {error && <p role="alert" className="note-bad">{error}</p>}
        {created && <p role="status" className="note-good">Ticket {created} passed Risk. Approve it below within 15 minutes.</p>}
        {filled && <p role="status" className="note-good">Ticket {filled} filled on paper.</p>}
        <TicketForm />

        <h2>Tickets</h2>
        {hasTickets ? (
          <div className="table-wrap">
            <table className="app-table num">
              <thead>
                <tr><th>Ticket</th><th>Market</th><th>Trade</th><th>Stop</th><th>At risk</th><th>Status</th></tr>
              </thead>
              <tbody>
                {tickets.map((t) => {
                  const expired = t.status === "awaiting_approval" && new Date(t.expires_at).getTime() <= now;
                  const status = expired ? "expired" : t.status;
                  return (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.market}</td>
                      <td>{t.side} {Number(t.size)} @ {Number(t.entry).toLocaleString("en-US")}</td>
                      <td>{Number(t.stop).toLocaleString("en-US")}</td>
                      <td>${Number(t.risk_usd).toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                      <td>
                        {status === "awaiting_approval" ? (
                          <form action={approvePaperTicket}>
                            <input type="hidden" name="ticket_id" value={t.id} />
                            <button className="btn btn-small" type="submit">Approve</button>
                          </form>
                        ) : (
                          statusLabel[status] ?? status
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">None yet. Your tickets show here with their status.</p>
        )}

        <h2>Your team</h2>
        <p className="muted">Seven desk roles handle every ticket the same way. You don&rsquo;t manage them; they work on each ticket you write. Three are on duty today.</p>
        <dl className="app-roles">
          {roles.map((r) => (
            <div key={r.name} className={r.today ? "on" : undefined}>
              <dt>{r.name} <span className="role-tag">{r.today ? "On duty" : "Coming soon"}</span></dt>
              <dd>{r.today ?? r.job}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
