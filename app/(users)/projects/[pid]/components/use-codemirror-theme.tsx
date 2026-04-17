import { useEffect } from 'react';
import { EditorView } from '@codemirror/view';
import { Compartment } from '@codemirror/state';
import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';
import { useEditorSettings } from '@/features/editor/stores/setting';

export function useCodeMirrorTheme({
  viewRef,
  themeCompartment,
}: {
  viewRef: React.RefObject<EditorView | null>;

  themeCompartment: Compartment;
}) {
  const accentColor = useEditorSettings(state => state.accentColor);
  useEffect(() => {
    if (!viewRef.current) return;

    const theme = createTheme({
      theme: 'dark',
      settings: {
        background: '#191d24',
        foreground: `${accentColor}`,
        caret: '#ffffff',
        selectionMatch: '#3a3a3a',
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
        { tag: [t.heading], color: '#dcdcaa', fontWeight: 'bold' },
        { tag: [t.atom, t.bool, t.number], color: '#b5cea8' },
      ],
    });

    viewRef.current.dispatch({
      effects: themeCompartment.reconfigure(theme),
    });
  }, [viewRef, accentColor, themeCompartment]);
}
