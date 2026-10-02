'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'rasikh-sidebar-collapsed';

/**
 * Persisted collapse state. The first render is always expanded and the stored value is
 * applied in an effect, so server and client markup agree.
 */
export function useSidebarCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      /* storage unavailable: stay expanded */
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* storage unavailable: the choice lasts for this page view */
      }
      return next;
    });
  }, []);

  return [collapsed, toggle];
}
