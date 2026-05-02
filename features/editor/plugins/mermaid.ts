import { Decoration, DecorationSet, EditorView, Facet, StateEffect, StateField } from '@uiw/react-codemirror';

export const initView: EditorView | null = null;

const isPrerendering = false;
import { setViewportLinesEffect, sourceModeField, viewportLinesField } from '@/features/editor/plugins';
import { buildMermaidDecorations, prerenderThenBuild } from '../decorations/mermaid-build-decoration';
import { initMermaid, resolveTheme } from '../widgets/mermaid-widget';
import { useEditorSettings } from '../stores/setting';

export const mermaidHeightUpdateEffect = StateEffect.define<{ code: string; height: number }>();
export const mermaidHeightCache = new Map<string, number>();
export const mermaidSvgCache = new Map<string, string>();
export const mermaidEditClickEffect = StateEffect.define<{ from: number; to: number }>();

export const themeChangedEffect = StateEffect.define<void>();

export const nodeIdFacet = Facet.define<string, string>({
  combine: values => values[0] ?? '',
});

interface MermaidNodeState {
  isBuilt: boolean;
  isPrerendering: boolean;
  activeEditBlock: { from: number; to: number } | null;
}

const nodeState = new Map<string, MermaidNodeState>();
const viewRegistry = new Map<string, EditorView>();

function getState(nodeId: string): MermaidNodeState {
  if (!nodeState.has(nodeId)) {
    nodeState.set(nodeId, { isBuilt: false, isPrerendering: false, activeEditBlock: null });
  }
  return nodeState.get(nodeId)!;
}

export function resetMermaidState(nodeId: string) {
  nodeState.set(nodeId, { isBuilt: false, isPrerendering: false, activeEditBlock: null });
}

export const mermaidLivePreviewField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },

  update(decos, tr) {
    const nodeId = tr.state.facet(nodeIdFacet);
    const s = getState(nodeId);

    const sourceMode = tr.state.field(sourceModeField, false);
    if (sourceMode) {
      s.isBuilt = false;
      return Decoration.none;
    }

    if (tr.state.doc.length === 0) return decos;

    // New mermaid block typed while already built
    if (s.isBuilt && tr.docChanged && !s.isPrerendering) {
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
        s.isBuilt = false;
        s.isPrerendering = true;
        prerenderThenBuild(tr.state, changedFrom, changedTo, nodeId).finally(() => {
          s.isPrerendering = false;
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
        to: tr.state.doc.lineAt(0).number,
      };
      s.isPrerendering = true;
      prerenderThenBuild(tr.state, v.from, v.to, nodeId).finally(() => {
        s.isPrerendering = false;
      });
    }

    if (prerenderDone) {
      s.isBuilt = true;
      return buildMermaidDecorations(tr.state, 1, tr.state.doc.lines);
    }

    // Theme changed → rebuild
    if (themeChanged) {
      s.isBuilt = true;
      return buildMermaidDecorations(tr.state, 1, tr.state.doc.lines);
    }

    const selectionChanged = !tr.startState.selection.eq(tr.state.selection);
    const editClick = tr.effects.find(e => e.is(mermaidEditClickEffect));

    if (s.isBuilt) {
      if (editClick) {
        s.activeEditBlock = editClick.value;
        const fromPos = tr.state.doc.line(editClick.value.from).from;
        const toPos = tr.state.doc.line(editClick.value.to).to;
        return decos.map(tr.changes).update({
          filter: (from, to) => !(from >= fromPos && to <= toPos),
        });
      }

      if (selectionChanged && s.activeEditBlock) {
        const cursorLine = tr.state.doc.lineAt(tr.state.selection.main.head).number;
        const stillInBlock = cursorLine >= s.activeEditBlock.from && cursorLine <= s.activeEditBlock.to;

        if (!stillInBlock) {
          const blockDecos = buildMermaidDecorations(tr.state, s.activeEditBlock.from, s.activeEditBlock.to);
          s.activeEditBlock = null;

          const toAdd = iterDecos(blockDecos);
          return decos.map(tr.changes).update({ add: toAdd, sort: true });
        }
      }

      return decos.map(tr.changes);
    }

    return Decoration.none;
  },

  provide: f => EditorView.decorations.from(f),
});
export const mermaidPrerenderedEffect = StateEffect.define<null>();

export function registerView(view: EditorView, nodeId: string) {
  viewRegistry.set(nodeId, view);
  // resetMermaidState(nodeId);
  const theme = useEditorSettings.getState().theme;
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

export { viewRegistry };
