import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CompareProvider } from "@/components/compare-context";
import { CompareBar } from "@/components/compare-bar";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Krahaso — Krahaso çmimet në Kosovë",
  description:
    "Krahaso çmimet e produkteve elektronike nga dyqanet online në Kosovë dhe gjej ofertën më të mirë.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sq"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CompareProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8">
            {children}
          </main>
          <footer className="border-t py-6">
            <p className="mx-auto max-w-6xl px-4 text-sm text-muted-foreground">
              Krahaso — krahasimi i çmimeve për tregun e Kosovës
            </p>
          </footer>
          <CompareBar />
        </CompareProvider>
      </body>
    </html>
  );
}
