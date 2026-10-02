'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Route } from 'lucide-react';
import { TOUR_STEPS } from '@/config/tour';
import type { TourTrack } from '@/config/tour-types';
import { useMediaQuery } from '@/lib/use-media-query';
import { GuidePanel } from './guide-panel';
import { Spotlight } from './spotlight';
import { tourCopy } from './tour-copy';
import {
  clampIndex,
  indexAfterTrackSwitch,
  INITIAL_STATE,
  isTrack,
  parseStoredState,
  sameUrl,
  stepDeltaForKey,
  stepsForTrack,
  stripTourParam,
  TOUR_STORAGE_KEY,
  trackFromSearch,
  type TourState,
} from './tour-logic';
import { TOUR_CSS } from './tour-styles';

/** The document's own lang and dir. There is no i18n provider at the root, so read them directly. */
function useDocumentAttribute(name: 'lang' | 'dir', fallback: string): string {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: [name],
      });
      return () => observer.disconnect();
    },
    () => document.documentElement.getAttribute(name) || fallback,
    () => fallback,
  );
}

/** True while focus is somewhere a bare key press should type or operate that control instead. */
function isOwnedByControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target.closest('input, textarea, select')) return true;
  return Boolean(
    target.closest(
      '[role="radiogroup"], [role="tablist"], [role="menu"], [role="listbox"], [role="slider"], [role="combobox"], [role="textbox"]',
    ),
  );
}

/** Space the newcomer bottom navigation takes, so the guide docks above it and never covers it. */
function measureBottomNav(): number {
  const nav = document.querySelector<HTMLElement>('nav.fixed.bottom-0');
  if (!nav || getComputedStyle(nav).display === 'none') return 0;
  const rect = nav.getBoundingClientRect();
  return Math.max(0, Math.round(window.innerHeight - rect.top));
}

