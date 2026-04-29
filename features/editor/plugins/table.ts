import { Decoration, EditorState, EditorView, RangeSet, StateEffect, StateField, ViewPlugin, ViewUpdate } from '@uiw/react-codemirror';
import { buildTableDecorations } from '../decorations/table';
import { TablePreviewWidget } from '../widgets/table';
import { setViewportLinesEffect, sourceModeField, viewportLinesField } from '.';

export const tableHeightCache = new Map<string, number>();

export const tableLivePreviewField = StateField.define<RangeSet<Decoration>>({
  create(state) {
    const sourceMode = state.field(sourceModeField, false);
    if (sourceMode) return RangeSet.empty;
    const vLines = state.field(viewportLinesField);
    return RangeSet.of(buildTableDecorations(state, vLines.from, vLines.to), true);
  },

  update(decos, tr) {
    const oldSourceMode = tr.startState.field(sourceModeField, false);
    const newSourceMode = tr.state.field(sourceModeField, false);
    const modeToggled = oldSourceMode !== newSourceMode;
    const oldViewMode = tr.startState.facet(EditorState.readOnly);
    const newViewMode = tr.state.facet(EditorState.readOnly);
    const viewModeToggled = oldViewMode !== newViewMode;

    const viewportChanged = tr.effects.some(e => e.is(setViewportLinesEffect));
    const vLines = tr.state.field(viewportLinesField);

    const sourceMode = tr.state.field(sourceModeField, false);

    const from = Math.max(1, vLines.from - 250);
    const to = Math.min(tr.state.doc.lines, vLines.to + 250);

    if (modeToggled || viewModeToggled) {
      if (sourceMode) return RangeSet.empty;
      return RangeSet.of(buildTableDecorations(tr.state, from, to), true);
    }

    if (tr.docChanged || viewportChanged) {
      if (sourceMode) return RangeSet.empty;
      return RangeSet.of(buildTableDecorations(tr.state, from, to), true);
    }

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
        // requestAnimationFrame(() => this.sync());
        // Promise.resolve().then(() => this.sync());
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
