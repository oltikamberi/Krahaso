import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { InfoPage, LegalSection } from "@/components/info-page";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Raportoni gabim — ${SITE_NAME}`,
  description: "Raportoni një çmim, produkt ose gabim tjetër në Krahaso Çmimin.",
};

export default function ReportPage() {
  return (
    <InfoPage
      title="Raportoni gabim"
      intro="Nëse shihni një çmim të gabuar, një produkt që nuk përputhet, një foto të gabuar ose një problem tjetër në faqe, na e tregoni. E shqyrtojmë dhe e ndreqim sa më shpejt."
    >
      <LegalSection title="Çfarë të përfshini">
        <p>
          Lidhjen e produktit, çmimin që shihni, dyqanin dhe atë që duhet të jetë
          e saktë. Mos dërgoni fjalëkalime, numra kartash ose të dhëna të tjera
          të ndjeshme.
        </p>
      </LegalSection>
      <ContactForm kind="report" />
    </InfoPage>
  );
}
