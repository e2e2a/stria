import { Decoration, EditorState, EditorView, RangeSet, StateEffect, StateField, ViewPlugin, ViewUpdate } from '@uiw/react-codemirror';
import { buildTableDecorations } from '../decorations/table';
import { TablePreviewWidget } from '../widgets/table';
import { sourceModeField } from '.';

export const tableHeightCache = new Map<string, number>();
export const tableLivePreviewField = StateField.define<RangeSet<Decoration>>({
  create() {
    return RangeSet.empty;
  },

  update(decos, tr) {
    const oldViewMode = tr.startState.facet(EditorState.readOnly);
    const newViewMode = tr.state.facet(EditorState.readOnly);

    const oldSourceMode = tr.startState.field(sourceModeField, false);
    const newSourceMode = tr.state.field(sourceModeField, false);

    const modeToggled = oldViewMode !== newViewMode || oldSourceMode !== newSourceMode;
    decos = decos.map(tr.changes);

    if (!tr.docChanged && !modeToggled) return decos;
    if (modeToggled && !tr.docChanged) {
      console.log('viewModeToggled', modeToggled);
      const allNewDecos = buildTableDecorations(tr.state, 1, tr.state.doc.lines);
      return RangeSet.of(allNewDecos, true);
    }
    let minFrom = Infinity;
    let maxTo = -Infinity;

    tr.changes.iterChanges((fromA, toA, fromB, toB) => {
      minFrom = Math.min(minFrom, fromB);
      maxTo = Math.max(maxTo, toB);
    });

    if (minFrom === Infinity) return decos;

    const doc = tr.state.doc;
    const fromLine = Math.max(1, doc.lineAt(minFrom).number);
    const toLine = Math.min(doc.lines, doc.lineAt(maxTo).number);

    const updateFrom = doc.line(fromLine).from;
    const updateTo = doc.line(toLine).to;

    const newDecos = buildTableDecorations(tr.state, fromLine, toLine);

    return decos.update({
      filterFrom: updateFrom,
      filterTo: updateTo,
      filter: () => false,
      add: newDecos,
      sort: true,
    });
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

export const scrollStabilityPlugin = ViewPlugin.fromClass(
  class {
    private view: EditorView;
    private pending = false;

    constructor(view: EditorView) {
      this.view = view;
    }

    update(update: ViewUpdate) {
      const oldSource = update.startState.field(sourceModeField, false);
      const newSource = update.state.field(sourceModeField, false);

      if (oldSource === newSource) return;

      this.pending = true;

      // 1. immediately freeze layout changes
      this.view.dom.style.pointerEvents = 'none';
      this.view.dom.style.visibility = 'hidden';

      requestAnimationFrame(() => {
        // 2. let CM settle layout first
        this.view.requestMeasure();

        requestAnimationFrame(() => {
          // 3. re-enable interaction AFTER layout stabilizes
          this.view.dom.style.visibility = '';
          this.view.dom.style.pointerEvents = '';
          this.pending = false;
        });
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
