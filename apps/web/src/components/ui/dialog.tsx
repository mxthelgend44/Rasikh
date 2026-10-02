'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import './overlay-motion.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  presentation?: 'dialog' | 'drawer';
  /** Edge a drawer is anchored to. Defaults to the inline-end edge. */
  side?: 'start' | 'end';
}

const WIDTHS = { sm: 'w-[24rem]', md: 'w-[36rem]', lg: 'w-[48rem]' };

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeLabel = 'Close',
  size = 'md',
  className,
  presentation = 'dialog',
  side = 'end',
}: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const node = dialog.current;
    if (!node || !open) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node.showModal();
    return () => {
      node.close();
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      data-presentation={presentation}
      data-side={presentation === 'drawer' ? side : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
      className={cn(
        'rasikh-dialog max-w-[calc(100%-2rem)] overflow-y-auto rounded-lg border border-line p-0 shadow-dialog',
        WIDTHS[size],
        presentation === 'drawer' && 'max-w-full',
        className,
      )}
    >
      <div className={cn('flex flex-col', presentation === 'drawer' && 'min-h-full')}>
        <header className="flex items-start gap-4 border-b border-line p-4 sm:p-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="break-words text-title font-medium">
              {title}
            </h2>
            {description ? (
              <div id={descriptionId} className="mt-1 text-body text-fg-tertiary">
                {description}
              </div>
            ) : null}
          </div>
          <Button variant="ghost" iconOnly icon={<X />} aria-label={closeLabel} onClick={onClose} />
        </header>
        <div className="flex-1 p-4 sm:p-6">{children}</div>
        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line p-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
