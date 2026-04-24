import { Decoration, DecorationSet, EditorView, StateEffect, StateField } from '@uiw/react-codemirror';

export let initView: EditorView | null = null;

let isPrerendering = false;
import { setViewportLinesEffect, viewportLinesField } from '@/features/editor/plugins';
import { buildMermaidDecorations, prerenderThenBuild } from '../decorations/mermaid-build-decoration';

export const mermaidHeightUpdateEffect = StateEffect.define<{ code: string; height: number }>();
export const mermaidHeightCache = new Map<string, number>();
export const mermaidSvgCache = new Map<string, string>();

export const themeChangedEffect = StateEffect.define<void>();

export const mermaidLivePreviewField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },

  update(decos, tr) {
    if (tr.state.doc.length === 0) return decos;
    const viewportChanged = tr.effects.some(e => e.is(setViewportLinesEffect));

    if (viewportChanged) {
      if (!isPrerendering) {
        const v = tr.state.field(viewportLinesField, false) ?? {
          from: 1,
          to: tr.state.doc.lines,
        };

        isPrerendering = true;

        // prerender fills cache ONLY (no waiting for UI)
        prerenderThenBuild(tr.state, v.from, v.to).finally(() => {
          isPrerendering = false;
        });
      }
    }

    // If prerender finished → just allow rebuild (no special logic)
    if (tr.effects.some(e => e.is(mermaidPrerenderedEffect))) {
      // nothing special, just fall through
    }

    // ALWAYS BUILD DECORATIONS
    return buildMermaidDecorations(tr.state, 1, tr.state.doc.lines);
  },

  provide: f => EditorView.decorations.from(f),
});
export const mermaidPrerenderedEffect = StateEffect.define<null>();

export function registerView(view: EditorView) {
  initView = view;
}
