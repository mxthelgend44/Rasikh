import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { TEXT_SIZES } from '@/design/scale';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...TEXT_SIZES] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
