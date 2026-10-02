import type { ReactNode } from 'react';
import { NewcomerHeader } from './header';
import { BottomTabs, TopTabs } from './tabs';

/** Mobile-first frame: header, one centred column, bottom tabs on phones, top tabs on desktop. */
export function NewcomerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface text-fg">
      <NewcomerHeader />
      <TopTabs />
      <main id="main" className="mx-auto w-full max-w-xl px-4 pb-28 pt-4 md:pb-12">
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}
