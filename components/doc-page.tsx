import Link from "next/link";

export function DocPage({ title, lede, sections }: { title: string; lede: string; sections: [string, string[]][] }) {
  return (
    <main className="doc">
      <header className="nav">
        <Link href="/" className="mark">Roth-Feller</Link>
        <nav className="links" aria-label="Main">
          <Link className="link" href="/#pricing">Pricing</Link>
          <Link className="link" href="/login">Sign in</Link>
        </nav>
      </header>
      <article className="doc-body">
        <h1>{title}</h1>
        <p className="doc-lede">{lede}</p>
        {sections.map(([h, ps]) => (
          <section key={h}>
            <h2>{h}</h2>
            {ps.map((p) => <p key={p}>{p}</p>)}
          </section>
        ))}
        <p className="doc-foot"><Link href="/">Back to Roth-Feller</Link></p>
      </article>
    </main>
  );
}
