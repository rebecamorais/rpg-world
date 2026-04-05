/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import HeroCTA from '@frontend/components/layout/HeroCTA';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <HeroCTA />
      </main>
    </div>
  );
}
