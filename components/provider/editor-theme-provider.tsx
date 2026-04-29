'use client';

import { useEditorSettings } from '@/features/editor/stores/setting';
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  skin: string;
  isDark: boolean;
  activeTheme: Appearance;
  setSkin: (skin: string) => void;
  setTheme: (theme: Appearance) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  skin: '',
  isDark: true,
  activeTheme: 'dark',
  setSkin: () => {},
  setTheme: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export function EditorThemeProvider({ children }: { children: ReactNode }) {
  const [activeTheme, setActiveThemeState] = useState<Appearance>(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem('theme-appearance') as Appearance) || 'light';
      return saved;
    }
    return 'light';
  });

  const [skin, setSkinState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-skin') || '';
      return saved;
    }
    return '';
  });

  const [isDarkState, setIsDarkState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem('theme-appearance') as Appearance) || 'dark';
      if (saved === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
      return saved === 'dark';
    }
    return true;
  });

  const [mounted, setMounted] = useState(false);

  const isZustandLoaded = useRef(false);

  const zustandTheme = useEditorSettings(state => state.theme);
  const zustandSkin = useEditorSettings(state => state.skin);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;

    const applyThemeToDOM = () => {
      const isDark = activeTheme === 'system' ? mq.matches : activeTheme === 'dark';
      setIsDarkState(isDark);

      root.classList.add('themed-root');

      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');

      if (skin) root.setAttribute('data-theme', skin);
      else root.removeAttribute('data-theme');
    };

    applyThemeToDOM();

    const handler = () => {
      applyThemeToDOM();
    };
    mq.addEventListener('change', handler);

    return () => {
      mq.removeEventListener('change', handler);
      root.classList.add('dark');
      root.classList.remove('themed-root');
      root.removeAttribute('data-theme');
    };
  }, [activeTheme, skin, mounted]);

  useEffect(() => {
    if (!mounted) return;

    if (zustandTheme || zustandSkin) {
      if (!isZustandLoaded.current) {
        isZustandLoaded.current = true;
      }
    }

    if (!isZustandLoaded.current) return;

    if (zustandTheme && zustandTheme !== activeTheme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveThemeState(zustandTheme as Appearance);
      localStorage.setItem('theme-appearance', zustandTheme);
    }

    if (zustandSkin !== undefined && zustandSkin !== skin) {
      setSkinState(zustandSkin);
      localStorage.setItem('theme-skin', zustandSkin);
    }
  }, [zustandTheme, zustandSkin, activeTheme, skin, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const syncPortals = () => {
      const portals = document.querySelectorAll('[data-radix-portal]');
      portals.forEach(portal => {
        portal.classList.add('themed-root');
        if (isDarkState) {
          portal.classList.add('dark');
          portal.classList.remove('force-light');
        } else {
          portal.classList.remove('dark');
          portal.classList.add('force-light');
        }
        if (skin) portal.setAttribute('data-theme', skin);
        else portal.removeAttribute('data-theme');
      });
    };

    syncPortals();

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          syncPortals();
          break;
        }
      }
    });

    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, [isDarkState, skin, mounted]);

  // Manual Setters
  const setTheme = (t: Appearance) => {
    setActiveThemeState(t);
    localStorage.setItem('theme-appearance', t);
  };

  const setSkin = (s: string) => {
    setSkinState(s);
    localStorage.setItem('theme-skin', s);
  };

  const themeClasses = ['themed-root min-h-screen w-full transition-colors duration-200', isDarkState ? 'dark' : 'force-light'].join(' ');

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ skin, isDark: isDarkState, activeTheme, setSkin, setTheme }}>
      <div id="editor-root" className={themeClasses} data-theme={skin || undefined}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
