import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Your desk — Roth-Feller" };

const roles = [
  ["Desk Lead", "Runs the floor and keeps every trade on the same path."],
  ["Market Analyst", "Live prices, depth and funding, each with source and time."],
  ["Research Analyst", "News, catalysts and filings that matter to your idea."],
  ["Strategist", "Turns ideas into rules and tests them on real history."],
  ["Risk Manager", "Sizes every ticket from your account and can say no."],
  ["Execution Trader", "Sends the ticket you approved, once, and reconciles it."],
  ["Trade Reviewer", "Grades process and outcome separately, in your journal."],
];

export default async function DeskPage({ searchParams }: { searchParams: Promise<{ billing?: string }> }) {
  const { billing } = await searchParams;
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const [{ data: profile }, { data: desks }, { data: tickets }] = await Promise.all([
    supabase.from("profiles").select("display_name, plan").eq("id", auth.user.id).single(),
    supabase.from("desks").select("id, name, mode").order("created_at"),
    supabase.from("tickets").select("id, market, venue, status, created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  const desk = desks?.[0];

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
        <p className="muted">Mode: {desk?.mode ?? "paper"}. Live trading unlocks after your desk graduates from paper.</p>

        <h2>Tickets</h2>
        {tickets && tickets.length > 0 ? (
          <table className="app-table num">
            <thead><tr><th>Ticket</th><th>Market</th><th>Venue</th><th>Status</th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}><td>{t.id}</td><td>{t.market}</td><td>{t.venue}</td><td>{t.status}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No tickets yet. Your first one will be a paper trade you can approve and watch fill.</p>
        )}

        <h2>Your team</h2>
        <dl className="app-roles">
          {roles.map(([r, d]) => (
            <div key={r}><dt>{r}</dt><dd>{d}</dd></div>
          ))}
        </dl>
      </section>
    </main>
  );
}
