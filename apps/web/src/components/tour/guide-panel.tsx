'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  ListChecks,
  Mic,
  MousePointerClick,
  Route,
} from 'lucide-react';
import type { TourStep, TourTrack } from '@/config/tour-types';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { cn } from '@/lib/cn';
import type { TourCopy } from './tour-copy';
import { DEMO_BUDGET_SECONDS, elapsedSeconds, formatClock, totalSeconds } from './tour-logic';

export interface GuidePanelProps {
  copy: TourCopy;
  phone: boolean;
  steps: TourStep[];
  index: number;
  track: TourTrack;
  collapsed: boolean;
  /** The current page is not the page this step happens on. */
  differs: boolean;
  /** Dock on the inline-start side so the spotlight target stays visible. */
  dockStart: boolean;
  /** Pixels reserved at the bottom of the viewport (the newcomer bottom navigation). */
  bottomOffset: number;
  panelRef: RefObject<HTMLElement | null>;
  onTrack: (track: TourTrack) => void;
  onGo: (index: number) => void;
  onCollapse: (collapsed: boolean) => void;
  onEnd: () => void;
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="mb-2 flex items-center gap-1.5 text-label font-medium text-fg-tertiary">
      <span aria-hidden className="text-accent">
        {icon}
      </span>
      {children}
    </h3>
  );
}

const linkButton =
  'rasikh-button inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-body font-medium text-fg transition-colors hover:bg-hover max-sm:min-h-11';

