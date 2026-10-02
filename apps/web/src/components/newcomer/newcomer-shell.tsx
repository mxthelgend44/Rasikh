import type { ReactNode } from 'react';
import { NewcomerHeader } from './header';
import { BottomTabs, TopTabs } from './tabs';
import { DemoNotice } from './demo-notice';

/** Mobile-first frame: header, one centred column, bottom tabs on phones, top tabs on desktop. */
export function NewcomerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface text-fg">
      <NewcomerHeader />
      <TopTabs />
      <main id="main" className="mx-auto w-full max-w-xl px-4 pb-28 pt-4 md:pb-12">
        <div className="mb-5">
          <DemoNotice />
        </div>
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}
