import { EditorView, Decoration, ViewPlugin, ViewUpdate, DecorationSet } from '@codemirror/view';
import { StateField, RangeSet, EditorState, StateEffect, RangeSetBuilder, Facet } from '@codemirror/state';
import { buildDecorations } from '../decorations';
import { TablePreviewWidget } from '../widgets';

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

export const setColumnSelection = StateEffect.define<{ from: number; col: number | null }>();
export const columnSelectionField = StateField.define<{ from: number; col: number | null } | null>({
  create() {
    return null;
  },
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(setColumnSelection)) return e.value;
    }
    if (tr.docChanged) return null;
    return value;
  },
});

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
    if (state.field(sourceModeField, false)) {
      return RangeSet.empty;
    }
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

export const tableSelectionHighlighter = ViewPlugin.fromClass(
  class {
    constructor(readonly view: EditorView) {
      this.sync();
    }
    update(update: ViewUpdate) {
      if (update.selectionSet || update.docChanged || update.viewportChanged) {
        requestAnimationFrame(() => this.sync());
      }
    }
    sync() {
      const sel = this.view.state.selection.main;
      const isEditingAnyCell = document.activeElement?.closest('.cm-table-cell-editor');

      this.view.dom.querySelectorAll<HTMLElement & { __widget?: TablePreviewWidget }>('.cm-table-widget-container').forEach(container => {
        const from = parseInt(container.getAttribute('data-from') || '0');
        const to = parseInt(container.getAttribute('data-to') || '0');
        const table = container.querySelector('.cm-interactive-table');

        const isInside = !isEditingAnyCell && !sel.empty && sel.from < to && sel.to > from;

        table?.classList.toggle('is-selected', isInside);

        if (!isInside) {
          container.querySelectorAll('.cm-table-col-selected').forEach(el => el.classList.remove('cm-table-col-selected'));
          table?.classList.remove('has-selection');
          const widget = container.__widget;
          if (widget && widget.selectedColumn !== null) widget.selectedColumn = null;
        }
      });
    }
  }
);

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

export const chunkHighlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    if (!tr.docChanged && value !== Decoration.none) return value;

    const builder = new RangeSetBuilder<Decoration>();
    const docLength = tr.state.doc.length;
    const chunkSize = 512;
    const paletteSize = 7;

    for (let i = 0; i < docLength; i += chunkSize) {
      const from = i;
      const to = Math.min(i + chunkSize, docLength);
      const chunkIndex = Math.floor(i / chunkSize);
      const colorIndex = chunkIndex % paletteSize;

      builder.add(
        from,
        to,
        Decoration.mark({
          class: `cm-chunk-${colorIndex}`,
          attributes: { 'data-chunk': chunkIndex.toString() },
        })
      );
    }
    return builder.finish();
  },
  provide: f =>
    EditorView.decorations.compute([f, chunkModeFacet], state => {
      const active = state.facet(chunkModeFacet);
      return active ? state.field(f) : Decoration.none;
    }),
});
