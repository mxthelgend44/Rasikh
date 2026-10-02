'use client';

import { Check, EyeOff, LockKeyhole } from 'lucide-react';
import { DATA_LABELS, type DataLabel } from '@rasikh/shared';
import { policyFor } from '@/domain/policy';
import { useI18n } from '@/lib/i18n/provider';
import { bankText, dataLabel } from './bank-data';

type Group = 'allow' | 'consent' | 'deny';

/** Group every data label by the bank column of the product policy. Guard stays the authority. */
function groupLabels() {
  const groups: Record<Group, DataLabel[]> = {
    allow: [],
    consent: [],
    deny: [],
  };
  for (const label of DATA_LABELS) {
    const policy = policyFor(label, 'bank');
    groups[policy === 'allow' ? 'allow' : policy === 'consent' ? 'consent' : 'deny'].push(label);
  }
  return groups;
}

/**
 * What a bank officer may and may not see, at a glance. It reads the same policy matrix as the
 * newcomer's trust passport, so the three groups can never drift from the real rules.
 */
export function BankScopePanel() {
  const { locale } = useI18n();
  const text = (en: string, ar: string) => bankText(locale, en, ar);
  const groups = groupLabels();
  const rows: {
    key: Group;
    icon: typeof Check;
    tile: string;
    title: string;
    hint: string;
  }[] = [
    {
      key: 'allow',
      icon: Check,
      tile: 'bg-success-soft text-success',
      title: text('Shared by policy', 'تسمح بها السياسة'),
      hint: text('Employment may be shared.', 'يمكن مشاركة بيانات التوظيف.'),
    },
    {
      key: 'consent',
      icon: LockKeyhole,
      tile: 'bg-warning-soft text-warning',
      title: text('Needs the newcomer’s permission', 'تحتاج إلى إذن الوافد'),
      hint: text(
        'An active bank permission and an application disclosure are both required.',
        'يلزم إذن بنكي ساري وإفصاح في الطلب معاً.',
      ),
    },
    {
      key: 'deny',
      icon: EyeOff,
      tile: 'bg-track text-fg-secondary',
      title: text('Outside this workspace', 'خارج هذه المساحة'),
      hint: text('Never shown to a bank officer.', 'لا تظهر لموظف البنك.'),
    },
  ];
  return (
    <section className="rounded-lg border border-line p-5" aria-labelledby="bank-scope-title">
      <h2 id="bank-scope-title" className="text-title font-medium">
        {text('What the bank can see', 'ما يمكن للبنك الاطلاع عليه')}
      </h2>
      <ul className="mt-4 space-y-4">
        {rows.map((row) => (
          <li key={row.key} className="flex items-start gap-3">
            <span
              aria-hidden
              className={`flex size-8 shrink-0 items-center justify-center rounded-md ${row.tile}`}
            >
              <row.icon className="size-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-body font-medium">{row.title}</h3>
              <p className="mt-0.5 text-label leading-5 text-fg-secondary">{row.hint}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {groups[row.key].map((label) => (
                  <li
                    key={label}
                    className="rounded-full border border-line bg-subtle px-2.5 py-0.5 text-label text-fg-secondary"
                  >
                    {dataLabel(label, locale)}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-line pt-3 text-caption text-fg-tertiary">
        {text(
          'Demo review workflow. Guard remains the authority for outbound sharing; live Guard and production prompt parity are unverified.',
          'مسار مراجعة تجريبي. يبقى Guard مرجع مشاركة البيانات خارجياً؛ لم يُتحقق من Guard المباشر أو تطابق تعليمات الإنتاج.',
        )}
      </p>
    </section>
  );
}
