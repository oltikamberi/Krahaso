import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CategoryNavBar } from "@/components/category-nav-bar";
import { SupportPopup } from "@/components/support-popup";
import { ThemeProvider } from "@/components/theme-provider";
import { LockViewport } from "@/components/lock-viewport";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Krahaso Çmimin — Krahaso çmimet në Kosovë",
  description:
    "Krahaso çmimet e produkteve elektronike nga dyqanet online në Kosovë dhe gjej ofertën më të mirë.",
};

/** Pin the scale on iPhone — pinch / double-tap zoom should not move the layout. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sq"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>
          <LockViewport />
          <SiteHeader />
          <CategoryNavBar className="hidden md:block" />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <SupportPopup />
        </ThemeProvider>
      </body>
    </html>
  );
}
