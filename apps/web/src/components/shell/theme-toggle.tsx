'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { applyTheme, useResolvedTheme } from '@/lib/theme';

export function ThemeToggle() {
  const theme = useResolvedTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <Button
      variant="ghost"
      iconOnly
      aria-label={`Switch to ${next} theme`}
      icon={theme === 'dark' ? <Sun /> : <Moon />}
      onClick={() => applyTheme(next)}
    />
  );
}
