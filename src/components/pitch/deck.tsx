'use client';

import { motion } from 'framer-motion';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize,
  Minimize,
  PanelsTopLeft,
} from 'lucide-react';
import { PITCH_NOTES } from './presenter-notes';
import { Mark } from './primitives';
import { rasikhSlides as slides } from './slides';

const TOTAL = slides.length;

/** Deck and notes window talk over this channel; it survives either window reloading. */
export const SYNC_CHANNEL = 'rasikh-deck-sync';

export type SyncMessage =
  | { type: 'slide'; index: number }
  | { type: 'sync'; index: number }
  | { type: 'goto'; index: number }
  | { type: 'hello' };

/** A short travel rather than a full width, since the outgoing slide is gone immediately. */
const slideVariants = {
  enter: (direction: number) => ({ x: direction >= 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
};
const slideTransition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

const exportSizes = [
  { label: 'Current window', width: 0, height: 0 },
  { label: '1920 × 1080 (Full HD)', width: 1920, height: 1080 },
  { label: '2560 × 1440 (2K)', width: 2560, height: 1440 },
];
const EXPORT_WAIT_MS = 3600;

/** The audience deck: keyboard, swipe, draggable progress, fullscreen, notes sync and PDF export. */
export function Deck() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [navHovered, setNavHovered] = useState(false);
  const [navLocked, setNavLocked] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMenu, setExportMenu] = useState(false);
  const [presenterBlocked, setPresenterBlocked] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const animating = useRef(false);
  const dragging = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const currentRef = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      if (animating.current || index < 0 || index >= TOTAL) return;
      animating.current = true;
      setDirection(index > current ? 1 : -1);
      currentRef.current = index;
      setCurrent(index);
      // Broadcast here, at the local move, so a move that arrived from the notes window is
      // never echoed back (an effect could run on a stale render and send an older index).
      channelRef.current?.postMessage({ type: 'slide', index } satisfies SyncMessage);
      setTimeout(() => {
        animating.current = false;
      }, 650);
    },
    [current],
  );
  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  /** A move that already happened in the notes window is applied unconditionally. */
  const applyRemote = useCallback((index: number) => {
    if (index < 0 || index >= TOTAL || index === currentRef.current) return;
    animating.current = false;
    setDirection(index > currentRef.current ? 1 : -1);
    currentRef.current = index;
    setCurrent(index);
  }, []);

  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel(SYNC_CHANNEL);
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      if (event.data?.type === 'goto') applyRemote(event.data.index);
      else if (event.data?.type === 'hello')
        channel.postMessage({ type: 'sync', index: currentRef.current });
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [applyRemote]);

  const openPresenter = useCallback(() => {
    const win = window.open('/pitch?presenter=1', 'rasikh-presenter', 'width=1180,height=800');
    setPresenterBlocked(!win);
    win?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
      )
        return;
      if ((e.key === 'Enter' || e.key === ' ') && target?.closest('a, button')) return;
      if ((e.key === 'p' || e.key === 'P') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openPresenter();
        return;
      }
      const actions: Record<string, () => void> = {
        ArrowRight: next,
        ArrowDown: next,
        ' ': next,
        Enter: next,
        ArrowLeft: prev,
        ArrowUp: prev,
        Home: () => goTo(0),
        End: () => goTo(TOTAL - 1),
      };
      const action = actions[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, goTo, openPresenter]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const start = (e: TouchEvent) => {
      touchStartX.current = e.touches[0]?.clientX ?? null;
    };
    const end = (e: TouchEvent) => {
      const startX = touchStartX.current;
      const endX = e.changedTouches[0]?.clientX;
      if (startX === null || endX === undefined) return;
      const delta = startX - endX;
      if (delta > 50) next();
      else if (delta < -50) prev();
      touchStartX.current = null;
    };
    node.addEventListener('touchstart', start, { passive: true });
    node.addEventListener('touchend', end, { passive: true });
    return () => {
      node.removeEventListener('touchstart', start);
      node.removeEventListener('touchend', end);
    };
  }, [next, prev]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void containerRef.current?.requestFullscreen();
  };

  const slideAt = useCallback((clientX: number) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return Math.round((x / rect.width) * (TOTAL - 1));
  }, []);

  const onProgressDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragging.current = true;
    const target = slideAt(e.clientX);
    if (target !== null) {
      animating.current = false;
      goTo(target);
    }
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      const target = slideAt(e.clientX);
      if (target !== null && target !== current) {
        animating.current = false;
        goTo(target);
      }
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [slideAt, goTo, current]);

  const enterNav = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setNavHovered(true);
  };
  const leaveNav = () => {
    hideTimer.current = setTimeout(() => setNavHovered(false), 600);
  };

  /** Captures each slide from a screen-capture stream, after its animations settle, into one PDF. */
  const exportPdf = useCallback(
    async (width: number, height: number) => {
      const node = containerRef.current;
      if (!node) return;
      setExportMenu(false);
      let stream: MediaStream | null = null;
      const saved = { slide: current, locked: navLocked };
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          preferCurrentTab: true,
        } as DisplayMediaStreamOptions);
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        await video.play();
        setNavLocked(false);
        setNavHovered(false);
        setExporting(true);
        await new Promise((r) => setTimeout(r, 500));
        const { jsPDF } = await import('jspdf');
        const rect = node.getBoundingClientRect();
        const w = width || rect.width;
        const h = height || rect.height;
        const pdf = new jsPDF({
          orientation: w > h ? 'landscape' : 'portrait',
          unit: 'px',
          format: [w, h],
        });
        const dpr = window.devicePixelRatio || 1;
        for (let i = 0; i < TOTAL; i++) {
          animating.current = false;
          currentRef.current = i;
          setCurrent(i);
          await new Promise((r) => setTimeout(r, EXPORT_WAIT_MS));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas
            .getContext('2d')
            ?.drawImage(
              video,
              rect.left * dpr,
              rect.top * dpr,
              rect.width * dpr,
              rect.height * dpr,
              0,
              0,
              w,
              h,
            );
          if (i > 0) pdf.addPage([w, h]);
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h);
        }
        pdf.save('Rasikh-Pitch.pdf');
      } catch (error) {
        if ((error as Error).name !== 'NotAllowedError') console.error('PDF export failed', error);
      } finally {
        stream?.getTracks().forEach((track) => track.stop());
        setExporting(false);
        currentRef.current = saved.slide;
        setCurrent(saved.slide);
        setNavLocked(saved.locked);
      }
    },
    [current, navLocked],
  );

  const Current = slides[current] ?? slides[0];
  const navVisible = navLocked || navHovered;
  const progress = ((current + 1) / TOTAL) * 100;
  if (!Current) return null;

  return (
    <div ref={containerRef} className="pd-deck">
      {!exporting && (
        <nav className="pd-tools" aria-label="Pitch navigation">
          <label>
            <span className="pd-sr">Jump to slide</span>
            <select
              aria-label="Jump to slide"
              value={current}
              onChange={(event) => {
                animating.current = false;
                goTo(Number(event.target.value));
              }}
            >
              {PITCH_NOTES.map((note) => (
                <option key={note.index} value={note.index}>
                  {String(note.index + 1).padStart(2, '0')} · {note.label}
                </option>
              ))}
            </select>
          </label>
          <a href="/pitch/research" target="_blank" rel="noopener noreferrer">
            Research &amp; evidence ↗
          </a>
        </nav>
      )}

      <motion.div
        key={current}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        transition={slideTransition}
        className="pd-stage-frame"
      >
        <Current />
      </motion.div>

      <div className="pd-nav-zone" onMouseEnter={enterNav} onMouseLeave={leaveNav}>
        <div className="pd-nav-trigger" />
        {presenterBlocked && (
          <p className="pd-blocked">
            The notes window was blocked. Allow pop-ups, then press P again.
          </p>
        )}
        <div className={`pd-nav ${navVisible ? 'is-visible' : ''}`}>
          <span className="pd-nav-brand">
            <Mark size={20} /> Rasikh
          </span>
          <i className="pd-nav-sep" />
          <button onClick={prev} disabled={current === 0} aria-label="Previous slide">
            <ChevronLeft size={16} />
          </button>
          <div
            ref={progressRef}
            className="pd-progress"
            onMouseDown={onProgressDown}
            role="presentation"
          >
            <span style={{ width: `${progress}%` }}>
              <i />
            </span>
          </div>
          <span className="pd-counter">
            {current + 1} / {TOTAL}
          </span>
          <button onClick={next} disabled={current === TOTAL - 1} aria-label="Next slide">
            <ChevronRight size={16} />
          </button>
          <i className="pd-nav-sep" />
          <button
            onClick={openPresenter}
            title="Presenter notes in a second window (P)"
            aria-label="Open presenter notes"
          >
            <PanelsTopLeft size={16} />
          </button>
          <button
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button
            onClick={() => {
              setNavLocked(false);
              setNavHovered(false);
            }}
            aria-label="Hide navigation"
          >
            <ChevronDown size={16} />
          </button>
          <i className="pd-nav-sep" />
          <div className="pd-export">
            <button
              onClick={() => setExportMenu((open) => !open)}
              disabled={exporting}
              aria-label="Export as PDF"
            >
              <Download size={16} />
            </button>
            {exportMenu && (
              <div className="pd-export-menu">
                <p>Export PDF</p>
                {exportSizes.map((size) => (
                  <button key={size.label} onClick={() => void exportPdf(size.width, size.height)}>
                    {size.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
