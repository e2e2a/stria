import { EditorView, Decoration, ViewPlugin, ViewUpdate, DecorationSet } from '@codemirror/view';
import {
  Range as StateRange,
  StateField,
  RangeSet,
  EditorState,
  StateEffect,
  RangeSetBuilder,
  Facet,
  Transaction,
  Line,
  SelectionRange,
  EditorSelection,
} from '@codemirror/state';
import {
  buildDecorations,
  buildLineDecos,
  getBlockquoteDecos,
  getBoldDecos,
  getBulletListDecos,
  getCalloutDecos,
  getFenceDecos,
  getFrontmatterDecos,
  getHeadingDecos,
  getHighlightDecos,
  getHRDecos,
  getImageDecos,
  getInlineCodeDecos,
  getInlineMathDecos,
  getInternalLinkDecos,
  getItalicDecos,
  getLinkDecos,
  getMathBlockDecos,
  getMermaidDecos,
  getNumberedListDecos,
  getStrikethroughDecos,
  getTableDecos,
  getTagDecos,
  getTaskDecos,
  makeCtx,
  updateActiveLine,
  updateChangedLines,
} from '../decorations';
import { TablePreviewWidget } from '../widgets';
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

// ─── The field ────────────────────────────────────────────────────────────────
export const markdownLivePreviewField = StateField.define<RangeSet<Decoration>>({
  create(state) {
    if (state.field(sourceModeField, false)) return RangeSet.empty;
    return buildDecorations(state);
  },

  update(decos, tr) {
    const rebuildEffect = tr.effects.some(e => e.is(rebuildDecorationsEffect));
    const sourceToggled = tr.effects.some(e => e.is(toggleSourceMode));
    const isDragging = tr.state.field(dragStatusField);
    const wasDragging = tr.startState.field(dragStatusField);
    const dragJustEnded = wasDragging && !isDragging;

    if (tr.reconfigured || sourceToggled || rebuildEffect) {
      console.log('a');
      return buildDecorations(tr.state);
    }

    if (tr.docChanged) {
      console.log('b');
      return updateChangedLines(decos.map(tr.changes), tr);
    }

    if (dragJustEnded) {
      // Only rebuild the whole doc if the user actually selected a range of text.
      // This ensures complex markdown blocks (fences/tables) are perfectly drawn.
      if (!tr.state.selection.main.empty) {
        console.log('[deco] selection drag ended → full rebuild');
        return buildDecorations(tr.state);
      }
      // If the selection is empty, it's just a click.
      // We do NOTHING here and let the "selectionChanged" block below
      // handle it surgically via updateActiveLine.
    }
    console.log('isDragging', isDragging);
    if (isDragging) {
      if (!tr.state.selection.main.empty) {
        console.log('qweqweqwe');
        return decos.map(tr.changes);
      }
    }

    const prevSel = tr.startState.selection.main;
    const nextSel = tr.state.selection.main;
    const selectionChanged = !prevSel.eq(nextSel);

    if (selectionChanged) {
      // console.log('running selection', tr.state.selection);
      return updateActiveLine(decos, tr);
    }

    return decos;
  },

  provide: f => EditorView.decorations.from(f),
});
// ------------------------------
// Main StateField
// ------------------------------
// export const markdownLivePreviewField = StateField.define<RangeSet<Decoration>>({
//   create(state: EditorState) {
//     if (state.field(sourceModeField, false)) {
//       return RangeSet.empty;
//     }
//     return buildDecorations(state);
//   },
//   update(decos, tr) {
//     const isDragging = tr.state.field(dragStatusField); // Get local status
//     const rebuildEffect = tr.effects.some(e => e.is(rebuildDecorationsEffect));
//     const docChanged = tr.docChanged || tr.reconfigured || tr.effects.some(e => e.is(toggleSourceMode));
//     const selectionChanged = !tr.startState.selection.eq(tr.state.selection);

//     // This is now "Old Style" logic but perfectly isolated to this tab
//     if (docChanged || rebuildEffect || (selectionChanged && !isDragging)) {
//       return buildDecorations(tr.state);
//     }
//     // if (tr.docChanged || tr.selection || tr.reconfigured || tr.effects.some(e => e.is(toggleSourceMode))) {
//     //   return buildDecorations(tr.state);
//     // }
//     return decos.map(tr.changes);
//   },
//   provide: f => EditorView.decorations.from(f),
// });

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
