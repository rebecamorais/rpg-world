/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { getApi } from '@api';

import HeroCTA from '@frontend/components/layout/HeroCTA';
import { SheetPreview } from '@frontend/components/layout/SheetPreview';

// Structured data so search engines and AI assistants know what the app is
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'RPG World',
  url: 'https://rpgworldapp.com',
  applicationCategory: 'GameApplication',
  operatingSystem: 'Web',
  description:
    'Free, open-source app to create and manage D&D 5e character sheets, in English and Brazilian Portuguese.',
  inLanguage: ['en', 'pt-BR'],
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  license: 'https://www.gnu.org/licenses/gpl-3.0.html',
  codeRepository: 'https://github.com/rebecamorais/rpg-world',
  author: { '@type': 'Person', name: 'Rebeca Morais' },
};

export default async function Home() {
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  return (
    <div className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        // Static object defined above; escape '<' so it can never close the script tag
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c'),
        }}
      />
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center transition-all duration-700 md:p-16">
        <HeroCTA isAuthenticated={!!user} />
        <SheetPreview />
      </div>
    </div>
  );
}
