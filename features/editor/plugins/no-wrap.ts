import { Range, Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@uiw/react-codemirror';

const wrapLineClass = Decoration.line({ class: 'cm-wrap-line' });

function isTableLine(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '|') return true;
    if (c !== ' ' && c !== '\t') return false;
  }
  return false;
}

function buildDecorations(view: EditorView): DecorationSet {
  const builder: Range<Decoration>[] = [];
  const { from, to } = view.viewport;
  const doc = view.state.doc;

  let pos = from;
  while (pos <= to) {
    const line = doc.lineAt(pos);
    if (!isTableLine(line.text)) {
      builder.push(wrapLineClass.range(line.from));
    }
    pos = line.to + 1;
  }

  return Decoration.set(builder, true);
}

export const selectiveWrapPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    private lastFrom = -1;
    private lastTo = -1;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
      this.lastFrom = view.viewport.from;
      this.lastTo = view.viewport.to;
    }

    update(update: ViewUpdate) {
      const { from, to } = update.view.viewport;

      const viewportMoved = from !== this.lastFrom || to !== this.lastTo;

      if (!update.docChanged && !viewportMoved) return;

      this.decorations = buildDecorations(update.view);
      this.lastFrom = from;
      this.lastTo = to;
    }
  },
  { decorations: v => v.decorations }
);
