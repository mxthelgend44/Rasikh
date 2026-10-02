import { PageHeader } from '@/components/ui/page-header';
import { TEXT_SIZES } from '@/design/scale';

interface Swatch {
  name: string;
  className: string;
}

const SURFACES: Swatch[] = [
  { name: 'canvas', className: 'bg-canvas' },
  { name: 'surface', className: 'bg-surface' },
  { name: 'raised', className: 'bg-raised' },
  { name: 'subtle', className: 'bg-subtle' },
  { name: 'hover', className: 'bg-hover' },
  { name: 'selected', className: 'bg-selected' },
  { name: 'track', className: 'bg-track' },
];

const LINES: Swatch[] = [
  { name: 'line', className: 'bg-line' },
  { name: 'edge', className: 'bg-edge' },
  { name: 'line-strong', className: 'bg-line-strong' },
];

const INK: Swatch[] = [
  { name: 'fg', className: 'bg-fg' },
  { name: 'fg-secondary', className: 'bg-fg-secondary' },
  { name: 'fg-tertiary', className: 'bg-fg-tertiary' },
  { name: 'fg-placeholder', className: 'bg-fg-placeholder' },
  { name: 'solid', className: 'bg-solid' },
];

const SIGNAL: Swatch[] = [
  { name: 'accent', className: 'bg-accent' },
  { name: 'accent-soft', className: 'bg-accent-soft' },
  { name: 'success', className: 'bg-success' },
  { name: 'success-soft', className: 'bg-success-soft' },
  { name: 'warning', className: 'bg-warning' },
  { name: 'warning-soft', className: 'bg-warning-soft' },
  { name: 'danger', className: 'bg-danger' },
  { name: 'danger-soft', className: 'bg-danger-soft' },
];

const SIZE_SPECIMEN: Record<(typeof TEXT_SIZES)[number], { className: string; px: string; use: string }> = {
  caption: { className: 'text-caption', px: '12 / 16', use: 'Badges, helper text, timestamps' },
  label: { className: 'text-label', px: '13 / 18', use: 'Group labels, table headers, descriptions' },
  body: { className: 'text-body', px: '14 / 20', use: 'Default text, navigation, controls, table cells' },
  title: { className: 'text-title', px: '16 / 24', use: 'Dialog and empty-state titles' },
  heading: { className: 'text-heading', px: '20 / 28', use: 'Page titles' },
  display: { className: 'text-display', px: '24 / 32', use: 'Hero statements, large figures' },
};

function SwatchGroup({ title, swatches }: { title: string; swatches: Swatch[] }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="mb-3 text-body font-medium text-fg">{title}</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {swatches.map((swatch) => (
          <li key={swatch.name}>
            <div className={`h-12 rounded-md border border-edge ${swatch.className}`} />
            <p className="mt-1.5 truncate text-caption text-fg-secondary">{swatch.name}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function TokensPage() {
  return (
    <>
      <PageHeader title="Tokens" />
      <div className="max-w-5xl px-6 py-6">
        <SwatchGroup title="Surfaces" swatches={SURFACES} />
        <SwatchGroup title="Lines" swatches={LINES} />
        <SwatchGroup title="Ink" swatches={INK} />
        <SwatchGroup title="Signal" swatches={SIGNAL} />

        <section className="mt-10">
          <h2 className="mb-3 text-body font-medium text-fg">Type scale</h2>
          <ul className="divide-y divide-line rounded-lg border border-edge">
            {TEXT_SIZES.map((size) => (
              <li key={size} className="flex items-baseline gap-4 px-4 py-3">
                <span className="w-20 shrink-0 text-label text-fg-tertiary">{size}</span>
                <span className={`min-w-0 flex-1 truncate text-fg ${SIZE_SPECIMEN[size].className}`}>
                  Your move, in the right order
                </span>
                <span className="hidden shrink-0 text-label text-fg-tertiary sm:block">
                  {SIZE_SPECIMEN[size].px}
                </span>
                <span className="hidden w-72 shrink-0 text-label text-fg-tertiary md:block">
                  {SIZE_SPECIMEN[size].use}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
