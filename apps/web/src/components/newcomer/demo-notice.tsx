'use client';

import { FlaskConical } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';

const COPY = {
  en: {
    summary: 'Relocation demo · nothing leaves Rasikh',
    detail:
      'Applications and messages stay within the demo. Any live document extraction is labelled separately.',
  },
  ar: {
    summary: 'عرض تجريبي للاستقرار · لا يغادر شيء راسخ',
    detail: 'تبقى الطلبات والرسائل داخل العرض. يُميّز أي استخراج فعلي للمستندات بوضوح.',
  },
};

/** One line until tapped, so the notice does not push every phone screen down. */
export function DemoNotice() {
  const { locale } = useI18n();
  const copy = COPY[locale === 'ar' ? 'ar' : 'en'];
  return (
    <details className="group rounded-lg bg-track text-label text-fg-secondary">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 px-3 [&::-webkit-details-marker]:hidden">
        <FlaskConical aria-hidden className="size-4 shrink-0" />
        <span className="flex-1">{copy.summary}</span>
        <span
          aria-hidden
          className="transition-transform group-open:rotate-90 rtl:group-open:-rotate-90"
        >
          ›
        </span>
      </summary>
      <p className="px-3 pb-2.5 ps-9">{copy.detail}</p>
    </details>
  );
}
