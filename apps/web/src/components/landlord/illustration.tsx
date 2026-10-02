import { cn } from '@/lib/cn';
import type { Property } from '@/domain/types';

/** Stable small integer from a string, so every unit keeps the same picture between renders. */
function seed(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const sand = 'fill-[rgb(var(--brand-sand))] dark:fill-[rgb(var(--brand-ink))]';
const seafoam = 'fill-[rgb(var(--brand-seafoam))]';
const petrol = 'fill-[rgb(var(--brand-petrol))]';
const ink = 'fill-[rgb(var(--brand-ink))]';
const coral = 'fill-[rgb(var(--brand-coral))]';
const saffron = 'fill-[rgb(var(--brand-saffron))]';

/** Three colourways from the brand palette. Each pairs a sky, a facade and a window colour. */
const PALETTES = [
  {
    frame: 'bg-[rgb(var(--brand-sand))] dark:bg-[rgb(var(--subtle))]',
    sky: sand,
    far: 'fill-[rgb(var(--brand-seafoam))] opacity-[0.45] dark:opacity-[0.1]',
    ground: 'fill-[rgb(var(--brand-seafoam))] opacity-[0.7] dark:opacity-[0.15]',
    facade: seafoam,
    window: ink,
    accent: coral,
    sun: saffron,
  },
  {
    frame: 'bg-[rgb(var(--brand-seafoam))] dark:bg-[rgb(var(--subtle))]',
    sky: 'fill-[rgb(var(--brand-seafoam))] opacity-[0.45] dark:fill-[rgb(var(--brand-ink))] dark:opacity-100',
    far: 'fill-[rgb(var(--brand-sand))] dark:opacity-[0.1]',
    ground: 'fill-[rgb(var(--brand-sand))] dark:opacity-[0.15]',
    facade: petrol,
    window: 'fill-[rgb(var(--brand-sand))]',
    accent: saffron,
    sun: coral,
  },
  {
    frame: 'bg-[rgb(var(--brand-sand))] dark:bg-[rgb(var(--subtle))]',
    sky: sand,
    far: 'fill-[rgb(var(--brand-coral))] opacity-[0.25] dark:opacity-[0.1]',
    ground: 'fill-[rgb(var(--brand-seafoam))] opacity-[0.6] dark:opacity-[0.15]',
    facade: ink,
    window: 'fill-[rgb(var(--brand-sand))]',
    accent: saffron,
    sun: coral,
  },
] as const;

/**
 * A flat doorway-and-building picture drawn from the brand palette. Height, width and the
 * number of floors follow the unit size, and the colourway follows the unit id, so a row
 * of properties reads as different buildings rather than one repeated tile.
 */
export function PropertyIllustration({
  property,
  compact = false,
  className,
}: {
  property: Property;
  compact?: boolean;
  className?: string;
}) {
  const n = seed(property.id);
  const p = PALETTES[n % PALETTES.length];
  const kind = property.bedrooms <= 1 ? 'tower' : property.bedrooms === 2 ? 'midrise' : 'villa';
  const groundY = 112;
  const w = kind === 'tower' ? 60 : kind === 'midrise' ? 108 : 124;
  const floors = kind === 'tower' ? 6 + (n % 2) : kind === 'midrise' ? 4 + (n % 2) : 2;
  const cols = kind === 'tower' ? 3 : kind === 'midrise' ? 5 : 6;
  const rowH = kind === 'villa' ? 14 : 11;
  const h = floors * rowH + 14;
  const x = (240 - w) / 2 + ((n >> 3) % 3) * 8 - 8;
  const y = groundY - h;
  const gap = (w - 16) / cols;
  const lit = (n >> 5) % (floors * cols);
  const doorX = x + w / 2 - 8;
  return (
    <div
      aria-hidden
      className={cn(
        'relative isolate overflow-hidden rounded-lg',
        p.frame,
        compact ? 'h-20 w-24 shrink-0' : 'aspect-[5/3] w-full',
        className,
      )}
    >
      <svg
        viewBox="0 0 240 144"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        focusable="false"
      >
        <rect width="240" height="144" className={p.sky} />
        <circle cx={32 + ((n >> 2) % 4) * 52} cy="30" r="12" className={p.sun} />
        <rect x="14" y={groundY - 44} width="34" height="44" rx="2" className={p.far} />
        <rect x="196" y={groundY - 62} width="30" height="62" rx="2" className={p.far} />
        <rect y={groundY} width="240" height="32" className={p.ground} />
        <rect x="0" y={groundY} width="240" height="2" className={ink} opacity="0.12" />
        <path
          d={
            kind === 'villa'
              ? `M${x} ${y + 6} Q${x + w / 2} ${y - 14} ${x + w} ${y + 6} V${groundY} H${x} Z`
              : `M${x} ${y + 3} a3 3 0 0 1 3-3 H${x + w - 3} a3 3 0 0 1 3 3 V${groundY} H${x} Z`
          }
          className={p.facade}
        />
        {Array.from({ length: floors * cols }, (_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          return (
            <rect
              key={i}
              x={x + 8 + col * gap + 1.5}
              y={y + 8 + row * rowH}
              width={Math.max(gap - 5, 5)}
              height={rowH - 5}
              rx="1.5"
              className={i === lit ? p.accent : p.window}
              opacity={i === lit ? 1 : 0.78}
            />
          );
        })}
        <path
          d={`M${doorX} ${groundY} V${groundY - 14} a8 8 0 0 1 16 0 V${groundY} Z`}
          className="fill-[rgb(var(--brand-ink))]"
        />
        <circle cx={x + w + 18} cy={groundY - 9} r="9" className={petrol} opacity="0.85" />
        <rect x={x + w + 17} y={groundY - 6} width="2" height="6" className={ink} />
      </svg>
    </div>
  );
}
