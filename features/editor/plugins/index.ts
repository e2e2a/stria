import { EditorView, Decoration, ViewPlugin, ViewUpdate, DecorationSet } from '@codemirror/view';
import { StateField, RangeSet, EditorState, StateEffect, Facet } from '@codemirror/state';
import { buildChunkDecorations, buildDecorations } from '../decorations';
import { makeToastError } from '@/lib/toast';

export const setViewportLinesEffect = StateEffect.define<{ from: number; to: number }>();

export const viewportLinesField = StateField.define<{ from: number; to: number }>({
  create() {
    return { from: 1, to: 1 };
  },
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(setViewportLinesEffect)) return e.value;
    }
    return value;
  },
});

export const viewportLinesPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      if (update.viewportChanged || update.docChanged) {
        const state = update.state;
        const view = update.view;

        const fromLine = state.doc.lineAt(view.viewport.from).number;
        const toLine = state.doc.lineAt(view.viewport.to).number;

        requestAnimationFrame(() => {
          if (view.dom.parentNode) {
            view.dispatch({
              effects: setViewportLinesEffect.of({ from: fromLine, to: toLine }),
            });
          }
        });
      }
    }
  }
);

export const toggleSourceMode = StateEffect.define<boolean>();
export const sourceModeField = StateField.define<boolean>({
  create() {
    return false;
  },
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(toggleSourceMode)) return e.value;
    }
    return value;
  },
});

export const setDraggingEffect = StateEffect.define<boolean>();
export const rebuildDecorationsEffect = StateEffect.define<null>();

export const dragStatusField = StateField.define<boolean>({
  create() {
    return false;
  },
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(setDraggingEffect)) return e.value;
    }
    return value;
  },
});
export function setupDragTracking(view: EditorView) {
  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    view.dispatch({ effects: setDraggingEffect.of(true) });
  };

  const onRelease = () => {
    if (view.state.field(dragStatusField)) {
      view.dispatch({
        effects: [setDraggingEffect.of(false)],
      });
    }
  };

  view.dom.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onRelease);
  window.addEventListener('dragend', onRelease);
  window.addEventListener('drop', onRelease);

  return () => {
    view.dom.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onRelease);
    window.removeEventListener('dragend', onRelease);
    window.removeEventListener('drop', onRelease);
  };
}

// ------------------------------
// Main StateField
// ------------------------------
export const markdownLivePreviewField = StateField.define<RangeSet<Decoration>>({
  create(state: EditorState) {
    if (state.field(sourceModeField, false)) return RangeSet.empty;
    return state.field(sourceModeField, false) ? RangeSet.empty : buildDecorations(state, 1, 100);
  },
  update(decos, tr) {
    const isDragging = tr.state.field(dragStatusField); // Get local status
    const rebuildEffect = tr.effects.some(e => e.is(rebuildDecorationsEffect));
    const docChanged = tr.docChanged || tr.reconfigured || tr.effects.some(e => e.is(toggleSourceMode));
    const selectionChanged = !tr.startState.selection.eq(tr.state.selection);
    const viewportChanged = tr.effects.some(e => e.is(setViewportLinesEffect));
    const wasDragging = tr.startState.field(dragStatusField);
    const dragJustEnded = wasDragging && !isDragging;
    const vLines = tr.state.field(viewportLinesField);

    if (dragJustEnded) return buildDecorations(tr.state, vLines.from, vLines.to);
    if (isDragging) return decos.map(tr.changes);
    if (docChanged || rebuildEffect || viewportChanged || selectionChanged) return buildDecorations(tr.state, vLines.from, vLines.to);

    return decos.map(tr.changes);
  },
  provide: f => EditorView.decorations.from(f),
});

