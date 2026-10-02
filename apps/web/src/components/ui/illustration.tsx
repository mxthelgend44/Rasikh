import Image from 'next/image';
import { cn } from '@/lib/cn';
import { ILLUSTRATION_ASSETS, type IllustrationVariant } from './illustration-assets';

export type { IllustrationVariant } from './illustration-assets';

export interface IllustrationProps {
  variant?: IllustrationVariant;
  alt?: string;
  decorative?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  aspect?: 'natural' | 'landscape' | 'square';
  fit?: 'cover' | 'contain';
  treatment?: 'framed' | 'blend' | 'bleed' | 'cutout';
  fade?: 'none' | 'edges' | 'inline-start' | 'bottom';
}

export function Illustration({
  variant = 'journey',
  alt = '',
  decorative = !alt,
  className,
  priority = false,
  sizes = '(max-width: 640px) 240px, 360px',
  aspect = 'natural',
  fit,
  treatment,
  fade,
}: IllustrationProps) {
  const asset = ILLUSTRATION_ASSETS[variant];
  const imageFit = fit ?? asset?.fit ?? 'contain';
  const presentation = treatment ?? (asset?.cutout ? 'cutout' : imageFit === 'contain' ? 'blend' : 'framed');
  const silhouetteMask = asset?.silhouette === 'company'
    ? `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 1024"><path fill="white" transform="scale(1536 1024)" d="M.10 .80 C.10 .72 .11 .65 .13 .58 L.12 .38 Q.16 .25 .35 .17 Q.39 .10 .46 .06 Q.61 -.01 .75 .04 Q.83 .08 .86 .22 Q.90 .33 .89 .43 L.94 .77 Q.95 .83 .88 .83 Q.90 .97 .73 .98 Q.61 .99 .57 .94 L.42 .93 Q.26 .98 .16 .93 Q.03 .93 .04 .85 Q.07 .83 .10 .80Z"/></svg>')}")`
    : undefined;
  return (
    <div
      aria-hidden={decorative || undefined}
      data-treatment={presentation}
      data-fade={fade ?? (presentation === 'blend' ? 'edges' : 'none')}
      style={
        aspect === 'natural'
          ? { aspectRatio: asset ? `${asset.width} / ${asset.height}` : '3 / 2' }
          : undefined
      }
      className={cn(
        'rasikh-illustration relative w-full min-w-0',
        aspect === 'landscape' && 'aspect-[3/2]',
        aspect === 'square' && 'aspect-square',
        className,
      )}
    >
      {asset ? (
        <Image
          src={asset.src}
          alt={decorative ? '' : alt || asset.alt}
          fill
          priority={priority}
          sizes={sizes}
          style={{
            objectPosition: asset.position,
            objectFit: imageFit,
            ...(silhouetteMask ? {
              maskImage: silhouetteMask,
              WebkitMaskImage: silhouetteMask,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
            } : {}),
          }}
          className="rasikh-illustration-image"
        />
      ) : (
        <svg
          viewBox="0 0 240 160"
          role={decorative ? undefined : 'img'}
          aria-label={decorative ? undefined : alt}
          className="rasikh-illustration-image absolute inset-0 h-full w-full"
        >
          <ellipse cx="122" cy="143" rx="95" ry="9" fill="rgb(var(--brand-sand))" />
          <path d="M72 136V68a48 48 0 0 1 96 0v68" fill="rgb(var(--brand-sand))" />
          <path d="M91 136V69a29 29 0 0 1 58 0v67" fill="rgb(var(--brand-seafoam))" />
          <path
            d="M24 138c26-31 58 18 89-3 29-20 66 9 101-36"
            fill="none"
            stroke="rgb(var(--brand-petrol))"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <circle cx="119" cy="88" r="10" fill="rgb(var(--brand-ink))" />
          <path d="M105 123v-17a14 14 0 0 1 28 0v17z" fill="rgb(var(--brand-coral))" />
          <circle cx="191" cy="42" r="13" fill="rgb(var(--brand-saffron))" />
          <path d="m41 87 9-12 9 12-9 12z" fill="rgb(var(--brand-seafoam))" />
        </svg>
      )}
    </div>
  );
}
