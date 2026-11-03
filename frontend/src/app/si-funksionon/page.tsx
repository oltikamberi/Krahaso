import type { Metadata } from "next";
import { InfoPage, LegalSection } from "@/components/info-page";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Si funksionon — ${SITE_NAME}`,
  description: "Si krahasohen çmimet në Krahaso Çmimin dhe si të gjeni ofertën më të lirë.",
};

export default function HowItWorksPage() {
  return (
    <InfoPage
      title="Si funksionon"
      intro="Krahaso Çmimin tregon të njëjtin produkt nga disa dyqane online në Kosovë, që të shihni ku kushton më lirë para se të blini."
    >
      <LegalSection title="1. Kërkoni ose shfletoni">
        <p>
          Shkruani emrin e produktit në kërkim, ose hapni një kategori (telefona,
          laptopë, televizorë, gaming, pajisje shtëpiake). Lista tregon produktet
          që janë në stok te më shumë se një dyqan.
        </p>
      </LegalSection>
      <LegalSection title="2. Krahasoni çmimet">
        <p>
          Për çdo produkt shihni çmimin e çdo dyqani, kursimin ndaj çmimit më të
          lartë, dhe ofertën më të lirë. Ne nuk shesim produktin — ju ridrejtojmë
          te dyqani.
        </p>
      </LegalSection>
      <LegalSection title="3. Hapni dyqanin">
        <p>
          Kur shtypni «Shiko produktin» ose «Shko te dyqani», dilni nga Krahaso
          Çmimin dhe hyni në faqen e shitësit. Blerja, pagesa, dorëzimi dhe
          kthimi bëhen sipas kushteve të atij dyqani.
        </p>
      </LegalSection>
      <LegalSection title="Çfarë tregojmë">
        <p>
          Në katalogun publik shfaqen vetëm oferta në stok. Çmimet merren nga
          dyqanet (përmes listave që na dërgojnë ose burimeve që përdorim për
          krahasim) dhe mund të ndryshojnë pa njoftim. Verifikoni gjithmonë
          çmimin përfundimtar te shitësi para pagesës.
        </p>
      </LegalSection>
    </InfoPage>
  );
}
