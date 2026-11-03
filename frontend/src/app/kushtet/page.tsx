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
  title: `Kushtet e përdorimit — ${SITE_NAME}`,
  description: `Kushtet e përdorimit të platformës ${SITE_NAME}.`,
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Kushtet e përdorimit"
      intro={`Duke përdorur ${SITE_NAME} (${SITE_URL}), pranoni këto kushte. Nëse nuk pajtoheni, mos e përdorni faqen.`}
    >
      <LegalSection title="1. Operator i shërbimit">
        <p>
          {SITE_NAME} është platformë krahasimi çmimesh e operuar në Kosovë
          ({LEGAL_JURISDICTION}). Kontakt:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
      <LegalSection title="2. Çfarë është (dhe çfarë nuk është) shërbimi">
        <p>
          Ne shfaqim informacion për çmime dhe disponibilitet të produkteve nga
          dyqane të treta. <strong>Nuk jemi shitës</strong> i atyre produkteve.
          Nuk lidhim kontratë shitjeje me ju. Kontrata e blerjes, pagesa,
          faturimi, dorëzimi, garancia dhe e drejta e tërheqjes rregullohen nga
          dyqani ku blini dhe nga ligji i zbatueshëm i mbrojtjes së
          konsumatorit.
        </p>
      </LegalSection>
      <LegalSection title="3. Informacioni i çmimeve">
        <p>
          Çmimet, stoku dhe përshkrimet vijnë nga dyqanet ose nga burime që
          përdorim për krahasim. Mund të jenë të paplota, të vonuara ose të
          pasakta. Para se të paguani, kontrolloni te shitësi çmimin, taksat,
          transportin dhe kushtet. Nuk garantojmë se një çmim i shfaqur këtu
          do të jetë i njëjtë në arkë.
        </p>
      </LegalSection>
      <LegalSection title="4. Lidhjet te dyqanet">
        <p>
          Lidhjet «Shiko produktin» / «Shko te dyqani» ju çojnë në faqe të
          palëve të treta. Për ato faqe nuk kemi kontroll. Politikat e tyre të
          privatësisë dhe kushtet e tyre zbatohen sapo dilni nga {SITE_NAME}.
        </p>
      </LegalSection>
      <LegalSection title="5. Llogaria e shitësit">
        <p>
          Nëse regjistroheni si shitës, jeni përgjegjës për saktësinë e të
          dhënave të dyqanit dhe të listave të produkteve, për ruajtjen e
          fjalëkalimit dhe të çelësave API, dhe për të mos ngarkuar përmbajtje
          të paligjshme. Mund ta pezullojmë ose ta mbyllim llogarinë në rast
          abuzimi, mashtrimi, ose shkeljeje të këtyre kushteve.
        </p>
      </LegalSection>
      <LegalSection title="6. Përdorimi i pranueshëm">
        <p>
          Nuk lejohet: gërvishtja masive e faqes pa leje, ngarkimi i malware,
          përpjekje për hyrje të paautorizuar, mashtrim me çmime, ose përdorim
          që cënon të drejtat e të tjerëve. Faqja ofrohet «siç është» gjatë
          fazës Beta; mund të ketë ndërprerje.
        </p>
      </LegalSection>
      <LegalSection title="7. Pronësia intelektuale">
        <p>
          Emri, logoja dhe paraqitja e {SITE_NAME} janë të operatorit. Emrat,
          logot dhe fotografitë e produkteve i përkasin dyqaneve ose
          prodhuesve përkatës dhe shfaqen për qëllim informimi / krahasimi.
        </p>
      </LegalSection>
      <LegalSection title="8. Përgjegjësia">
        <p>
          Në masën që e lejon ligji i Kosovës, nuk përgjigjemi për
          dëme që rrjedhin nga mbështetja në një çmim të shfaqur, nga sjellja e
          një dyqani, ose nga ndërprerja e shërbimit. Asgjë në këto kushte nuk
          kufizon të drejtat e detyrueshme të konsumatorit ndaj shitësit të
          mallit, as përgjegjësinë për mashtrim ose për dëm që ligji nuk lejon
          të përjashtohet.
        </p>
      </LegalSection>
      <LegalSection title="9. Përkrahja vullnetare">
        <p>
          Pagesat përmes «Përkrah» janë dhurime vullnetare për mbajtjen e
          platformës, jo pagesë për një produkt. Përpunohen nga Whop sipas
          kushteve të tyre.
        </p>
      </LegalSection>
      <LegalSection title="10. Ligji i zbatueshëm">
        <p>
          Këto kushte rregullohen nga ligji i Kosovës. Për
          mosmarrëveshjet që lidhen me përdorimin e platformës (jo me blerjen
          te një dyqan), kompetent janë gjykatat e Kosovës, pa cenuar të
          drejtat e detyrueshme të konsumatorit.
        </p>
      </LegalSection>
      <LegalSection title="11. Të tjera">
        <p>
          Shihni edhe{" "}
          <Link href="/privatesia" className="font-semibold underline">
            Privatësinë
          </Link>{" "}
          dhe{" "}
          <Link href="/cookies" className="font-semibold underline">
            Cookies
          </Link>
          . Mund t’i ndryshojmë këto kushte; data e sipërme tregon versionin e
          fundit.
        </p>
      </LegalSection>
    </InfoPage>
  );
}
