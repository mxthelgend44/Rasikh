import { THEME_STORAGE_KEY } from '@/lib/theme-storage';

/**
 * Inline script that applies the stored theme before first paint, so a reload never flashes
 * the wrong one. Must agree with `readChoice` in theme.ts: no stored choice means light.
 */
export const THEME_BOOT = `(function(){try{var c=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=c==='dark'||(c==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;
