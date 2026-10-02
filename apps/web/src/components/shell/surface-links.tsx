import Link from 'next/link';
import { SURFACES, SURFACE_ORDER, type SurfaceId } from '@/config/surfaces';
import { cn } from '@/lib/cn';

/** Top-bar switch between the stakeholder views that share one data model. */
export function SurfaceLinks({ active }: { active: SurfaceId }) {
  return (
    <nav aria-label="Switch view" className="flex items-center gap-1 max-md:hidden">
      {SURFACE_ORDER.map((id) => {
        const surface = SURFACES[id];
        const isActive = id === active;
        return (
          <Link
            key={id}
            href={surface.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-md px-2.5 py-1 text-body font-medium transition-colors',
              isActive ? 'text-fg' : 'text-fg-secondary hover:text-fg',
            )}
          >
            {surface.label}
          </Link>
        );
      })}
    </nav>
  );
}
