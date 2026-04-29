import { Range as StateRange, Decoration, EditorState, RangeSet } from '@uiw/react-codemirror';
import { chunkModeFacet, sourceModeField } from '../plugins';
import { FenchCodeWidget } from '../widgets/fence-code';

export function buildFenceDecorations(state: EditorState, from: number, to: number): RangeSet<Decoration> {
  from = Math.max(1, Math.min(from, state.doc.lines));
  to = Math.max(1, Math.min(to, state.doc.lines));
  const allDecos: StateRange<Decoration>[] = [];
  const activeLineNum = state.doc.lineAt(state.selection.main.head).number;

  let logicStart = from;
  let inFence = false;
  let lastFenceStartLine = -1;

  for (let i = 1; i <= from; i++) {
    const text = state.doc.line(i).text;

    if (text.startsWith('```')) {
      if (!inFence) {
        inFence = true;
        lastFenceStartLine = i;
      } else {
        // It's a closing root fence
        inFence = false;
        lastFenceStartLine = -1;
      }
    }
  }

  if (inFence && lastFenceStartLine !== -1) {
    logicStart = lastFenceStartLine;
  }

  const BUFFER = 10;
  const endLine = Math.min(state.doc.lines, to + BUFFER);

  for (let i = logicStart; i <= endLine; i++) {
    const line = state.doc.line(i);
    const text = line.text;

    if (text.trim() === '') continue;

    if (!text.startsWith('```')) continue;

    const fence = getFenceDecos(state, i, activeLineNum) ?? null;
    if (!fence) continue;

    if (fence.skipToLine >= from) {
      allDecos.push(...fence.decos);
    }

    i = fence.skipToLine;
  }

  return RangeSet.of(
    allDecos.sort((a, b) => a.from - b.from),
    true
  );
}

function isRangeSelected(state: EditorState, from: number, to: number): boolean {
  const sel = state.selection.main;
  if (sel.empty) return false;
  return sel.from <= to && sel.to >= from;
}

export function getFenceDecos(state: EditorState, lineNum: number, activeLineNum: number) {
  const line = state.doc.line(lineNum);
  const text = line.text;

  if (!text.startsWith('```')) return null;

  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

  let closingLine = lineNum;
  const content = [];

  for (let j = lineNum + 1; j <= state.doc.lines; j++) {
    const nextLine = state.doc.line(j);

    if (nextLine.text === '```') {
      closingLine = j;
      break;
    }
    content.push(nextLine.text);
  }

  const isBlockActive = activeLineNum >= lineNum && activeLineNum <= closingLine;
  const isSelected = isRangeSelected(state, line.from, state.doc.line(closingLine).to);

  const language = text.slice(3).trim();

  if (!sourceMode) {
    decos.push(
      Decoration.widget({
        widget: new FenchCodeWidget(language, content.join('\n')),
        side: -1,
      }).range(line.from)
    );
  }

  decos.push(Decoration.line({ attributes: { class: 'cm-code-block-fence cm-code-block-start' } }).range(line.from));
  if (viewMode || (!isBlockActive && !isSelected && !sourceMode && !isChunkMode)) {
    decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(line.from, line.to));
  }

  for (let m = lineNum + 1; m < closingLine; m++) {
    decos.push(Decoration.line({ attributes: { class: 'cm-code-block-line' } }).range(state.doc.line(m).from));
  }

  if (closingLine > lineNum) {
    const lastLine = state.doc.line(closingLine);
    decos.push(Decoration.line({ attributes: { class: 'cm-code-block-fence cm-code-block-end' } }).range(lastLine.from));
    if (viewMode || (!isBlockActive && !isSelected && !sourceMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(lastLine.from, lastLine.to));
    }
  }

  return { decos, skipToLine: closingLine };
}
