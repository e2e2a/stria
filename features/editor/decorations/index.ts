import { Decoration } from '@codemirror/view';
import { Range as StateRange, EditorState, RangeSet } from '@codemirror/state';
import {
  BulletWidget,
  CalloutWidget,
  CheckboxWidget,
  FenchCodeWidget,
  ImageWidget,
  InlineMathWidget,
  MathWidget,
  TablePreviewWidget,
} from '@/features/editor/widgets';
import { getTableRange, isValidTable } from '@/lib/client/markdown/markdown-table-utils';
import { MermaidWidget } from '../widgets/mermaid-widget';
import { sourceModeField } from '../plugins';

function isRangeSelected(state: EditorState, from: number, to: number): boolean {
  const sel = state.selection.main;
  return sel.from <= to && sel.to >= from;
}

export function getMathSyntaxHighlighting(text: string, startPos: number): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];

  // Regex for different LaTeX parts
  const tokens = [
    { regex: /\\[a-zA-Z]+/g, cls: 'cm-math-command' }, // \sum, \frac
    { regex: /[{}]/g, cls: 'cm-math-bracket' }, // { }
    { regex: /[0-9]+/g, cls: 'cm-math-number' }, // 1, 2, n
    { regex: /[=+-\/*^_]/g, cls: 'cm-math-operator' }, // =, +, ^, _
  ];

  for (const token of tokens) {
    let match;
    while ((match = token.regex.exec(text)) !== null) {
      decos.push(Decoration.mark({ class: token.cls }).range(startPos + match.index, startPos + match.index + match[0].length));
    }
  }
  return decos;
}

export function getHeadingDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const match = text.match(/^(#{1,6})\s/);

  if (match) {
    const level = match[1].length;
    decos.push(Decoration.line({ attributes: { class: `cm-h${level}` } }).range(lineFrom));
    const lineTo = lineFrom + text.length;
    const isSelected = isRangeSelected(state, lineFrom, lineTo);
    const shouldShowSyntax = isLineActive || isSelected || sourceMode;

    if (viewMode || !shouldShowSyntax) decos.push(Decoration.replace({}).range(lineFrom, lineFrom + match[0].length));
  }
  return decos;
}

export function getBoldDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;

    decos.push(Decoration.mark({ class: 'cm-bold-text' }).range(start, end));
    const isSelected = isRangeSelected(state, start, end);
    if (viewMode || (!isLineActive && !isSelected && !sourceMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, start + 2));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(end - 2, end));
    }
  }
  return decos;
}

export function getInlineCodeDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const codeRegex = /`([^`]+)`/g;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;
    const contentStart = start + 1;
    const contentEnd = end - 1;

    decos.push(Decoration.mark({ class: 'cm-inline-code' }).range(start, end));
    const isSelected = isRangeSelected(state, start, end);
    if (viewMode || (!isLineActive && !isSelected && !sourceMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, contentStart));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(contentEnd, end));
    }
  }
  return decos;
}

export function getItalicDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const italicRegex = /(^|[^*_])([*_])([^*_]+)\2/g;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  let match;

  while ((match = italicRegex.exec(text)) !== null) {
    const start = lineFrom + match.index + match[1].length;
    const end = start + match[0].length - match[1].length;
    decos.push(
      Decoration.line({
        gutterAttributes: { class: 'cm-hide-fold' }, // <--- THIS kills the click/visibility
      }).range(start)
    );
    decos.push(Decoration.mark({ class: 'cm-italic-text' }).range(start, end));
    const isSelected = isRangeSelected(state, start, end);
    if (viewMode || (!isLineActive && !isSelected && !sourceMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, start + 1));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(end - 1, end));
    }
  }

  return decos;
}

export function getBulletListDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const match = text.match(/^(\s*)([-*+])(\s+)/);
  // if its - [ ] or - [x] return this decoration
  if (/^\s*- \[( |x|X)\]\s/.test(text)) return decos;
  if (match) {
    const indent = match[1].length;
    const markerStart = lineFrom + indent;
    const markerEnd = markerStart + match[2].length;
    const isSelected = isRangeSelected(state, markerStart, markerEnd);

    if (viewMode || (!isLineActive && !isSelected && !sourceMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(markerStart, markerEnd));

      decos.push(
        Decoration.widget({
          widget: new BulletWidget(),
          side: 1,
        }).range(markerStart)
      );
    }
  }

  return decos;
}

export function getNumberedListDecos(text: string, lineFrom: number): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const match = text.match(/^(\d+\.\s+)/);

  if (match) {
    const prefixLength = match[0].length;
    decos.push(
      Decoration.mark({
        class: 'cm-list-number',
      }).range(lineFrom, lineFrom + prefixLength)
    );
  }

  return decos;
}

export function getFenceDecos(state: EditorState, activeLineNum: number): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  let isInsideBlock = false;
  let blockStartLine = -1;

  for (let i = 1; i <= state.doc.lines; i++) {
    const line = state.doc.line(i);
    const text = line.text;
    const trimmedText = text.trim();

    if (trimmedText.startsWith('```')) {
      const isOpening = !isInsideBlock;

      if (isOpening) {
        blockStartLine = i;

        let searchIndex = 0;
        let foundAny = false;

        while (searchIndex < text.length) {
          const openingIndex = text.indexOf('```', searchIndex);
          if (openingIndex === -1) break;

          const closingIndex = text.indexOf('```', openingIndex + 3);
          if (closingIndex === -1) break;

          foundAny = true;

          const isBlockActive = activeLineNum === i;
          const isSelected = isRangeSelected(state, line.from, line.to);
          const sourceMode = state.field(sourceModeField, false);
          const viewMode = state.facet(EditorState.readOnly);

          const openingStart = line.from + openingIndex;
          const openingEnd = openingStart + 3;
          const closingStart = line.from + closingIndex;
          const closingEnd = closingStart + 3;
          const contentStart = openingEnd;
          const contentEnd = closingStart;

          if (viewMode || (!isBlockActive && !isSelected && !sourceMode)) {
            decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(openingStart, openingEnd));
            decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(closingStart, closingEnd));

            decos.push(
              Decoration.mark({
                class: 'cm-fenced-inline-code',
              }).range(contentStart, contentEnd)
            );
          } else {
            decos.push(Decoration.mark({ class: 'cm-code-fence-marker' }).range(openingStart, openingEnd));
            decos.push(Decoration.mark({ class: 'cm-code-fence-marker' }).range(closingStart, closingEnd));
          }

          searchIndex = closingIndex + 3;
        }

        if (foundAny) {
          continue; // Skip to next line since we handled all blocks on this line
        }

        const content = [];
        let closingLine = i;

        for (let j = i + 1; j <= state.doc.lines; j++) {
          const nextLine = state.doc.line(j);
          if (nextLine.text.trim().startsWith('```')) {
            closingLine = j;
            break;
          }
          content.push(nextLine.text);
        }

        const language = trimmedText.slice(3).trim();
        const isBlockActive = activeLineNum >= i && activeLineNum <= closingLine;

        decos.push(
          Decoration.widget({
            widget: new FenchCodeWidget(language, content.join('\n')),
            side: -1,
            block: false,
          }).range(line.from)
        );

        decos.push(
          Decoration.line({
            attributes: { class: 'cm-code-block-fence cm-code-block-start' },
          }).range(line.from)
        );

        const isSelected = isRangeSelected(state, line.from, state.doc.line(closingLine).to);
        const sourceMode = state.field(sourceModeField, false);
        const viewMode = state.facet(EditorState.readOnly);

        if (viewMode || (!isBlockActive && !isSelected && !sourceMode)) {
          decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(line.from, line.to));
        }

        isInsideBlock = true;
        continue;
      } else {
        decos.push(
          Decoration.line({
            attributes: { class: 'cm-code-block-fence cm-code-block-end' },
          }).range(line.from)
        );

        const isBlockActive = activeLineNum >= blockStartLine && activeLineNum <= i;
        const isSelected = isRangeSelected(state, state.doc.line(blockStartLine).from, line.to);
        const sourceMode = state.field(sourceModeField, false);
        const viewMode = state.facet(EditorState.readOnly);

        if (viewMode || (!isBlockActive && !isSelected && !sourceMode)) {
          decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(line.from, line.to));
        }

        isInsideBlock = false;
        continue;
      }
    }

    if (isInsideBlock) {
      decos.push(
        Decoration.line({
          attributes: { class: 'cm-code-block-line' },
        }).range(line.from)
      );
    }
  }

  return decos;
}
export function getTableDecos(state: EditorState, startLine: number) {
  const line = state.doc.line(startLine);
  if (!line.text.trim().startsWith('|')) return null;
  if (startLine < state.doc.lines) {
    const nextLineText = state.doc.line(startLine + 1).text.trim();
    const isNextLineSeparator = /^\|?([\s-]*:?---+:?[\s-]*\|?)+$/.test(nextLineText);

    if (!isNextLineSeparator) return null;
  } else {
    return null;
  }
  const range = getTableRange(state, startLine);
  const from = state.doc.line(range.start).from;
  const to = state.doc.line(range.end).to;

  const lines = [];
  for (let i = range.start; i <= range.end; i++) lines.push(state.doc.line(i).text);

  if (!isValidTable(lines)) return { decos: [], skipToLine: range.end };
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  if (!viewMode && sourceMode) return { decos: [], skipToLine: range.end };
  return {
    decos: [
      Decoration.replace({
        widget: new TablePreviewWidget(lines.join('\n'), from, to, viewMode),
        block: true,
        atomic: false,
        side: -1,
      }).range(from, to),
    ],
    skipToLine: range.end,
  };
}

export function getBlockquoteDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const match = text.match(/^(\s{0,3})(>+)\s?/);

  if (!match) return decos;

  const indent = match[1].length;
  const markers = match[2].length;

  const markerStart = lineFrom + indent;
  const markerEnd = markerStart + markers;

  decos.push(
    Decoration.line({
      attributes: { class: 'cm-blockquote' },
    }).range(lineFrom)
  );
  const isSelected = isRangeSelected(state, markerStart, markerEnd);
  if (viewMode || (!isLineActive && !isSelected && !sourceMode)) decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(markerStart, markerEnd));

  return decos;
}

export function getCalloutDecos(state: EditorState, startLine: number, activeLineNum: number) {
  const doc = state.doc;
  const firstLine = doc.line(startLine);

  const match = firstLine.text.match(/^(\s{0,3})>\s?\[!(\w+)\]/);
  if (!match) return null;

  let endLine = startLine;
  for (let i = startLine + 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    if (!line.text.trim().startsWith('>')) break;
    endLine = i;
  }
  const blockFrom = doc.line(startLine).from;
  const blockTo = doc.line(endLine).to;

  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isBlockActive = activeLineNum >= startLine && activeLineNum <= endLine;
  const isSelected = isRangeSelected(state, blockFrom, blockTo);

  if (!viewMode && (isBlockActive || isSelected || sourceMode)) {
    return null;
  }

  const lines: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    lines.push(doc.line(i).text);
  }

  return {
    decos: [
      Decoration.replace({
        widget: new CalloutWidget(match[2].toLowerCase(), lines.join('\n')),
        block: false,
        side: -1,
      }).range(blockFrom, blockTo),
    ],
    skipToLine: endLine,
  };
}

export function getHRDecos(state: EditorState, text: string, lineFrom: number, lineTo: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isHR = /^(\s{0,3})([-*_])(\s*\2){2,}\s*$/.test(text);

  if (isHR) {
    decos.push(Decoration.line({ attributes: { class: 'cm-hr' } }).range(lineFrom));
    const isSelected = isRangeSelected(state, lineFrom, lineTo);
    if (viewMode || (!isLineActive && !isSelected && !sourceMode)) decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(lineFrom, lineTo));
  }

  return decos;
}

export function getTaskDecos(state: EditorState, text: string, lineFrom: number): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];

  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);

  const match = text.match(/^(\s*)-\s\[([ xX])\](\s)/);
  if (!match) return decos;

  const indent = match[1].length;
  const isChecked = match[2].toLowerCase() === 'x';

  const start = lineFrom + indent;
  const end = start + match[0].trimStart().length - 1;
  if (sourceMode) return decos;
  const isSelected = isRangeSelected(state, start, end);
  if (isChecked) {
    decos.push(
      Decoration.line({
        attributes: { class: 'cm-task-completed' },
      }).range(lineFrom)
    );
  }
  if (viewMode || !isSelected) {
    decos.push(
      Decoration.replace({
        widget: new CheckboxWidget(isChecked, start, end),
        inclusive: false,
        block: false,
        side: 1,
      }).range(start, end)
    );
  }

  return decos;
}
export function getLinkDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);

  const linkStartRegex = /\[([^\]]+)\]\(/g;
  let match;

  while ((match = linkStartRegex.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const label = match[1];

    // MANUAL URL + OPTIONAL HEADING PARSER
    let i = match.index + match[0].length; // position after '('
    let parenCount = 1;
    while (i < text.length && parenCount > 0) {
      if (text[i] === '(') parenCount++;
      else if (text[i] === ')') parenCount--;
      i++;
    }

    // Extract content inside the parentheses
    const inside = text.slice(match.index + match[0].length, i - 1).trim();

    // Separate optional #heading
    let url = inside;
    let heading = '';
    const hashIndex = inside.indexOf('#');
    if (hashIndex >= 0) {
      url = inside.slice(0, hashIndex);
      heading = inside.slice(hashIndex); // includes #
    }

    // Full link for click handler
    const fullLink = `${url}${heading}`;

    const textStart = start + 1;
    const textEnd = textStart + label.length;
    const end = start + (i - match.index);

    decos.push(
      Decoration.mark({
        class: 'cm-link-text',
        attributes: { 'data-link': fullLink },
      }).range(textStart, textEnd)
    );

    const isSelected = isRangeSelected(state, start, end);
    if (viewMode || (!isLineActive && !isSelected && !sourceMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, textStart));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(textEnd, end));
    }
  }

  return decos;
}

export function getImageDecos(state: EditorState, text: string, lineFrom: number, lineTo: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  let match;

  while ((match = imageRegex.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;
    const isSelected = isRangeSelected(state, start, end);

    if (viewMode || (!isLineActive && !isSelected && !sourceMode)) {
      decos.push(
        Decoration.replace({
          widget: new ImageWidget(match[2], match[1], start),
          block: false,
          inclusive: false,
        }).range(start, end)
      );
    }
  }

  return decos;
}

export function getMermaidDecos(state: EditorState, activeLineNum: number): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const doc = state.doc;
  const selection = state.selection.main;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    if (line.text.trim().startsWith('```mermaid')) {
      const startLine = i;
      let endLine = i;
      const content = [];

      for (let j = i + 1; j <= doc.lines; j++) {
        const nextLine = doc.line(j);
        if (nextLine.text.trim().startsWith('```')) {
          endLine = j;
          break;
        }
        content.push(nextLine.text);
      }
      const blockFrom = doc.line(startLine).from;
      const blockTo = doc.line(endLine).to;
      const isBlockActive = activeLineNum >= startLine && activeLineNum <= endLine;
      const isSelected = !selection.empty && selection.from < blockTo && selection.to > blockFrom;
      if (viewMode || (!isBlockActive && !isSelected && !sourceMode)) {
        for (let k = startLine; k <= endLine; k++) {
          decos.push(
            Decoration.line({
              attributes: { class: 'cm-syntax-hide' },
            }).range(doc.line(k).from)
          );
        }

        decos.push(
          Decoration.widget({
            widget: new MermaidWidget(content.join('\n'), line.from),
            side: 1,
            block: true,
          }).range(doc.line(endLine).to)
        );
      }

      i = endLine; // Skip to next section
    }
  }
  return decos;
}

export function getTagDecos(text: string, lineFrom: number): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const tagRegex = /(^|\s)#([a-zA-Z][\w-]+)/g;
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    const tagName = match[2];
    const start = lineFrom + match.index + match[1].length;
    const end = start + match[0].length - match[1].length;

    decos.push(Decoration.mark({ class: 'cm-hashtag', attributes: { 'data-tag': `#${tagName}` } }).range(start, end));
  }

  return decos;
}

export function getStrikethroughDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const strikeRegex = /~~(.*?)~~/g;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  let match;

  while ((match = strikeRegex.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;

    decos.push(Decoration.mark({ class: 'cm-strikethrough-text' }).range(start, end));

    const isSelected = isRangeSelected(state, start, end);
    if (viewMode || (!isLineActive && !isSelected && !sourceMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, start + 2));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(end - 2, end));
    }
  }
  return decos;
}

export function getHighlightDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const highRegex = /==(.*?)==/g;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  let match;

  while ((match = highRegex.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;

    decos.push(Decoration.mark({ class: 'cm-highlight-text' }).range(start, end));

    const isSelected = isRangeSelected(state, start, end);
    if (viewMode || (!isLineActive && !isSelected && !sourceMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, start + 2));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(end - 2, end));
    }
  }
  return decos;
}

export function getInlineMathDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const mathRegex = /\$(?:`([^`]+)`|([^$]+))\$/g;

  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  let match;

  while ((match = mathRegex.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;

    const isBacktick = !!match[1];
    const content = (match[1] || match[2] || '').trim();

    const isSelected = isRangeSelected(state, start, end);

    if (viewMode || (!isLineActive && !isSelected && !sourceMode)) {
      decos.push(
        Decoration.replace({
          widget: new InlineMathWidget(content, start),
          side: 0,
        }).range(start, end)
      );
    } else {
      const openMarkerEnd = isBacktick ? start + 2 : start + 1;
      decos.push(Decoration.mark({ class: 'cm-math-marker' }).range(start, openMarkerEnd));

      decos.push(...getMathSyntaxHighlighting(content, openMarkerEnd));

      const closeMarkerStart = isBacktick ? end - 2 : end - 1;
      decos.push(Decoration.mark({ class: 'cm-math-marker' }).range(closeMarkerStart, end));
    }
  }
  return decos;
}
export function getMathBlockDecos(state: EditorState, activeLineNum: number): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];
  const doc = state.doc;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text.trim();

    if (text.startsWith('$$')) {
      const startLine = i;
      let endLine = -1;
      let content = '';

      const secondIndex = line.text.indexOf('$$', 2);
      if (secondIndex !== -1) {
        endLine = i;
        content = line.text.slice(2, secondIndex).trim();
      } else {
        const linesCollected = [];
        const firstLineTrailing = line.text.slice(2).trim();
        if (firstLineTrailing) linesCollected.push(firstLineTrailing);

        for (let j = i + 1; j <= doc.lines; j++) {
          const nextLine = doc.line(j);
          if (nextLine.text.trim().startsWith('$$')) {
            endLine = j;
            const lastLineLeading = nextLine.text.trim().replace('$$', '').trim();
            if (lastLineLeading) linesCollected.push(lastLineLeading);
            break;
          }
          linesCollected.push(nextLine.text);
        }
        content = linesCollected.join('\n');
      }

      if (endLine !== -1) {
        const blockFrom = doc.line(startLine).from;
        const blockTo = doc.line(endLine).to;
        const isBlockActive = activeLineNum >= startLine && activeLineNum <= endLine;
        const isSelected = isRangeSelected(state, blockFrom, blockTo);

        if (viewMode || (!isBlockActive && !isSelected && !sourceMode)) {
          for (let k = startLine; k <= endLine; k++) {
            decos.push(Decoration.line({ attributes: { class: 'cm-hidden-line' } }).range(doc.line(k).from));
          }
          decos.push(
            Decoration.widget({
              widget: new MathWidget(content, blockFrom),
              side: 1,
              block: true,
            }).range(blockTo)
          );
        } else {
          for (let k = startLine; k <= endLine; k++) {
            const l = doc.line(k);
            if (l.text.includes('$$')) {
              const idx = l.text.indexOf('$$');
              decos.push(Decoration.mark({ class: 'cm-math-marker' }).range(l.from + idx, l.from + idx + 2));
              if (k === startLine && endLine === startLine) {
                const innerText = l.text.slice(idx + 2, l.text.lastIndexOf('$$'));
                decos.push(...getMathSyntaxHighlighting(innerText, l.from + idx + 2));
                const lastIdx = l.text.lastIndexOf('$$');
                decos.push(Decoration.mark({ class: 'cm-math-marker' }).range(l.from + lastIdx, l.from + lastIdx + 2));
              }
            } else {
              decos.push(...getMathSyntaxHighlighting(l.text, l.from));
            }
          }
        }
        i = endLine;
      }
    }
  }
  return decos;
}

export function getInternalLinkDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  const decos: StateRange<Decoration>[] = [];

  // Regex: Group 1 = Path/Heading, Group 2 = Alias
  const wikiRegex = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;

  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const selection = state.selection.main;

  let match;
  while ((match = wikiRegex.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;

    const fullLink = match[1]; // e.g., "#Introduction" or "Note#Conclusion"
    const displayText = match[2]; // e.g., "Alias"

    const isCursorInside = selection.from >= start && selection.to <= end;
    const shouldHide = viewMode || (!isLineActive && !isCursorInside && !sourceMode);

    const linkAttrs = { 'data-link': fullLink };

    if (!shouldHide) {
      // MODE: EDITING - Show raw syntax, disable click handler
      decos.push(Decoration.mark({ class: 'cm-link-source-editing' }).range(start, end));
    } else {
      // MODE: DECORATED - Apply "Obsidian-style" hiding

      if (displayText) {
        /**
         * CASE 1: Alias exists [[Path#Heading|Alias]]
         * Result: "Alias" (Everything else hidden)
         */
        const aliasStartPos = end - 2 - displayText.length;
        decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, aliasStartPos));

        if (end - 2 > aliasStartPos) {
          decos.push(
            Decoration.mark({
              class: 'cm-internal-link',
              attributes: linkAttrs,
            }).range(aliasStartPos, end - 2)
          );
        }
        decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(end - 2, end));
      } else if (fullLink.startsWith('#')) {
        /**
         * CASE 2: Internal Heading Only [[#Introduction]]
         * Result: "Introduction" (Hides [[, ]], and #)
         */
        // Hide [[ and the # symbol (start to start + 3)
        decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, start + 3));

        // Show "Introduction"
        if (end - 2 > start + 3) {
          decos.push(
            Decoration.mark({
              class: 'cm-internal-link',
              attributes: linkAttrs,
            }).range(start + 3, end - 2)
          );
        }

        // Hide ]]
        decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(end - 2, end));
      } else {
        /**
         * CASE 3: Standard Link or Heading with File [[Note#Conclusion]]
         * Result: "Note#Conclusion" (Hides only [[ and ]])
         */
        const lastSlashIndex = fullLink.lastIndexOf('/');
        decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, start + 2));
        if (lastSlashIndex !== -1) {
          // Hide [[ AND the directory path including the slash
          const pathEnd = start + 2 + lastSlashIndex + 1;
          decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, pathEnd));

          // Show only the filename
          decos.push(Decoration.mark({ class: 'cm-internal-link', attributes: linkAttrs }).range(pathEnd, end - 2));
        } else {
          // No slash found, just hide [[ and ]]
          decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, start + 2));
          decos.push(Decoration.mark({ class: 'cm-internal-link', attributes: linkAttrs }).range(start + 2, end - 2));
        }

        decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(end - 2, end));
      }
    }
  }
  return decos;
}
export function buildDecorations(state: EditorState): RangeSet<Decoration> {
  const decos: StateRange<Decoration>[] = [];
  const activeLineNum = state.doc.lineAt(state.selection.main.head).number;

  decos.push(...getMermaidDecos(state, activeLineNum));
  decos.push(...getFenceDecos(state, activeLineNum));
  decos.push(...getMathBlockDecos(state, activeLineNum));

  for (let lineNum = 1; lineNum <= state.doc.lines; lineNum++) {
    const tableResult = getTableDecos(state, lineNum);

    if (tableResult) {
      decos.push(...tableResult.decos);
      lineNum = tableResult.skipToLine;
      continue;
    }

    const line = state.doc.line(lineNum);
    const isActive = lineNum === activeLineNum;
    if (line.text.startsWith('```') || line.text.trim().startsWith('$$')) {
      continue;
    }

    decos.push(...getHeadingDecos(state, line.text, line.from, isActive));
    decos.push(...getInternalLinkDecos(state, line.text, line.from, isActive));
    decos.push(...getBoldDecos(state, line.text, line.from, isActive));
    decos.push(...getInlineCodeDecos(state, line.text, line.from, isActive));
    decos.push(...getHRDecos(state, line.text, line.from, line.to, isActive));
    decos.push(...getItalicDecos(state, line.text, line.from, isActive));
    decos.push(...getTaskDecos(state, line.text, line.from));
    decos.push(...getNumberedListDecos(line.text, line.from));
    decos.push(...getBulletListDecos(state, line.text, line.from, isActive));

    decos.push(...getStrikethroughDecos(state, line.text, line.from, isActive));
    decos.push(...getHighlightDecos(state, line.text, line.from, isActive));

    decos.push(...getInlineMathDecos(state, line.text, line.from, isActive)); // New

    decos.push(...getLinkDecos(state, line.text, line.from, isActive));
    decos.push(...getBlockquoteDecos(state, line.text, line.from, isActive));
    decos.push(...getTagDecos(line.text, line.from));

    const calloutResult = getCalloutDecos(state, lineNum, activeLineNum);

    if (calloutResult) {
      decos.push(...calloutResult.decos);
      lineNum = calloutResult.skipToLine;
      continue;
    }
    decos.push(...getImageDecos(state, line.text, line.from, line.to, isActive));
  }

  return RangeSet.of(
    decos.sort((a, b) => a.from - b.from),
    true
  );
}
