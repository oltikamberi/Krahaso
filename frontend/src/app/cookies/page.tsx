import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, LegalSection } from "@/components/info-page";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Cookies — ${SITE_NAME}`,
  description: `Si i përdor ${SITE_NAME} cookies dhe ruajtjen lokale.`,
};

export default function CookiesPage() {
  return (
    <InfoPage
      title="Politika e cookies"
      intro="Kjo faqe shpjegon cookies dhe ruajtjen lokale që përdor Krahaso Çmimin, në përputhje me Ligjin nr. 06/L-082 për Mbrojtjen e të Dhënave Personale dhe me praktikat e njoftimit për cookies në Kosovë."
    >
      <LegalSection title="1. Çfarë janë cookies">
        <p>
          Cookies janë skedarë të vegjël që shfletuesi i ruan në pajisjen tuaj.
          Përdorim edhe ruajtje lokale (localStorage) për të njëjtin qëllim:
          të mbajmë një cilësim ose një sesion.
        </p>
      </LegalSection>
      <LegalSection title="2. Çfarë përdorim">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="py-2 pr-3 font-bold">Emri</th>
                <th className="py-2 pr-3 font-bold">Lloji</th>
                <th className="py-2 font-bold">Qëllimi</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="py-2 pr-3 font-mono text-xs">krahaso_seller_token</td>
                <td className="py-2 pr-3">E nevojshme</td>
                <td className="py-2">
                  Cookie httpOnly e sesionit të shitësit. Pa këtë, paneli nuk
                  ju mban të kyçur. Nuk lexohet nga JavaScript në shfletues.
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="py-2 pr-3 font-mono text-xs">krahaso-theme</td>
                <td className="py-2 pr-3">Preferencë</td>
                <td className="py-2">
                  Ruajtje lokale: tema e çelët ose e errët që keni zgjedhur.
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="py-2 pr-3 font-mono text-xs">
                  krahaso_support_popup_at
                </td>
                <td className="py-2 pr-3">Preferencë</td>
                <td className="py-2">
                  Ruajtje lokale: që dritarja e përkrahjes të mos ju shfaqet
                  përsëri menjëherë pasi e mbyllni.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-mono text-xs">Whop / Vercel</td>
                <td className="py-2 pr-3">Palë e tretë</td>
                <td className="py-2">
                  Whop mund të vendosë cookies nëse hapni pagesën e përkrahjes.
                  Vercel mund të vendosë cookies teknike për hostingun.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>
      <LegalSection title="3. Pëlqimi">
        <p>
          Cookies e <strong>nevojshme</strong> vendosen sepse pa to shërbimi i
          llogarisë së shitësit nuk punon. Preferencat (tema, dritarja e
          përkrahjes) ruhen në pajisjen tuaj pasi i përdorni funksionin
          përkatës. Nuk përdorim cookies reklamash dhe nuk i shesim të dhënat
          tuaja për marketing të palëve të treta.
        </p>
      </LegalSection>
      <LegalSection title="4. Si t’i kontrolloni">
        <p>
          Shfletuesi juaj lejon bllokimin ose fshirjen e cookies. Nëse i
          bllokoni të gjitha, paneli i shitësit mund të mos mbajë hyrjen.
          Fshirja e të dhënave të faqes heq edhe temën e ruajtur.
        </p>
      </LegalSection>
      <LegalSection title="5. Më shumë">
        <p>
          Shihni{" "}
          <Link href="/privatesia" className="font-semibold underline">
            politikën e privatësisë
          </Link>
          . Pyetje:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </InfoPage>
  );
}