export function chunkLivePreviewPlugin(canEditChunk: boolean) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildChunkDecorations(view, view.state.field(chunkSplitsField), canEditChunk);
      }
      update(update: ViewUpdate) {
        const splitsChanged = update.state.field(chunkSplitsField) !== update.startState.field(chunkSplitsField);
        if (update.docChanged || update.viewportChanged || splitsChanged) {
          // Pass canEditChunk to the builder
          this.decorations = buildChunkDecorations(update.view, update.view.state.field(chunkSplitsField), canEditChunk);
        }
      }
    },
    { decorations: v => v.decorations }
  );
}

export const createEditorStatsPlugin = (nodeId: string) => {
  let currentWordCount = 0;

  return ViewPlugin.fromClass(
    class {
      constructor(view: EditorView) {
        const fullText = view.state.doc.toString();
        currentWordCount = fullText.match(/\S+/g)?.length || 0;
      }

      update(update: ViewUpdate) {
        if (update.docChanged) {
          const charCount = update.state.doc.length;
          const lineCount = update.state.doc.lines;

          const charEl = document.getElementById(`cm-char-count-${nodeId}`);
          const lineEl = document.getElementById(`cm-line-count-${nodeId}`);
          if (charEl) charEl.textContent = charCount.toString();
          if (lineEl) lineEl.textContent = lineCount.toString();

          let minOld = Infinity,
            maxOld = -Infinity;
          let minNew = Infinity,
            maxNew = -Infinity;

          update.changes.iterChangedRanges((fromA, toA, fromB, toB) => {
            minOld = Math.min(minOld, fromA);
            maxOld = Math.max(maxOld, toA);
            minNew = Math.min(minNew, fromB);
            maxNew = Math.max(maxNew, toB);
          });

          if (minOld !== Infinity) {
            const oldStartLine = update.startState.doc.lineAt(minOld);
            const oldEndLine = update.startState.doc.lineAt(maxOld);
            const oldText = update.startState.doc.sliceString(oldStartLine.from, oldEndLine.to);
            const oldWords = oldText.match(/\S+/g)?.length || 0;

            const newStartLine = update.state.doc.lineAt(minNew);
            const newEndLine = update.state.doc.lineAt(maxNew);
            const newText = update.state.doc.sliceString(newStartLine.from, newEndLine.to);
            const newWords = newText.match(/\S+/g)?.length || 0;

            currentWordCount += newWords - oldWords;

            currentWordCount = Math.max(0, currentWordCount);

            const wordEl = document.getElementById(`cm-word-count-${nodeId}`);
            if (wordEl) wordEl.textContent = currentWordCount.toString();
          }
        }
      }
    }
  );
};

// Plugin turns on/off here
export const chunkModeFacet = Facet.define<boolean, boolean>({
  combine: values => values.some(v => v === true),
});

export const setSplitsEffect = StateEffect.define<[number, number][]>();

export const chunkSplitsField = StateField.define<[number, number][]>({
  create() {
    return [];
  },
  update(splits, tr) {
    for (const e of tr.effects) {
      if (e.is(setSplitsEffect)) return e.value;
    }
    return splits;
  },
});

const MAX_CHARACTERS = 5000000;
const MAX_LINES = 100000;

export const lineLimitGuard = EditorState.transactionFilter.of(tr => {
  if (tr.newDoc.length > MAX_CHARACTERS) {
    makeToastError(`Document is too large! Maximum limit is 5,000,000 characters.`);
    return [];
  }

  if (tr.newDoc.lines > MAX_LINES) {
    makeToastError(`Document limit reached! You cannot exceed ${MAX_LINES} lines.`);
    return [];
  }
  return tr;
});

export const permissionGuard = (canEditNode: boolean) =>
  EditorState.transactionFilter.of(tr => {
    const isUserAction = tr.isUserEvent('input') || tr.isUserEvent('delete') || tr.isUserEvent('paste') || tr.isUserEvent('drop');

    if (!canEditNode && tr.docChanged && isUserAction) {
      makeToastError(`View-only mode! You do not have permission to edit this document.`);
      return [];
    }
    return tr;
  });
