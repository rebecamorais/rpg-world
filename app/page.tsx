/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { getApi } from '@api';

import HeroCTA from '@frontend/components/layout/HeroCTA';
import { SheetPreview } from '@frontend/components/layout/SheetPreview';

export default async function Home() {
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center transition-all duration-700 md:p-16">
        <HeroCTA isAuthenticated={!!user} />
        <SheetPreview />
      </div>
    </div>
  );
}