export function GuidePanel({
  copy,
  phone,
  steps,
  index,
  track,
  collapsed,
  differs,
  dockStart,
  bottomOffset,
  panelRef,
  onTrack,
  onGo,
  onCollapse,
  onEnd,
}: GuidePanelProps) {
  const step = steps[index];
  const [listOpen, setListOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step?.id, track]);

  useEffect(() => {
    if (listOpen) activeRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [listOpen, index]);

  const total = totalSeconds(steps);
  const elapsed = elapsedSeconds(steps, index);
  const budget = track === 'demo' ? DEMO_BUDGET_SECONDS : total;
  const over = track === 'demo' && elapsed > DEMO_BUDGET_SECONDS;
  const first = index === 0;
  const last = index === steps.length - 1;
  const trackName = track === 'demo' ? copy.demoStory : copy.fullTour;

  const placement: CSSProperties = phone
    ? {
        bottom: bottomOffset,
        maxHeight: `min(30rem, 58dvh)`,
        paddingBottom: bottomOffset > 0 ? undefined : 'env(safe-area-inset-bottom)',
      }
    : {
        bottom: `calc(${bottomOffset}px + 1rem)`,
        maxHeight: `min(40rem, calc(100dvh - ${bottomOffset}px - 2rem))`,
      };

  const frame = cn(
    'rasikh-tour-panel fixed z-40 flex flex-col border border-edge bg-surface text-fg shadow-pop focus:outline-none',
    phone
      ? 'inset-x-0 rounded-t-xl border-b-0'
      : cn('w-[24rem] max-w-[calc(100vw-2rem)] rounded-lg', dockStart ? 'start-4' : 'end-4'),
  );

  const back = (
    <Button
      variant="secondary"
      size="lg"
      iconOnly={collapsed}
      onClick={() => onGo(index - 1)}
      disabled={first}
      aria-label={collapsed ? copy.back : undefined}
      icon={<ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />}
    >
      {collapsed ? null : copy.back}
    </Button>
  );

  const next = (
    <Button
      variant="primary"
      size="lg"
      iconOnly={collapsed}
      onClick={last ? onEnd : () => onGo(index + 1)}
      aria-label={collapsed ? (last ? copy.finish : copy.next) : undefined}
      icon={
        collapsed ? (
          last ? (
            <Check aria-hidden />
          ) : (
            <ArrowRight aria-hidden className="rtl:-scale-x-100" />
          )
        ) : undefined
      }
    >
      {last ? (
        copy.finish
      ) : (
        <>
          {copy.next}
          <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
        </>
      )}
    </Button>
  );

  const progress = (
    <div
      role="progressbar"
      aria-label={copy.progress}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={index + 1}
      aria-valuetext={copy.stepOf(index + 1, steps.length)}
      className="rasikh-tour-progress flex gap-1"
    >
      {steps.map((item, i) => (
        <span
          key={item.id}
          className={cn('h-1 min-w-0 flex-1 rounded-full', i <= index ? 'bg-accent' : 'bg-track')}
        />
      ))}
    </div>
  );

  if (collapsed) {
    return (
      <section
        ref={panelRef}
        role="region"
        aria-label={copy.presenterGuide}
        tabIndex={-1}
        className={frame}
        style={placement}
      >
        <div className="px-2.5 pt-2.5">{progress}</div>
        <div className="flex items-center gap-1.5 p-2">
          <button
            type="button"
            onClick={() => onCollapse(false)}
            aria-expanded={false}
            aria-label={`${copy.expand}: ${step?.title ?? ''}`}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 text-start transition-colors hover:bg-hover"
          >
            <Route aria-hidden className="size-4 shrink-0 text-accent" />
            <span className="min-w-0 flex-1">
              <span dir="auto" className="block truncate text-label font-medium text-fg">
                {step?.title}
              </span>
              <span className="block text-caption text-fg-tertiary">
                {copy.stepOf(index + 1, steps.length)}
              </span>
            </span>
            <ChevronUp aria-hidden className="size-4 shrink-0 text-fg-tertiary" />
          </button>
          {back}
          {next}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={panelRef}
      role="region"
      aria-label={copy.presenterGuide}
      tabIndex={-1}
      className={frame}
      style={placement}
    >
      <header className="flex items-center gap-2 px-3 pb-3 pt-3 sm:px-4">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent"
        >
          <Route className="size-4" />
        </span>
        <Segmented<TourTrack>
          label={copy.trackLabel}
          value={track}
          onChange={onTrack}
          className="h-10 min-w-0 flex-1 [&>button]:min-w-0 [&>button]:flex-1 [&>button]:px-2 [&>button]:text-label"
          options={[
            { value: 'demo', label: copy.demoStory },
            { value: 'features', label: copy.fullTour },
          ]}
        />
        <Button
          variant="ghost"
          size="lg"
          iconOnly
          onClick={() => onCollapse(true)}
          aria-label={copy.collapse}
          aria-expanded
          icon={<ChevronDown aria-hidden className="size-4" />}
        />
      </header>

      <div className="space-y-2 border-t border-line px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-label font-medium text-accent">
            {copy.stepOf(index + 1, steps.length)}
          </p>
          <p className="flex items-baseline gap-1.5 text-caption tabular-nums text-fg-tertiary">
            <span className="text-fg-secondary">{copy.seconds(step?.seconds ?? 0)}</span>
            <span aria-hidden>·</span>
            <bdi dir="ltr" className={cn(over && 'font-medium text-warning')}>
              {formatClock(elapsed)} / {formatClock(budget)}
            </bdi>
            <span className="sr-only">
              {copy.runningTotal}
              {over ? `. ${copy.overBudget}` : ''}
            </span>
          </p>
        </div>
        {progress}
        <p className="sr-only">{trackName}</p>
      </div>

      <div
        ref={bodyRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-line px-4 py-4"
      >
        {step ? (
          <div key={`${track}:${step.id}`} className="rasikh-tour-step space-y-4">
            <div>
              <h2 dir="auto" className="text-title font-medium text-fg">
                {step.title}
              </h2>
              <p dir="auto" className="mt-1 text-body text-fg-secondary">
                {step.summary}
              </p>
            </div>

            {differs ? (
              <div className="flex flex-wrap gap-2">
                <Link href={step.href} className={cn(linkButton, 'flex-1')}>
                  <ArrowUpRight aria-hidden className="size-4 rtl:-scale-x-100" />
                  {copy.openThisView}
                </Link>
                <a href={step.href} target="_blank" rel="noopener" className={linkButton}>
                  <ExternalLink aria-hidden className="size-4" />
                  {copy.newWindow}
                </a>
              </div>
            ) : null}

            {step.say.length > 0 ? (
              <section>
                <SectionLabel icon={<Mic className="size-3.5" />}>{copy.say}</SectionLabel>
                <ul className="space-y-1.5">
                  {step.say.map((line) => (
                    <li
                      key={line}
                      dir="auto"
                      className="border-s-2 border-line-strong ps-3 text-body text-fg"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {step.show.length > 0 ? (
              <section>
                <SectionLabel icon={<MousePointerClick className="size-3.5" />}>
                  {copy.show}
                </SectionLabel>
                <ol className="space-y-2">
                  {step.show.map((line, i) => (
                    <li key={line} dir="auto" className="flex gap-2.5 text-body text-fg">
                      <span
                        aria-hidden
                        className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-track text-caption font-medium tabular-nums text-fg-secondary"
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0">{line}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {step.features.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5" aria-label={copy.featuresLabel}>
                {step.features.map((feature) => (
                  <li
                    key={feature}
                    dir="auto"
                    className="rounded-sm bg-accent-soft px-2 py-0.5 text-caption font-medium text-accent"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            ) : null}

            {step.honesty ? (
              <aside className="rounded-md border-s-4 border-[rgb(var(--brand-saffron))] bg-[rgb(var(--brand-saffron)/0.16)] px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-label font-medium text-warning">
                  <Info aria-hidden className="size-4 shrink-0" />
                  {copy.beStraight}
                </p>
                <p dir="auto" className="mt-1 text-body text-fg">
                  {step.honesty}
                </p>
              </aside>
            ) : null}
          </div>
        ) : (
          <p className="text-body text-fg-secondary">{copy.noSteps}</p>
        )}

        <div className="mt-4 border-t border-line pt-2">
          <button
            type="button"
            onClick={() => setListOpen((open) => !open)}
            aria-expanded={listOpen}
            aria-controls="rasikh-tour-steps"
            className="flex min-h-10 w-full items-center gap-2 rounded-md px-1 text-start text-label font-medium text-fg-secondary transition-colors hover:text-fg max-sm:min-h-11"
          >
            <ListChecks aria-hidden className="size-4 text-accent" />
            <span className="flex-1">{copy.allSteps}</span>
            <ChevronDown
              aria-hidden
              className={cn(
                'size-4 text-fg-tertiary transition-transform',
                listOpen && 'rotate-180',
              )}
            />
          </button>
          {listOpen ? (
            <ol id="rasikh-tour-steps" className="mt-1 max-h-56 space-y-0.5 overflow-y-auto">
              {steps.map((item, i) => {
                const active = i === index;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      ref={active ? activeRowRef : undefined}
                      onClick={() => onGo(i)}
                      aria-current={active ? 'step' : undefined}
                      className={cn(
                        'flex min-h-10 w-full items-center gap-2.5 rounded-md px-2 text-start text-body transition-colors max-sm:min-h-11',
                        active
                          ? 'bg-selected font-medium text-fg'
                          : 'text-fg-secondary hover:bg-hover',
                      )}
                    >
                      <span className="w-5 shrink-0 text-caption tabular-nums text-fg-tertiary">
                        {i + 1}
                      </span>
                      <span dir="auto" className="min-w-0 flex-1 truncate">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-caption tabular-nums text-fg-tertiary">
                        {copy.seconds(item.seconds)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      </div>

      <footer className="flex items-center gap-2 border-t border-line px-4 py-3">
        <Button variant="ghost" size="lg" onClick={onEnd} className="me-auto text-fg-secondary">
          {copy.endTour}
        </Button>
        {back}
        {next}
      </footer>
    </section>
  );
}
