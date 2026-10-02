import type { Locale } from '@/domain/types';

/**
 * Strings that belong to the shell only. They live beside the shell instead of in the shared
 * catalogs, so the shell can change without touching them.
 */
export interface ShellCopy {
  /** Link back to the demo hub. */
  hub: string;
  /** Longer accessible description of the hub link. */
  hubHint: string;
}

export const SHELL_COPY: Record<Locale, ShellCopy> = {
  en: {
    hub: 'Demo hub',
    hubHint: 'Back to the demo hub',
  },
  ar: {
    hub: 'مركز العرض التجريبي',
    hubHint: 'العودة إلى مركز العرض التجريبي',
  },
};
