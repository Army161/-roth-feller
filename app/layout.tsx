import type { Metadata, Viewport } from "next";
import { Imbue, Albert_Sans } from "next/font/google";
import "./globals.css";

const display = Imbue({ subsets: ["latin"], weight: ["400"], variable: "--font-display", display: "swap" });
const text = Albert_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-text", display: "swap" });

export const metadata: Metadata = {
  title: "Roth-Feller — a private trading firm, staffed by AI",
  description:
    "Seven AI desk roles research, size and review every trade across crypto, stocks, options, futures and prediction markets. Nothing is sent until you approve the ticket.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = { themeColor: "#0a0d14", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <body>{children}</body>
    </html>
  );
}
