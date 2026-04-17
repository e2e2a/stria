import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';
import { EditorView } from '@uiw/react-codemirror';

export const getEditorCustomTheme = (accentColor: string) => {
  const baseTheme = createTheme({
    theme: 'dark',
    settings: {
      background: 'transparent',
      foreground: '#d4d4d4',
      selectionMatch: `${accentColor}40`,
      gutterBackground: '#191d24',
      lineHighlight: '#ffffff0f',
    },
    styles: [
      { tag: [t.keyword], color: '#569cd6' },
      { tag: [t.string], color: '#ce9178' },
      { tag: [t.comment], color: '#6a9955', fontStyle: 'italic' },
      { tag: [t.variableName], color: '#9cdcfe' },
      { tag: [t.function(t.variableName), t.propertyName], color: '#dcdcaa' },
      { tag: [t.typeName, t.className], color: '#4ec9b0' },
      { tag: [t.number, t.bool, t.null, t.atom], color: '#b5cea8' },
      { tag: t.operator, color: '#d4d4d4' },
      { tag: [t.typeName], color: '#4ec9b0' },
      { tag: [t.heading], color: 'var(--foreground)', fontWeight: 'bold' },
      { tag: [t.atom, t.bool, t.number], color: '#b5cea8' },
    ],
  });

  const cssOverride = EditorView.theme({
    '.cm-content': {
      '--editor-accent-color': accentColor,
    },
  });

  return [baseTheme, cssOverride];
};
