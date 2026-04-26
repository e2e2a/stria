import { Decoration, EditorState, Range } from '@uiw/react-codemirror';
import { getTableDecos } from '.';

export function buildTableDecorations(state: EditorState, fromLine: number, toLine: number): Range<Decoration>[] {
  const result: Range<Decoration>[] = [];
  for (let i = fromLine; i <= toLine; i++) {
    const table = getTableDecos(state, i);

    if (table) {
      result.push(...table.decos);

      i = table.skipToLine;
    }
  }

  return result;
}
