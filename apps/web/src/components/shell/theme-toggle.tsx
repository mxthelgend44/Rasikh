'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { applyTheme, useResolvedTheme } from '@/lib/theme';

export interface ThemeToggleProps {
  /** Accessible name for switching to `next`. Defaults to English. */
  label?: (next: 'light' | 'dark') => string;
}

export function ThemeToggle({ label = (next) => `Switch to ${next} theme` }: ThemeToggleProps) {
  const theme = useResolvedTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <Button
      variant="ghost"
      iconOnly
      aria-label={label(next)}
      icon={theme === 'dark' ? <Sun /> : <Moon />}
      onClick={() => applyTheme(next)}
    />
  );
}
