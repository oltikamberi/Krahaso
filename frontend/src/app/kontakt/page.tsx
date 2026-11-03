import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { InfoPage, LegalSection } from "@/components/info-page";
import { CONTACT_EMAIL, LEGAL_JURISDICTION, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Na kontaktoni — ${SITE_NAME}`,
  description: "Kontaktoni ekipin e Krahaso Çmimin.",
};

export default function ContactPage() {
  return (
    <InfoPage
      title="Na kontaktoni"
      intro="Për pyetje mbi platformën, llogarinë e shitësit, privatësinë ose bashkëpunime, na shkruani. Për porosi, fatura dhe kthime kontaktoni dyqanin ku keni blerë."
    >
      <LegalSection title="Të dhënat e operatorit">
        <p>
          <strong>{SITE_NAME}</strong>
          <br />
          Operator i platformës së krahasimit të çmimeve
          <br />
          {LEGAL_JURISDICTION}
          <br />
          Email:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold underline">
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>
          Nuk kemi dyqan fizik të shitjes. Kjo adresë email shërben për
          komunikim me përdoruesit dhe për kërkesat mbi mbrojtjen e të dhënave.
        </p>
      </LegalSection>
      <ContactForm kind="contact" />
    </InfoPage>
  );
}
