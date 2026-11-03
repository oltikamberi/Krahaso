/** Public operator details used by footer and legal pages. */
export const SITE_NAME = "Krahaso Çmimin";
export const SITE_URL = "https://krahaso-seven.vercel.app";
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "kontakt@krahaso.com";
export const LEGAL_UPDATED = "3 nëntor 2026";
export const LEGAL_JURISDICTION = "Republika e Kosovës";

export const FOOTER_COLUMNS = [
  {
    title: "Platformë",
    links: [{ label: "Si funksionon", href: "/si-funksionon" }],
  },
  {
    title: "Mbështetje",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Na kontaktoni", href: "/kontakt" },
      { label: "Raportoni gabim", href: "/raporto" },
    ],
  },
  {
    title: "Ligjore",
    links: [
      { label: "Privatësia", href: "/privatesia" },
      { label: "Kushtet e përdorimit", href: "/kushtet" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
] as const;
