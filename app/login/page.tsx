import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./form";

export const metadata = { title: "Sign in — Roth-Feller" };

export default function LoginPage() {
  return (
    <main className="auth">
      <header className="nav">
        <Link href="/" className="mark">Roth-Feller</Link>
      </header>
      <section className="auth-panel" aria-labelledby="auth-title">
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
