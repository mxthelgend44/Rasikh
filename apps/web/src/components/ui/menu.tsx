'use client';

import {
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';

export interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  selected?: boolean;
  disabled?: boolean;
}

type TriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  'data-open': boolean;
};

export interface MenuProps {
  /** Accessible name of the menu. */
  label: string;
  items: MenuItem[];
  trigger: (props: TriggerProps) => ReactNode;
  align?: 'start' | 'end';
}

export function Menu({ label, items, trigger, align = 'start' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const region = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) region.current?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
  };
  useDismiss(open, region, () => close(true));

  const enabled = () =>
    Array.from(
      list.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [],
    );

  const focusItem = (index: number) => {
    const nodes = enabled();
    nodes[(index + nodes.length) % nodes.length]?.focus();
  };

  const openAndFocus = (index: number) => {
    setOpen(true);
    requestAnimationFrame(() => focusItem(index));
  };

  const onTriggerKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') openAndFocus(0);
    else if (event.key === 'ArrowUp') openAndFocus(-1);
    else return;
    event.preventDefault();
  };

  const onListKey = (event: KeyboardEvent) => {
    const nodes = enabled();
    const current = nodes.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown') focusItem(current + 1);
    else if (event.key === 'ArrowUp') focusItem(current - 1);
    else if (event.key === 'Home') focusItem(0);
    else if (event.key === 'End') focusItem(-1);
    else if (event.key === 'Tab') return close(false);
    else return;
    event.preventDefault();
  };

  return (
    <div ref={region} className="relative">
      {trigger({
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        'data-open': open,
        onClick: () => setOpen((value) => !value),
        onKeyDown: onTriggerKey,
      })}
      {open ? (
        <div
          ref={list}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onListKey}
          className={cn(
            'absolute top-full z-30 mt-1 min-w-48 rounded-lg bg-raised p-1 shadow-pop motion-safe:animate-pop-in',
            align === 'end' ? 'end-0' : 'start-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect();
                close(true);
              }}
              className="rasikh-menu-item flex h-8 w-full items-center gap-2 rounded-md px-2 text-start text-body text-fg transition-colors hover:bg-hover focus-visible:bg-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus disabled:opacity-40"
            >
              <span className="flex-1 truncate">{item.label}</span>
              {item.selected ? <Check aria-hidden className="size-4 text-fg-secondary" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
