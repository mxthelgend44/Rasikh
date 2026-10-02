'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SYNC_CHANNEL, type SyncMessage } from './deck';
import { PITCH_NOTES, type PitchNote } from './presenter-notes';
import { rasikhSlides } from './slides';

const TOTAL = rasikhSlides.length;

function noteAt(index: number): PitchNote {
  return PITCH_NOTES[index] ?? { index, label: 'Slide', seconds: 0, say: [] };
}

function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * The presenter window (opened with ?presenter=1). Never mounted inside the audience deck, so
 * the script has no path into a shared screen. Arrows move both windows; R resets the clock,
 * which starts on the first move rather than when the window opens.
 */
export function PresenterView() {
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [slideStartedAt, setSlideStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const indexRef = useRef(0);

  const mark = useCallback(() => {
    const stamp = Date.now();
    setStartedAt((value) => value ?? stamp);
    setSlideStartedAt(stamp);
  }, []);

  const applyRemote = useCallback(
    (next: number, isMove: boolean) => {
      if (next < 0 || next >= TOTAL || next === indexRef.current) return;
      indexRef.current = next;
      setIndex(next);
      if (isMove) mark();
    },
    [mark],
  );

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= TOTAL || next === indexRef.current) return;
      indexRef.current = next;
      setIndex(next);
      mark();
      channelRef.current?.postMessage({ type: 'goto', index: next } satisfies SyncMessage);
    },
    [mark],
  );

  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel(SYNC_CHANNEL);
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      if (event.data?.type === 'slide') applyRemote(event.data.index, true);
      else if (event.data?.type === 'sync') applyRemote(event.data.index, false);
    };
    channel.postMessage({ type: 'hello' } satisfies SyncMessage);
    return () => channel.close();
  }, [applyRemote]);

  const reset = useCallback(() => {
    setStartedAt(null);
    setSlideStartedAt(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const actions: Record<string, () => void> = {
        ArrowRight: () => goTo(indexRef.current + 1),
        ArrowDown: () => goTo(indexRef.current + 1),
        ' ': () => goTo(indexRef.current + 1),
        ArrowLeft: () => goTo(indexRef.current - 1),
        ArrowUp: () => goTo(indexRef.current - 1),
        Home: () => goTo(0),
        End: () => goTo(TOTAL - 1),
        r: reset,
        R: reset,
      };
      const action = actions[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, reset]);

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startedAt]);

  const note = noteAt(index);
  const upcoming = index + 1 < TOTAL ? noteAt(index + 1) : null;
  const budget = useMemo(() => PITCH_NOTES.reduce((sum, n) => sum + n.seconds, 0), []);
  const elapsed = startedAt === null ? 0 : now - startedAt;
  const onSlide = slideStartedAt === null ? 0 : now - slideStartedAt;

  return (
    <div className="pv">
      <header className="pv-head">
        <span className="pv-micro">Presenter</span>
        <h1>{note.label}</h1>
        <span className="pv-count">
          {String(index + 1).padStart(2, '0')} of {String(TOTAL).padStart(2, '0')}
        </span>
      </header>
      <div className="pv-body">
        <div>
          <ol className="pv-say">
            {note.say.map((beat, i) => (
              <li key={i}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {beat}
              </li>
            ))}
          </ol>
          {note.cue && (
            <div className="pv-cue">
              <p className="pv-micro">Cue</p>
              <p>{note.cue}</p>
            </div>
          )}
        </div>
        <aside className="pv-rail">
          <p className="pv-micro">Elapsed</p>
          <p className={`pv-clock ${budget && elapsed > budget * 1000 ? 'is-over' : ''}`}>
            {clock(elapsed)}
          </p>
          <p className="pv-sub">of {clock(budget * 1000)} planned</p>
          <p className="pv-micro">This slide</p>
          <p
            className={`pv-slide-clock ${note.seconds && onSlide > note.seconds * 1000 ? 'is-over' : ''}`}
          >
            {clock(onSlide)} <span>of {clock(note.seconds * 1000)}</span>
          </p>
          <p className="pv-micro is-next">Next up</p>
          <p className="pv-next">{upcoming ? upcoming.label : 'End of deck.'}</p>
          {upcoming && <p className="pv-sub">{upcoming.say[0]}</p>}
        </aside>
      </div>
      <footer className="pv-foot">
        <button onClick={() => goTo(index - 1)} disabled={index === 0}>
          ← Prev
        </button>
        <button onClick={() => goTo(index + 1)} disabled={index === TOTAL - 1}>
          Next →
        </button>
        <span>Arrows move both windows</span>
        <button onClick={reset}>Reset clock</button>
      </footer>
    </div>
  );
}
