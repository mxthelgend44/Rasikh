'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/cn';
import { useStore } from '@/store/provider';
import { useNewcomer } from '@/store/person';
import {
  audienceEvents,
  audienceOf,
  foldEvents,
  isReset,
  pushToast,
  resetEvent,
  routeFor,
  type Audience,
  surfaceOf,
  ToastGate,
  type Surface,
  type ToastItem,
  type ToastTone,
} from './diff';

/** How long a toast stays when nobody is pointing at it or reading it. */
const AUTO_DISMISS_MS = 6000;

type Lang = 'en' | 'ar';

/** Interface words only. The text of an event is the app's own and stays as written. */
const COPY = {
  en: {
    region: 'Live updates',
    dismiss: 'Dismiss',
    view: 'View',
    reset: 'Demo reset',
    resetDetail: 'Back to the starting data',
    more: (count: number) => `${count} more updates`,
  },
  ar: {
    region: 'تحديثات مباشرة',
    dismiss: 'إغلاق',
    view: 'عرض',
    reset: 'إعادة ضبط العرض',
    resetDetail: 'عادت البيانات إلى وضعها الأولي',
    more: (count: number) => (count > 10 ? `${count} تحديثاً آخر` : `${count} تحديثات أخرى`),
  },
} as const;

const DOT: Record<ToastTone, string> = {
  success: 'bg-success-solid',
  warning: 'bg-[rgb(var(--brand-saffron))]',
  danger: 'bg-danger-solid',
  info: 'bg-accent',
};

function subscribeToLang(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang'],
  });
  return () => observer.disconnect();
}

function useDocumentLang(): Lang {
  return useSyncExternalStore(
    subscribeToLang,
    () => (document.documentElement.lang === 'ar' ? 'ar' : 'en'),
    () => 'en',
  );
}

/**
 * Says out loud what other windows just changed. It diffs each new snapshot against the last one
 * it saw, so the state a page loads with never produces a toast, only what arrives afterwards.
 */
export function LiveToasts() {
  const store = useStore();
  const pathname = usePathname() ?? '';
  const { hire } = useNewcomer();
  const lang = useDocumentLang();
  const copy = COPY[lang];
  const surface = surfaceOf(pathname);
  const audience = audienceOf(pathname);

  const [items, setItems] = useState<ToastItem[]>([]);
  const [gate] = useState(() => new ToastGate());
  const counter = useRef(0);
  const context = useRef<{
    audience: Audience;
    viewed: string | undefined;
  }>({
    audience,
    viewed: hire?.id,
  });

  useEffect(() => {
    context.current = { audience, viewed: hire?.id };
  }, [audience, hire?.id]);

  useEffect(() => {
    let previous = store.getSnapshot();
    return store.subscribe(() => {
      const next = store.getSnapshot();
      if (next === previous) return;
      const before = previous;
      previous = next;
      const nowMs = Date.now();
      const nextId = () => `toast-${(counter.current += 1)}`;

      if (isReset(before, next)) {
        gate.clear();
        const event = resetEvent(next);
        gate.accept(event, nowMs);
        setItems([{ id: nextId(), event }]);
        return;
      }

      const { audience: who, viewed } = context.current;
      const fresh = audienceEvents(before.state, next.state, who, viewed).filter((event) =>
        gate.accept(event, nowMs),
      );
      if (!fresh.length) return;
      setItems((list) =>
        foldEvents(fresh).reduce((acc, event) => pushToast(acc, { id: nextId(), event }), list),
      );
    });
  }, [store, gate]);

  const dismiss = useCallback(
    (id: string) => setItems((list) => list.filter((item) => item.id !== id)),
    [],
  );

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      aria-label={copy.region}
      className={cn(
        'pointer-events-none fixed start-4 z-40 flex flex-col items-start gap-2',
        'w-[min(22rem,calc(100vw-2rem))] max-sm:w-[calc(100vw-8rem)]',
        surface === 'newcomer'
          ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4'
          : 'bottom-4',
      )}
    >
      {items.map((item) => (
        <ToastCard
          key={item.id}
          item={item}
          lang={lang}
          href={routeFor(item.event, surface)}
          currentPath={pathname}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}

function ToastCard({
  item,
  lang,
  href,
  currentPath,
  onDismiss,
}: {
  item: ToastItem;
  lang: Lang;
  href: string | undefined;
  currentPath: string;
  onDismiss: (id: string) => void;
}) {
  const copy = COPY[lang];
  const { event } = item;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const remaining = useRef(AUTO_DISMISS_MS);

  // Hover or keyboard focus stops the clock; leaving resumes with what was left.
  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => onDismiss(item.id), Math.max(remaining.current, 0));
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [paused, item.id, onDismiss]);

  const showLink = Boolean(href) && href !== currentPath;
  const title =
    event.kind === 'reset'
      ? copy.reset
      : event.kind === 'overflow'
        ? copy.more(event.count ?? 0)
        : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(blurEvent) => {
        if (!blurEvent.currentTarget.contains(blurEvent.relatedTarget)) setFocused(false);
      }}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === 'Escape') onDismiss(item.id);
      }}
      className="rasikh-toast pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-edge bg-raised py-2.5 ps-3 pe-1.5 text-body text-fg shadow-pop"
    >
      <span
        aria-hidden
        className={cn('mt-[0.4375rem] size-2 shrink-0 rounded-full', DOT[event.tone])}
      />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="font-medium">
            {title}
            {event.kind === 'reset' ? (
              <span className="block font-normal text-fg-tertiary">{copy.resetDetail}</span>
            ) : null}
          </p>
        ) : (
          <p dir="auto" className="line-clamp-3 break-words max-md:line-clamp-2">
            {event.who ? (
              <>
                <bdi className="font-medium">{event.who}</bdi>
                <span aria-hidden className="px-1 text-fg-tertiary">
                  ·
                </span>
                <span className="sr-only">: </span>
              </>
            ) : null}
            <bdi className="text-fg-secondary">{event.text}</bdi>
          </p>
        )}
        {showLink && href ? (
          <Link
            href={href}
            onClick={() => onDismiss(item.id)}
            className="-mb-1 mt-0.5 inline-flex min-h-7 items-center rounded-sm text-label font-medium text-accent hover:underline max-md:-mb-3.5 max-md:-mt-1 max-md:min-h-11"
          >
            {copy.view}
          </Link>
        ) : null}
      </div>
      <button
        type="button"
        aria-label={copy.dismiss}
        onClick={() => onDismiss(item.id)}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-fg-tertiary transition-colors hover:bg-hover hover:text-fg max-md:size-11 max-md:-my-2.5"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </div>
  );
}
