import { EditorView, Decoration, ViewPlugin, ViewUpdate, DecorationSet } from '@codemirror/view';
import { Range as StateRange, StateField, RangeSet, EditorState, StateEffect, RangeSetBuilder, Facet } from '@codemirror/state';
import { buildDecorations } from '../decorations';
import { TablePreviewWidget } from '../widgets';

// The Effect: The message sent when scrolling/resizing happens
export const setViewportLinesEffect = StateEffect.define<{ from: number; to: number }>();

// The Field: The permanent storage in the State for these line numbers
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
      // Only act if the viewport actually shifted or the doc changed
      if (update.viewportChanged || update.docChanged) {
        const state = update.state;
        const view = update.view;

        // Calculate the lines
        const fromLine = state.doc.lineAt(view.viewport.from).number;
        const toLine = state.doc.lineAt(view.viewport.to).number;

        // FIX: Use requestAnimationFrame to defer the dispatch
        // until the current update cycle is complete.
        requestAnimationFrame(() => {
          // Double check the view hasn't been destroyed in the meantime
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

  // We use a shared "reset" function for all ways a drag can end
  const onRelease = () => {
    if (view.state.field(dragStatusField)) {
      view.dispatch({
        effects: [setDraggingEffect.of(false)],
      });
    }
  };

  view.dom.addEventListener('mousedown', onMouseDown);

  // 1. Normal mouse release
  window.addEventListener('mouseup', onRelease);

  // 2. Browser native drag release (Crucial for bottom-to-top)
  window.addEventListener('dragend', onRelease);

  // 3. Fallback for when a drop occurs
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

    if (dragJustEnded) {
      console.log('[deco] selection drag ended → full rebuild');
      return buildDecorations(tr.state, vLines.from, vLines.to);
    }

    if (isDragging) return decos.map(tr.changes);

    if (docChanged || rebuildEffect || viewportChanged || selectionChanged) return buildDecorations(tr.state, vLines.from, vLines.to);
    // if (tr.docChanged || tr.selection || tr.reconfigured || tr.effects.some(e => e.is(toggleSourceMode))) {
    //   return buildDecorations(tr.state);
    // }
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
  return ViewPlugin.fromClass(
    class {
      update(update: ViewUpdate) {
        if (update.docChanged) {
          const text = update.state.doc.toString();
          const wordEl = document.getElementById(`cm-word-count-${nodeId}`);
          const charEl = document.getElementById(`cm-char-count-${nodeId}`);

          if (wordEl) wordEl.textContent = (text.trim() ? text.trim().split(/\s+/).length : 0).toString();
          if (charEl) charEl.textContent = text.length.toString();
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
