import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'woodworks_theme';

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const next: Theme = theme === 'dark' ? 'light' : 'dark';

    const apply = () => {
      root.classList.toggle('dark', next === 'dark');
      flushSync(() => setTheme(next));
    };

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<unknown> };
    };
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    root.classList.add('theme-switching');
    const done = () => root.classList.remove('theme-switching');

    if (!doc.startViewTransition || reduceMotion) {
      apply();
      requestAnimationFrame(() => requestAnimationFrame(done));
      return;
    }
    doc.startViewTransition(apply).finished.then(done, done);
  }, [theme]);

  return { theme, isDark: theme === 'dark', toggleTheme };
}
