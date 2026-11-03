import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `FAQ — ${SITE_NAME}`,
  description: "Pyetjet e shpeshta për Krahaso Çmimin.",
};

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "A shet Krahaso Çmimin produkte?",
    a: "Jo. Ne jemi platformë krahasimi. Blerja bëhet te dyqani që zgjidhni.",
  },
  {
    q: "A janë çmimet gjithmonë të sakta?",
    a: "I përditësojmë sa herë na vijnë të dhëna të reja nga dyqanet, por çmimi përfundimtar është ai që shfaq shitësi në momentin e blerjes. Nëse shihni një gabim, na e tregoni te «Raportoni gabim».",
  },
  {
    q: "Pse disa produkte nuk shfaqen?",
    a: "Katalogu publik tregon produkte që janë në stok dhe që krahasohen nga të paktën dy dyqane. Pjesët e vogla dhe aksesorët e lirë mund të fshihen që lista të mbetet e qartë.",
  },
  {
    q: "A paguaj për ta përdorur?",
    a: "Jo. Krahasimi për vizitorët është falas. Mund të na përkrahni vullnetarisht përmes «Përkrah».",
  },
  {
    q: "Si regjistrohet një dyqan?",
    a: (
      <>
        Hapni{" "}
        <Link href="/regjistrohu" className="font-semibold underline">
          Regjistrohu
        </Link>{" "}
        dhe krijoni llogarinë e shitësit. Integrimet e plota (feed URL / API) janë
        të kufizuara gjatë fazës Beta.
      </>
    ),
  },
  {
    q: "Ku e dërgoj një ankesë për një porosi?",
    a: "Te dyqani ku keni paguar. Ne nuk përpunojmë porositë, pagesat e mallrave, as kthimet. Për gabime në platformë na shkruani neve.",
  },
];

export default function FaqPage() {
  return (
    <InfoPage
      title="Pyetje të shpeshta"
      intro="Përgjigje të shkurtra për mënyrën se si punon platforma. Nëse nuk e gjeni përgjigjen, na shkruani."
    >
      <dl className="space-y-6">
        {FAQS.map((item) => (
          <div key={item.q}>
            <dt
              className="text-base font-bold"
              style={{ color: "var(--heading)" }}
            >
              {item.q}
            </dt>
            <dd className="mt-1.5" style={{ color: "var(--foreground)" }}>
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        Kontakt:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold underline">
          {CONTACT_EMAIL}
        </a>
      </p>
    </InfoPage>
  );
}
