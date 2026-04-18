'use client';
import { useEffect } from 'react';
import { useEditorSettings } from '@/features/editor/stores/setting';

const loadedFonts = new Set<string>();
const STATIC_FONTS = new Set(['IBM Plex Sans', 'IBM Plex Mono']);

export function loadGoogleFont(fontName: string) {
  if (!fontName || loadedFonts.has(fontName) || STATIC_FONTS.has(fontName)) return;

  const id = `gfont-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
  loadedFonts.add(fontName);
}

export function EditorTypographyProvider() {
  const interfaceFont = useEditorSettings(state => state.interfaceFont);
  const textFont = useEditorSettings(state => state.textFont);
  const monospaceFont = useEditorSettings(state => state.monospaceFont);
  const fontSize = useEditorSettings(state => state.fontSize);
  const accentColor = useEditorSettings(state => state.accentColor);

  useEffect(() => {
    // Load dynamic fonts
    [interfaceFont?.[0], textFont?.[0], monospaceFont?.[0]].forEach(font => {
      if (font) loadGoogleFont(font);
    });

    // Inject styles directly into <head>
    const id = 'editor-typography-styles';
    let styleEl = document.getElementById(id) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = id;
      document.head.appendChild(styleEl);
    }
    const iFont = interfaceFont?.[0] ? `"${interfaceFont[0]}"` : 'IBM Plex Mono';
    const tFont = textFont?.[0] ? `"${textFont[0]}"` : 'var(--font-dm-sans)';
    const mFont = monospaceFont?.[0] ? `"${monospaceFont[0]}"` : 'monospace';

    const baseSize = fontSize ?? 16;
    const lhRatio = 1.5; // The multiplier
    const baseLineHeight = Math.round(baseSize * lhRatio);

    styleEl.textContent = `
      :root {
        --app-font-interface: ${iFont}, system-ui, sans-serif;
        --app-font-text: ${tFont}, Georgia, serif;
        --app-font-size: ${fontSize ?? 16}px;
        
        --editor-font-text: ${tFont}, Georgia, serif;
        --editor-font-mono: ${mFont}, monospace;
        --editor-accent-color: ${accentColor};

        --editor-font-size: ${baseSize}px;
        --editor-line-height: ${baseLineHeight}px;
      }

      .app-font-interface { font-family: var(--app-font-interface) !important; }
      .editor-font-text      { font-family: var(--editor-font-text) !important; }
      .editor-font-mono      { font-family: var(--editor-font-mono) !important; }
    `;

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [interfaceFont, textFont, monospaceFont, fontSize, accentColor]);

  return null;
}
