/**
 * Type scale names. Single source of truth for tailwind.config.ts and lib/cn.ts:
 * tailwind-merge treats every unknown `text-*` class as a colour, so a custom size
 * must be declared to it explicitly or `cn('text-fg text-body')` silently drops one.
 */
export const TEXT_SIZES = ['caption', 'label', 'body', 'title', 'heading', 'display'] as const;

export type TextSize = (typeof TEXT_SIZES)[number];
