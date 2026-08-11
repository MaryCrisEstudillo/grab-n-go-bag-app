import { useCallback, useEffect, useState } from 'react';
import { readString, writeString, STORAGE_KEYS } from '../lib/storage';

export type Theme = 'light' | 'dark';

/** Matches the inline script in index.html, which sets the class before paint. */
function initialTheme(): Theme {
  const saved = readString(STORAGE_KEYS.theme);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    writeString(STORAGE_KEYS.theme, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggle };
}
