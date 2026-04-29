import { Decoration, EditorView, RangeSet, StateField } from '@uiw/react-codemirror';
import { setViewportLinesEffect, viewportLinesField, dragStatusField, toggleSourceMode } from '.';
import { buildFenceDecorations } from '../decorations/fence-code';

export const fenceCodeHeightCache = new Map<string, number>();

export const fenceLivePreviewField = StateField.define<RangeSet<Decoration>>({
  create(state) {
    const vLines = state.field(viewportLinesField);
    return buildFenceDecorations(state, vLines.from, vLines.to);
  },

  update(decos, tr) {
    const isDragging = tr.state.field(dragStatusField);
    const wasDragging = tr.startState.field(dragStatusField);
    const dragJustEnded = wasDragging && !isDragging;

    const docChanged = tr.docChanged || tr.reconfigured || tr.effects.some(e => e.is(toggleSourceMode));
    const selectionChanged = !tr.startState.selection.eq(tr.state.selection);
    const viewportChanged = tr.effects.some(e => e.is(setViewportLinesEffect));
    const vLines = tr.state.field(viewportLinesField);

    if (dragJustEnded) return buildFenceDecorations(tr.state, vLines.from, vLines.to);
    if (isDragging) return decos.map(tr.changes);
    if (docChanged || viewportChanged || selectionChanged) return buildFenceDecorations(tr.state, vLines.from, vLines.to);

    return decos.map(tr.changes);
  },

  provide: f => EditorView.decorations.from(f),
});
