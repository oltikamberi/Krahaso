import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, LegalSection } from "@/components/info-page";
import {
  CONTACT_EMAIL,
  LEGAL_JURISDICTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  title: `Politika e privatësisë — ${SITE_NAME}`,
  description: `Si i përpunon ${SITE_NAME} të dhënat personale, sipas ligjit të Kosovës.`,
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Politika e privatësisë"
      intro={`${SITE_NAME} respekton të drejtën tuaj për privatësi. Kjo politikë shpjegon çfarë të dhënash mbledhim, pse, dhe çfarë të drejtash keni sipas Ligjit nr. 06/L-082 për Mbrojtjen e të Dhënave Personale të Republikës së Kosovës.`}
    >
      <LegalSection title="1. Kush jemi">
        <p>
          Kontrollues i të dhënave është operatori i platformës {SITE_NAME}.
          Veprimtaria zhvillohet në Kosovë ({LEGAL_JURISDICTION}). Faqja
          publike:
          {" "}
          <a href={SITE_URL} className="underline">
            {SITE_URL}
          </a>
          . Për çdo kërkesë:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
      <LegalSection title="2. Çfarë të dhënash mbledhim">
        <p>
          <strong>Vizitorët.</strong> Kur shfletoni faqen, serverët tanë (dhe
          nikoqiri i hostingut) mund të regjistrojnë të dhëna teknike: adresë
          IP, lloj shfletuesi, faqe e vizituar, koha. Kërkimet që shkruani
          përdoren për t’ju treguar rezultate, jo për t’ju identifikuar.
        </p>
        <p>
          <strong>Shitësit me llogari.</strong> Emër, email kontakti, të dhëna
          të dyqanit, fjalëkalim i hash-uar, çelësa API që ju gjenerojmë, dhe
          përmbajtja e listave të produkteve që ngarkoni.
        </p>
        <p>
          <strong>Përkrahja vullnetare.</strong> Nëse zgjidhni të na përkrahni,
          pagesa përpunohet nga Whop. Ne nuk ruajmë numrin e kartës suaj. Whop
          mund të na dërgojë konfirmim të shumës.
        </p>
        <p>
          Nuk kërkojmë, dhe ju lutemi të mos na dërgoni, kategori të veçanta të
          dhënash (shëndet, biometri, origjinë etnike, etj.).
        </p>
      </LegalSection>
      <LegalSection title="3. Pse i përpunojmë (baza ligjore)">
        <p>
          Sipas Ligjit 06/L-082, përpunimi bëhet vetëm kur kemi një bazë
          ligjore:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Interesi legjitim</strong> — të ofrojmë, sigurojmë dhe
            përmirësojmë krahasimin e çmimeve, të parandalojmë abuzimin.
          </li>
          <li>
            <strong>Kontrata</strong> — llogaria e shitësit dhe dërgimi i
            listave të produkteve.
          </li>
          <li>
            <strong>Pëlqimi</strong> — kur na shkruani vullnetarisht ose kur
            na përkrahni me pagesë.
          </li>
          <li>
            <strong>Detyrimi ligjor</strong> — nëse na kërkohet nga autoriteti
            kompetent.
          </li>
        </ul>
      </LegalSection>
      <LegalSection title="4. Me kë i ndajmë">
        <p>
          Nuk i shesim të dhënat tuaja. I ndajmë vetëm me:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Nikoqirin e hostingut (Vercel për faqen, Render për API/databazën), që i përpunojnë sipas udhëzimeve tona.</li>
          <li>Whop, vetëm nëse nisni një pagesë përkrahjeje.</li>
          <li>Dyqanet, vetëm kur ju klikoni te oferta e tyre (ata shohin vizitën si çdo trafik tjetër).</li>
          <li>Autoritetet, nëse kërkohet me ligj.</li>
        </ul>
      </LegalSection>
      <LegalSection title="5. Sa kohë i mbajmë">
        <p>
          Të dhënat e llogarisë së shitësit mbahen sa kohë llogaria është aktive
          dhe një periudhë të arsyeshme pas mbylljes, për siguri dhe detyrime
          ligjore. Logjet teknike ruhen për një kohë të kufizuar. Mesazhet që
          na dërgoni me email ruhen sa na duhen për t’iu përgjigjur.
        </p>
      </LegalSection>
      <LegalSection title="6. Cookies dhe ruajtja lokale">
        <p>
          Shihni{" "}
          <Link href="/cookies" className="font-semibold underline">
            politikën e cookies
          </Link>
          . Përdorim cookies të nevojshme për sesionin e shitësit dhe ruajtje
          lokale për temën e faqes dhe për mos t’ju shfaqim përsëri dritaren e
          përkrahjes.
        </p>
      </LegalSection>
      <LegalSection title="7. Të drejtat tuaja">
        <p>
          Sipas Ligjit 06/L-082, mund të kërkoni: qasje, ndreqje, fshirje,
          kufizim të përpunimit, kundërshtim, dhe bartje të të dhënave, kur këto
          të drejta zbatohen. Për t’i ushtruar, shkruani te {CONTACT_EMAIL}.
          Mund t’ju kërkojmë të vërtetoni identitetin, që të mos ia japim të
          dhënat dikujt tjetër.
        </p>
        <p>
          Keni të drejtë të paraqisni ankesë te{" "}
          <strong>Agjencia për Informim dhe Privatësi (AIP)</strong> e
          Republikës së Kosovës, nëse vlerësoni se të drejtat tuaja janë
          shkelur.
        </p>
      </LegalSection>
      <LegalSection title="8. Të miturit">
        <p>
          Platforma nuk drejtohet te fëmijët. Nuk mbledhim me vetëdije të dhëna
          të të miturve. Nëse mendoni se kemi të dhëna të tilla, na njoftoni
          për t’i fshirë.
        </p>
      </LegalSection>
      <LegalSection title="9. Ndryshimet">
        <p>
          Mund ta përditësojmë këtë politikë. Data e sipërme tregon versionin
          e fundit. Ndryshimet thelbësore do t’i shënojmë në faqe.
        </p>
      </LegalSection>
    </InfoPage>
  );
}