function Guide() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const lang = useDocumentAttribute('lang', 'en');
  const dir = useDocumentAttribute('dir', 'ltr');
  const copy = tourCopy(lang);
  const rtl = dir === 'rtl';
  const phone = useMediaQuery('(max-width: 639px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<TourState>(INITIAL_STATE);
  const [bottomOffset, setBottomOffset] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const panelRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const focusTarget = useRef<'panel' | 'launcher' | null>(null);

  const steps = useMemo(() => stepsForTrack(TOUR_STEPS, state.track), [state.track]);
  const index = clampIndex(state.index, steps.length);
  const step = steps[index];
  const current = search ? `${pathname}?${search}` : pathname;
  const differs = Boolean(step) && !sameUrl(step.href, current);

  // Resume what this tab was doing.
  useEffect(() => {
    try {
      setState(parseStoredState(window.sessionStorage.getItem(TOUR_STORAGE_KEY)));
    } catch {
      /* storage can be blocked */
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.sessionStorage.setItem(
        TOUR_STORAGE_KEY,
        JSON.stringify({
          open: state.open,
          track: state.track,
          index,
          collapsed: state.collapsed,
        }),
      );
    } catch {
      /* storage can be blocked */
    }
  }, [mounted, state, index]);

  // ?tour=demo or ?tour=features starts a track from its first step, then drops the parameter
  // so a reload resumes instead of restarting.
  useEffect(() => {
    if (!mounted) return;
    const track = trackFromSearch(window.location.search);
    if (!track) return;
    focusTarget.current = 'panel';
    setState({ open: true, track, index: 0, collapsed: false });
    const url = `${window.location.pathname}${stripTourParam(window.location.search)}${window.location.hash}`;
    window.history.replaceState(null, '', url);
  }, [mounted, search]);

  // window.dispatchEvent(new CustomEvent('rasikh:tour', { detail: { track: 'demo' } }))
  useEffect(() => {
    const onTour = (event: Event) => {
      const detail = (event as CustomEvent<{ track?: unknown; index?: unknown } | undefined>)
        .detail;
      focusTarget.current = 'panel';
      setState((prev) => ({
        open: true,
        collapsed: false,
        track: isTrack(detail?.track) ? detail.track : prev.track,
        index: typeof detail?.index === 'number' ? Math.max(0, Math.trunc(detail.index)) : 0,
      }));
    };
    window.addEventListener('rasikh:tour', onTour);
    return () => window.removeEventListener('rasikh:tour', onTour);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      const target = steps[clampIndex(next, steps.length)];
      if (!target) return;
      setState((prev) => ({
        ...prev,
        open: true,
        index: clampIndex(next, steps.length),
      }));
      if (!sameUrl(target.href, `${window.location.pathname}${window.location.search}`)) {
        router.push(target.href);
      }
    },
    [router, steps],
  );

  const switchTrack = useCallback(
    (track: TourTrack) => {
      if (track === state.track) return;
      const nextSteps = stepsForTrack(TOUR_STEPS, track);
      const nextIndex = indexAfterTrackSwitch(steps, index, nextSteps);
      setState((prev) => ({ ...prev, track, index: nextIndex }));
      const target = nextSteps[nextIndex];
      if (target && !sameUrl(target.href, `${window.location.pathname}${window.location.search}`)) {
        router.push(target.href);
      }
    },
    [index, router, state.track, steps],
  );

  const openTour = useCallback(() => {
    focusTarget.current = 'panel';
    setState((prev) => ({ ...prev, open: true, collapsed: false }));
  }, []);

  const closeTour = useCallback((reset: boolean) => {
    focusTarget.current = 'launcher';
    setState((prev) => ({
      ...prev,
      open: false,
      index: reset ? 0 : prev.index,
    }));
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setState((prev) => ({ ...prev, collapsed }));
  }, []);

  // Keyboard: g toggles, arrows move (flipped in RTL), Escape collapses and then closes.
  const keys = useRef({
    goTo,
    closeTour,
    openTour,
    setCollapsed,
    index,
    rtl,
    state,
  });
  keys.current = { goTo, closeTour, openTour, setCollapsed, index, rtl, state };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      const k = keys.current;
      if (isOwnedByControl(event.target)) return;
      // Alt+G, not a bare letter: a single-character shortcut would clash with typing and
      // assistive technology (WCAG 2.1.4).
      if (event.altKey && event.code === 'KeyG') {
        if (event.repeat) return;
        if (k.state.open) k.closeTour(false);
        else k.openTour();
        event.preventDefault();
        return;
      }
      if (event.altKey) return;
      if (!k.state.open) return;
      const inPanel = panelRef.current?.contains(event.target as Node) ?? false;
      const onPage = event.target === document.body || event.target === document.documentElement;
      if (event.key === 'Escape') {
        if (!inPanel && !onPage) return;
        if (document.querySelector('dialog[open]')) return;
        if (k.state.collapsed) k.closeTour(false);
        else k.setCollapsed(true);
        event.preventDefault();
        return;
      }
      const delta = stepDeltaForKey(event.key, k.rtl);
      if (delta !== 0 && (inPanel || onPage)) {
        k.goTo(k.index + delta);
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Dock above the newcomer bottom navigation when it is on screen.
  useEffect(() => {
    if (!mounted) return;
    const update = () => setBottomOffset(measureBottomNav());
    update();
    const settle = window.setTimeout(update, 400);
    window.addEventListener('resize', update);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('resize', update);
    };
  }, [mounted, pathname, phone, state.open]);

  // Move focus when the guide opens or closes from the keyboard or launcher.
  useEffect(() => {
    if (!mounted || !focusTarget.current) return;
    const wanted = focusTarget.current;
    if (wanted === 'panel' && state.open) {
      focusTarget.current = null;
      panelRef.current?.focus({ preventScroll: true });
    } else if (wanted === 'launcher' && !state.open) {
      focusTarget.current = null;
      launcherRef.current?.focus({ preventScroll: true });
    }
  }, [mounted, state.open]);

  // Tell screen readers which step is now showing.
  const stepTitle = step?.title;
  useEffect(() => {
    if (!state.open || !stepTitle) {
      setAnnouncement('');
      return;
    }
    setAnnouncement(`${copy.stepOf(index + 1, steps.length)}: ${stepTitle}`);
  }, [state.open, stepTitle, index, steps.length, copy]);

  // The part of the screen the guide leaves free. On a phone the sheet owns the bottom; on a
  // desktop the card only matters when the target sits under it, so scroll the target above it.
  const getArea = useCallback(
    (target: Element) => {
      const top = 72;
      let bottom = window.innerHeight - bottomOffset;
      const panel = panelRef.current;
      if (panel) {
        const box = panel.getBoundingClientRect();
        if (phone) {
          bottom = Math.min(bottom, box.top);
        } else {
          const rect = target.getBoundingClientRect();
          if (rect.right > box.left && rect.left < box.right)
            bottom = Math.min(bottom, box.top - 8);
        }
      }
      return { top, bottom: Math.max(bottom, top + 120) };
    },
    [bottomOffset, phone],
  );

  if (!mounted) return null;

  return (
    <>
      <style>{TOUR_CSS}</style>
      {state.open && steps.length > 0 ? (
        <>
          <Spotlight
            selector={step?.target}
            stepKey={`${state.track}:${step?.id ?? ''}`}
            reducedMotion={reducedMotion}
            getArea={getArea}
          />
          <GuidePanel
            copy={copy}
            phone={phone}
            steps={steps}
            index={index}
            track={state.track}
            collapsed={state.collapsed}
            differs={differs}
            dockStart={false}
            bottomOffset={bottomOffset}
            panelRef={panelRef}
            onTrack={switchTrack}
            onGo={goTo}
            onCollapse={setCollapsed}
            onEnd={() => closeTour(true)}
          />
          <div aria-live="polite" aria-atomic className="sr-only">
            {announcement}
          </div>
        </>
      ) : (
        <button
          ref={launcherRef}
          type="button"
          onClick={openTour}
          aria-keyshortcuts="Alt+G"
          className="rasikh-tour-launcher rasikh-button fixed end-4 z-40 inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface ps-3 pe-3.5 text-body font-medium text-fg shadow-pop transition-colors hover:bg-hover max-sm:min-h-11"
          style={{ bottom: `calc(${bottomOffset}px + 1rem)` }}
        >
          <Route aria-hidden className="size-4 text-accent" />
          {copy.guide}
          <kbd
            aria-hidden
            className="rounded-sm bg-track px-1.5 font-mono text-caption text-fg-secondary max-sm:hidden"
          >
            Alt G
          </kbd>
        </button>
      )}
    </>
  );
}

/** The presenter's guided tour. Mounted once in the root layout; renders nothing until mounted. */
export function DemoGuide() {
  return (
    <Suspense fallback={null}>
      <Guide />
    </Suspense>
  );
}
