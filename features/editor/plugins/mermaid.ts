import { Decoration, DecorationSet, EditorView, StateEffect, StateField } from '@uiw/react-codemirror';

export let initView: EditorView | null = null;

let isPrerendering = false;
import { setViewportLinesEffect, sourceModeField, viewportLinesField } from '@/features/editor/plugins';
import { buildMermaidDecorations, prerenderThenBuild } from '../decorations/mermaid-build-decoration';
import { initMermaid, resolveTheme } from '../widgets/mermaid-widget';
import { useEditorSettings } from '../stores/setting';

export const mermaidHeightUpdateEffect = StateEffect.define<{ code: string; height: number }>();
export const mermaidHeightCache = new Map<string, number>();
export const mermaidSvgCache = new Map<string, string>();
export const mermaidEditClickEffect = StateEffect.define<{ from: number; to: number }>();
let activeEditBlock: { from: number; to: number } | null = null;

export const themeChangedEffect = StateEffect.define<void>();

let isBuilt = false;

export function resetMermaidState() {
  isPrerendering = false;
  isBuilt = false;
  activeEditBlock = null;
  // Don't clear caches — SVG/height caches are still valid across tabs
}

export const mermaidLivePreviewField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },

  update(decos, tr) {
    const sourceMode = tr.state.field(sourceModeField, false);
    if (sourceMode) {
      isBuilt = false;
      return Decoration.none;
    }

    if (tr.state.doc.length === 0) return decos;

    if (isBuilt && tr.docChanged && !isPrerendering) {
      let hasNewMermaid = false;
      let changedFrom = 0;
      let changedTo = 0;

      tr.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
        const changedText = tr.state.doc.sliceString(fromB, toB);
        if (changedText.includes('```mermaid')) {
          hasNewMermaid = true;
          changedFrom = tr.state.doc.lineAt(fromB).number;
          changedTo = tr.state.doc.lineAt(toB).number;
        }
      });

      if (hasNewMermaid) {
        isBuilt = false;
        isPrerendering = true;
        prerenderThenBuild(tr.state, changedFrom, changedTo).finally(() => {
          isPrerendering = false;
        });
      }
    }

    const viewportChanged = tr.effects.some(e => e.is(setViewportLinesEffect));
    const prerenderDone = tr.effects.some(e => e.is(mermaidPrerenderedEffect));
    const themeChanged = tr.effects.some(e => e.is(themeChangedEffect));

    // ✅ Kick off prerender on viewport change
    if (viewportChanged && !isPrerendering) {
      const v = tr.state.field(viewportLinesField, false) ?? {
        from: 1,
        // to: tr.state.doc.lines,
        to: tr.state.doc.lineAt(0).number,
      };
      isPrerendering = true;
      console.log('v.from', v.from);
      console.log('v.to', v.to);
      prerenderThenBuild(tr.state, v.from, v.to).finally(() => {
        isPrerendering = false;
      });
    }

    // ✅ Prerender done → one full build, then lock
    if (prerenderDone) {
      isBuilt = true;
      return buildMermaidDecorations(tr.state, 1, tr.state.doc.lines);
    }

    // ✅ Theme changed → one rebuild
    if (themeChanged) {
      isBuilt = true;
      return buildMermaidDecorations(tr.state, 1, tr.state.doc.lines);
    }
    const selectionChanged = !tr.startState.selection.eq(tr.state.selection);
    // ✅ Already built → just shift positions, zero scanning
    const editClick = tr.effects.find(e => e.is(mermaidEditClickEffect));
    if (isBuilt) {
      if (editClick) {
        activeEditBlock = editClick.value;
        const fromPos = tr.state.doc.line(editClick.value.from).from;
        const toPos = tr.state.doc.line(editClick.value.to).to;
        return decos.map(tr.changes).update({
          filter: (from, to) => !(from >= fromPos && to <= toPos),
        });
      }

      if (selectionChanged && activeEditBlock) {
        const cursorLine = tr.state.doc.lineAt(tr.state.selection.main.head).number;
        const stillInBlock = cursorLine >= activeEditBlock.from && cursorLine <= activeEditBlock.to;

        if (!stillInBlock) {
          const blockDecos = buildMermaidDecorations(tr.state, activeEditBlock.from, activeEditBlock.to);
          activeEditBlock = null;

          const toAdd = iterDecos(blockDecos);
          return decos.map(tr.changes).update({
            add: toAdd,
            sort: true,
          });
        }
      }

      return decos.map(tr.changes);
    }

    return Decoration.none;
  },

  provide: f => EditorView.decorations.from(f),
});
export const mermaidPrerenderedEffect = StateEffect.define<null>();

export function registerView(view: EditorView) {
  const theme = useEditorSettings.getState().theme;
  initView = view;
  initMermaid(resolveTheme(theme));
}

function iterDecos(set: DecorationSet): { from: number; to: number; value: Decoration }[] {
  const result: { from: number; to: number; value: Decoration }[] = [];
  const cursor = set.iter();
  while (cursor.value) {
    result.push({ from: cursor.from, to: cursor.to, value: cursor.value });
    cursor.next();
  }
  return result;
}
