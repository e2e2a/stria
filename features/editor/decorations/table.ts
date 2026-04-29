import { Decoration, EditorState, Range } from '@uiw/react-codemirror';
import { getTableDecos } from '.';
import { getFenceDecos } from './fence-code';

export function buildTableDecorations(state: EditorState, fromLine: number, toLine: number): Range<Decoration>[] {
  const result: Range<Decoration>[] = [];
  const activeLineNum = state.doc.lineAt(state.selection.main.head).number;
  for (let i = fromLine; i <= toLine; i++) {
    const line = state.doc.line(i);
    const text = line.text;
    // If the start of the line is inside a code block, skip entirely.
    if (text.trim() === '') continue;

    // 1. Check for a code block first. If found, jump over it entirely.
    const fence = getFenceDecos(state, i, activeLineNum) ?? null;
    if (fence) {
      i = fence.skipToLine;
      continue;
    }

    const table = getTableDecos(state, i);

    if (table) {
      result.push(...table.decos);

      i = table.skipToLine;
    }
  }

  return result;
}
