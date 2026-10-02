'use client';

import type { ReactNode } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n/provider';
import { bankText } from './bank-data';

export function BankModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { locale } = useI18n();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={footer}
      closeLabel={bankText(locale, 'Close dialog', 'إغلاق النافذة')}
    >
      {children}
    </Dialog>
  );
}
