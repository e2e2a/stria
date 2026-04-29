import { Decoration, EditorView } from '@codemirror/view';
import { Range as StateRange, EditorState, RangeSet } from '@codemirror/state';
import { BulletWidget, CalloutWidget, CheckboxWidget, ImageWidget, InlineMathWidget, MathWidget } from '@/features/editor/widgets';
import { getTableRange, isValidTable } from '@/lib/client/markdown/markdown-table-utils';
import { chunkModeFacet, sourceModeField } from '../plugins';
import { FrontmatterWidget } from '../widgets/front-matter-widget';
import { DragHandleWidget } from '../widgets/chunk-widget';
import { TablePreviewWidget } from '../widgets/table';
import { getFenceDecos } from './fence-code';

// REGEX
const BOLD_ITALIC_REGEX = /(?<![\*_])(\*\*\*|___)(.+?)\1(?![\*_])/g;
const BOLD_REGEX = /(\*\*|__)(.*?)\1/g;
const HEADING_REGEX = /^(#{1,6})\s/;
const CODE_REGEX = /`([^`]+)`/g;
const ITALIC_REGEX = /(^|[^*_])([*_])([^*_]+)\2/g;
const BULLET_LIST_REGEX = /^(\s*)([-*+])(\s+)/;
const NUMBER_LIST_REGEX = /^(\d+\.\s+)/;
const TABLE_SEPARATOR_REGEX = /^[\s|:-]+$/;
const BLOCKQOUTE_REGEX = /^(\s{0,3})(>+)\s?/;
const CALLOUT_REGEX = /^(\s{0,3})>\s?\[!(\w+)\]/;
const HR_REGEX = /^(\s{0,3})([-*_])(\s*\2){2,}\s*$/;
const TASK_REGEX = /^(\s*)-\s\[([ xX])\](\s)/;
const LINK_START_REGEX = /\[([^\]]+)\]\(/g;
const IMG_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;
const TAG_REGEX = /(^|\s)#([a-zA-Z][\w-]+)/g;
const STRIKE_REGEX = /~~(.*?)~~/g;
const HIGHLIGHT_REGEX = /==(.*?)==/g;
const MATH_INLINE_REGEX = /\$(?:`([^`]+)`|([^$]+))\$/g;
const WIKI_REGEX = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;

function isRangeSelected(state: EditorState, from: number, to: number): boolean {
  const sel = state.selection.main;
  if (sel.empty) return false;
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
  const match = text.match(HEADING_REGEX);
  if (!match) return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

  if (match) {
    const level = match[1].length;
    decos.push(Decoration.line({ attributes: { class: `cm-h${level}` } }).range(lineFrom));
    const lineTo = lineFrom + text.length;
    const isSelected = isRangeSelected(state, lineFrom, lineTo);
    const shouldShowSyntax = isLineActive || isSelected || sourceMode || isChunkMode;

    if (viewMode || !shouldShowSyntax) decos.push(Decoration.replace({}).range(lineFrom, lineFrom + match[0].length));
  }
  return decos;
}

export function getBoldDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  if (!text.includes('**') && !text.includes('__')) return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const isChunkMode = state.facet(chunkModeFacet);
  const viewMode = state.facet(EditorState.readOnly);

  // Optimization: Get the main selection once
  const selection = state.selection.main;

  BOLD_REGEX.lastIndex = 0;
  let match;

  while ((match = BOLD_REGEX.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;

    // Base bold class
    decos.push(Decoration.mark({ class: 'cm-bold-text' }).range(start, end));

    const isSelected = selection.from <= end && selection.to >= start;

    if (viewMode || (!isLineActive && !isSelected && !sourceMode && !isChunkMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, start + 2));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(end - 2, end));
    }
  }
  return decos;
}

export function getBoldItalicDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  if (!text.includes('***') && !text.includes('___')) return [];

  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const isChunkMode = state.facet(chunkModeFacet);
  const viewMode = state.facet(EditorState.readOnly);
  const selection = state.selection.main;

  BOLD_ITALIC_REGEX.lastIndex = 0;
  let match;

  while ((match = BOLD_ITALIC_REGEX.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;

    // Apply both classes for Bold and Italic
    decos.push(Decoration.mark({ class: 'cm-bold-text cm-italic-text' }).range(start, end));

    const isSelected = selection.from <= end && selection.to >= start;

    if (viewMode || (!isLineActive && !isSelected && !sourceMode && !isChunkMode)) {
      // Hide 3 characters for *** or ___
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, start + 3));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(end - 3, end));
    }
  }
  return decos;
}

export function getInlineCodeDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  if (text.indexOf('`') === text.lastIndexOf('`')) return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  let match;

  while ((match = CODE_REGEX.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;
    const contentStart = start + 1;
    const contentEnd = end - 1;

    decos.push(Decoration.mark({ class: 'cm-inline-code' }).range(start, end));
    const isSelected = isRangeSelected(state, start, end);
    if (viewMode || (!isLineActive && !isSelected && !sourceMode && !isChunkMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, contentStart));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(contentEnd, end));
    }
  }
  return decos;
}

export function getItalicDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  if (!text.includes('*') && !text.includes('_')) return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  let match;

  while ((match = ITALIC_REGEX.exec(text)) !== null) {
    const start = lineFrom + match.index + match[1].length;
    const end = start + match[0].length - match[1].length;
    decos.push(
      Decoration.line({
        gutterAttributes: { class: 'cm-hide-fold' },
      }).range(start)
    );
    decos.push(Decoration.mark({ class: 'cm-italic-text' }).range(start, end));
    const isSelected = isRangeSelected(state, start, end);
    if (viewMode || (!isLineActive && !isSelected && !sourceMode && !isChunkMode)) {
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
  const isChunkMode = state.facet(chunkModeFacet);
  const match = text.match(BULLET_LIST_REGEX);
  if (TASK_REGEX.test(text)) return decos; // exit if its a TASK DECORATION

  if (match) {
    const indent = match[1].length;
    const markerStart = lineFrom + indent;
    const markerEnd = markerStart + match[2].length;
    const isSelected = isRangeSelected(state, markerStart, markerEnd);
    const showRaw = isLineActive || isSelected;
    if (viewMode || (!sourceMode && !isChunkMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(markerStart, markerEnd));

      decos.push(
        Decoration.widget({
          widget: new BulletWidget(showRaw),
          side: 1,
        }).range(markerStart)
      );
    }
  }

  return decos;
}
export function getNumberedListDecos(text: string, lineFrom: number): StateRange<Decoration>[] {
  // if (!text || text[0] < '0' || text[0] > '9') return [];
  const decos: StateRange<Decoration>[] = [];
  const match = text.match(NUMBER_LIST_REGEX);

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

export function getTableDecos(state: EditorState, startLine: number) {
  const line = state.doc.line(startLine);
  if (!line.text.trim().startsWith('|')) return null;

  if (startLine < state.doc.lines) {
    const nextLineText = state.doc.line(startLine + 1).text.trim();

    const isNextLineSeparator = nextLineText.includes('-') && TABLE_SEPARATOR_REGEX.test(nextLineText);
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
  const isChunkMode = state.facet(chunkModeFacet);
  if (!viewMode && (sourceMode || isChunkMode)) return { decos: [], skipToLine: range.end };
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
  const firstChar = text[0];
  if (firstChar !== '>' && firstChar !== ' ') return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

  const match = text.match(BLOCKQOUTE_REGEX);
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
  if (viewMode || (!isLineActive && !isSelected && !sourceMode && !isChunkMode))
    decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(markerStart, markerEnd));

  return decos;
}

export function getCalloutDecos(state: EditorState, startLine: number, activeLineNum: number) {
  const doc = state.doc;
  const firstLine = doc.line(startLine);
  const text = firstLine.text;
  if (!text.includes('[!')) return null;

  const match = firstLine.text.match(CALLOUT_REGEX);
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
  const isChunkMode = state.facet(chunkModeFacet);
  const isBlockActive = activeLineNum >= startLine && activeLineNum <= endLine;
  const isSelected = isRangeSelected(state, blockFrom, blockTo);

  if (!viewMode && (isBlockActive || isSelected || sourceMode || isChunkMode)) return null;

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
  if (!text.includes('-') && !text.includes('*') && !text.includes('_')) return [];
  const isHR = HR_REGEX.test(text);
  if (!isHR) return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

  decos.push(Decoration.line({ attributes: { class: 'cm-hr' } }).range(lineFrom));
  const isSelected = isRangeSelected(state, lineFrom, lineTo);
  if (viewMode || (!isLineActive && !isSelected && !sourceMode && !isChunkMode))
    decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(lineFrom, lineTo));

  return decos;
}

export function getTaskDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  if (!text.includes('[')) return [];

  const trimmed = text.trimStart();
  if (trimmed[0] !== '-') return [];

  const decos: StateRange<Decoration>[] = [];

  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

  const match = text.match(TASK_REGEX);
  if (!match) return decos;

  const indent = match[1].length;
  const isChecked = match[2].toLowerCase() === 'x';

  const start = lineFrom + indent;
  const end = start + match[0].trimStart().length - 1;
  if (sourceMode || isChunkMode) return decos;
  const isSelected = isRangeSelected(state, start, end);

  let lineClasses = 'cm-task';
  if (isChecked) {
    lineClasses += ' cm-task-completed';
  }

  decos.push(
    Decoration.line({
      attributes: { class: lineClasses },
    }).range(lineFrom)
  );

  const head = state.selection.main.head;
  const isCursorInTaskSyntax = isLineActive && head >= lineFrom && head <= lineFrom + 5;
  if (viewMode || (!isSelected && !isCursorInTaskSyntax)) {
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
  if (!text.includes('[') && !text.includes('](')) return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

  let match;

  while ((match = LINK_START_REGEX.exec(text)) !== null) {
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
    if (viewMode || (!isLineActive && !isSelected && !sourceMode && !isChunkMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, textStart));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(textEnd, end));
    }
  }

  return decos;
}

export function getImageDecos(state: EditorState, text: string, lineFrom: number, lineTo: number, isLineActive: boolean): StateRange<Decoration>[] {
  if (!text.includes('![') || !text.includes('](')) return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  let match;

  while ((match = IMG_REGEX.exec(text)) !== null) {
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

export function getTagDecos(text: string, lineFrom: number): StateRange<Decoration>[] {
  if (!text.includes('#')) return [];
  const decos: StateRange<Decoration>[] = [];
  let match;

  while ((match = TAG_REGEX.exec(text)) !== null) {
    const tagName = match[2];
    const start = lineFrom + match.index + match[1].length;
    const end = start + match[0].length - match[1].length;

    decos.push(Decoration.mark({ class: 'cm-hashtag', attributes: { 'data-tag': `#${tagName}` } }).range(start, end));
  }

  return decos;
}

export function getStrikethroughDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  if (!text.includes('~~')) return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  let match;

  while ((match = STRIKE_REGEX.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;

    decos.push(Decoration.mark({ class: 'cm-strikethrough-text' }).range(start, end));

    const isSelected = isRangeSelected(state, start, end);
    if (viewMode || (!isLineActive && !isSelected && !sourceMode && !isChunkMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, start + 2));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(end - 2, end));
    }
  }
  return decos;
}

export function getHighlightDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  if (!text.includes('==')) return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  let match;

  while ((match = HIGHLIGHT_REGEX.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;

    decos.push(Decoration.mark({ class: 'cm-highlight-text' }).range(start, end));

    const isSelected = isRangeSelected(state, start, end);
    if (viewMode || (!isLineActive && !isSelected && !sourceMode && !isChunkMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, start + 2));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(end - 2, end));
    }
  }
  return decos;
}

export function getInlineMathDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  if (text.indexOf('$') === text.lastIndexOf('$')) return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  let match;

  while ((match = MATH_INLINE_REGEX.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;

    const isBacktick = !!match[1];
    const content = (match[1] || match[2] || '').trim();

    const isSelected = isRangeSelected(state, start, end);

    if (viewMode || (!isLineActive && !isSelected && !sourceMode && !isChunkMode)) {
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

export function getMathBlockDecos(
  state: EditorState,
  lineNum: number,
  activeLineNum: number
): { decos: StateRange<Decoration>[]; skipToLine: number } | null {
  const line = state.doc.line(lineNum);
  const text = line.text.trim();

  // Only trigger if THIS specific line starts the block
  if (!text.startsWith('$$')) return null;

  const decos: StateRange<Decoration>[] = [];
  const doc = state.doc;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

  let endLine = -1;
  let content = '';

  const secondIndex = line.text.indexOf('$$', 2);
  if (secondIndex !== -1) {
    endLine = lineNum;
    content = line.text.slice(2, secondIndex).trim();
  } else {
    const linesCollected = [];
    const firstLineTrailing = line.text.slice(2).trim();
    if (firstLineTrailing) linesCollected.push(firstLineTrailing);

    for (let j = lineNum + 1; j <= doc.lines; j++) {
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
    const blockFrom = doc.line(lineNum).from;
    const blockTo = doc.line(endLine).to;
    const isBlockActive = activeLineNum >= lineNum && activeLineNum <= endLine;
    const isSelected = isRangeSelected(state, blockFrom, blockTo);

    if (viewMode || (!isBlockActive && !isSelected && !sourceMode && !isChunkMode)) {
      for (let k = lineNum; k <= endLine; k++) {
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
      for (let k = lineNum; k <= endLine; k++) {
        const l = doc.line(k);
        if (l.text.includes('$$')) {
          const idx = l.text.indexOf('$$');
          decos.push(Decoration.mark({ class: 'cm-math-marker' }).range(l.from + idx, l.from + idx + 2));
          if (k === lineNum && endLine === lineNum) {
            const innerStart = l.from + idx + 2;
            const innerEnd = l.from + l.text.lastIndexOf('$$');
            const innerText = l.text.slice(idx + 2, l.text.lastIndexOf('$$'));
            decos.push(Decoration.mark({ class: 'cm-block-line' }).range(innerStart, innerEnd));
            decos.push(...getMathSyntaxHighlighting(innerText, l.from + idx + 2));
            const lastIdx = l.text.lastIndexOf('$$');
            decos.push(Decoration.mark({ class: 'cm-math-marker' }).range(l.from + lastIdx, l.from + lastIdx + 2));
          }
        } else {
          decos.push(Decoration.mark({ class: 'cm-block-line' }).range(l.from, l.to));
          decos.push(...getMathSyntaxHighlighting(l.text, l.from));
        }
      }
    }

    return { decos, skipToLine: endLine };
  }
  return null;
}

export function getInternalLinkDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  if (!text.includes('[[')) return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  const selection = state.selection.main;

  let match;
  while ((match = WIKI_REGEX.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;

    const fullLink = match[1]; // e.g., "#Introduction" or "Note#Conclusion"
    const displayText = match[2]; // e.g., "Alias"

    const isCursorInside = selection.from >= start && selection.to <= end;
    const shouldHide = viewMode || (!isLineActive && !isCursorInside && !sourceMode && !isChunkMode);

    const linkAttrs = { 'data-link': fullLink };

    if (!shouldHide) {
      decos.push(Decoration.mark({ class: 'cm-link-source-editing' }).range(start, end));
    } else {
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

export function getFrontmatterDecos(state: EditorState, activeLineNum: number): { decos: StateRange<Decoration>[]; skipToLine: number } {
  const doc = state.doc;
  if (doc.lines < 2 || doc.line(1).text.trim() !== '---') return { decos: [], skipToLine: -1 };

  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

  let endLineNum = -1;
  for (let i = 2; i <= Math.min(doc.lines, 50); i++) {
    if (doc.line(i).text.trim() === '---') {
      endLineNum = i;
      break;
    }
  }

  if (endLineNum === -1) return { decos: [], skipToLine: -1 };

  const from = doc.line(1).from;
  const to = doc.line(endLineNum).to;
  const rawContent = doc.sliceString(from, to);

  const hasAnyProp = /^[a-zA-Z0-9_-]+:/m.test(rawContent);
  if (!hasAnyProp) return { decos: [], skipToLine: -1 };

  const mainSel = state.selection.main;
  const isBlockActive = activeLineNum >= 1 && activeLineNum <= endLineNum;
  const isAtStart = activeLineNum === 1 && mainSel.anchor === 0;
  const isCursorInside = mainSel.anchor < from || mainSel.anchor > to;

  if (viewMode || (!sourceMode && !isChunkMode && (isAtStart || !isBlockActive) && (isAtStart || isCursorInside))) {
    const decos: StateRange<Decoration>[] = [];
    for (let i = 1; i <= endLineNum; i++) decos.push(Decoration.line({ attributes: { class: 'cm-syntax-hide' } }).range(doc.line(i).from));

    decos.push(
      Decoration.replace({
        widget: new FrontmatterWidget(rawContent, from),
        side: -1,
        block: true,
      }).range(from)
    );

    decos.push(Decoration.replace({}).range(from, to));
    return { decos, skipToLine: endLineNum };
  }

  return { decos: [], skipToLine: endLineNum };
}

export function buildDecorations(state: EditorState, from: number, to: number): RangeSet<Decoration> {
  from = Math.max(1, Math.min(from, state.doc.lines));
  to = Math.max(1, Math.min(to, state.doc.lines));
  const allDecos: StateRange<Decoration>[] = [];
  const activeLineNum = state.doc.lineAt(state.selection.main.head).number;

  // Ask CodeMirror's AST if our current 'from' position is inside a FencedCode block.
  let logicStart = from;
  // const pos = state.doc.line(from).from;
  // const tree = syntaxTree(state);
  // let node: SyntaxNode | null = tree.resolveInner(pos, -1);

  let inFence = false;
  let lastFenceStartLine = -1;

  for (let i = 1; i <= from; i++) {
    const text = state.doc.line(i).text;

    // STRICT ROOT CHECK: Must start exactly with ``` (0 spaces)
    if (text.startsWith('```')) {
      if (!inFence) {
        inFence = true;
        lastFenceStartLine = i;
      } else {
        if (text === '```') {
          // It's a closing root fence
          inFence = false;
          lastFenceStartLine = -1;
        }
      }
    }
  }

  // If viewport starts inside a root fence, rewind to its exact start line
  if (inFence && lastFenceStartLine !== -1) {
    logicStart = lastFenceStartLine;
  }

  /**
   * @Todo
   * This fallback in math blocks is not trustworthy.
   */
  if (logicStart === from) {
    for (let j = from; j >= Math.max(1, from - 200); j--) {
      if (state.doc.line(j).text.trim().startsWith('$$')) {
        logicStart = j;
        break;
      }
    }
  }

  const BUFFER = 10;
  const endLine = Math.min(state.doc.lines, to + BUFFER);
  let skipUntil = -1;

  const frontmatter = getFrontmatterDecos(state, activeLineNum);
  if (frontmatter) {
    allDecos.push(...frontmatter.decos);
    skipUntil = frontmatter.skipToLine;
  }

  // MAIN PROCESSING LOOP
  for (let i = logicStart; i <= endLine; i++) {
    if (i <= skipUntil) continue;

    const line = state.doc.line(i);
    const text = line.text;

    if (text.trim() === '') continue;

    const isActive = i === activeLineNum;
    const lineDecos: StateRange<Decoration>[] = [];
    let skipToLine = i;
    // const table = !fence ? getTableDecos(state, i) : null;

    const fence = getFenceDecos(state, i, activeLineNum) ?? null;

    let isTable = false;
    if (!fence && text.trim().startsWith('|')) {
      const tableRange = getTableRange(state, i);
      skipToLine = tableRange.end;
      isTable = true;
    }

    const mathBlock = !fence ? getMathBlockDecos(state, i, activeLineNum) : null;
    const callout = !fence && !isTable ? getCalloutDecos(state, i, activeLineNum) : null;

    if (fence) {
      skipToLine = fence.skipToLine;
    } else if (isTable) {
      // REMOVAL: We intentionally do NOT push table.decos here.
      // We only grab the skipToLine to jump over the table block,
      // letting buildTableDecorations handle the actual widgets.
      // skipToLine = isTable.skipToLine;
    } else if (callout || mathBlock) {
      const block = callout || mathBlock;
      // Only push if it overlaps the viewport
      if (block!.skipToLine >= from) {
        lineDecos.push(...block!.decos);
      }
      skipToLine = block!.skipToLine;
    } else if (i >= from - BUFFER) {
      // INLINE LEVEL
      if (text.length > 0) {
        lineDecos.push(...getHeadingDecos(state, text, line.from, isActive));
        lineDecos.push(...getBoldItalicDecos(state, text, line.from, isActive));
        lineDecos.push(...getInternalLinkDecos(state, text, line.from, isActive));
        lineDecos.push(...getLinkDecos(state, text, line.from, isActive));
        lineDecos.push(...getImageDecos(state, text, line.from, line.to, isActive));
        lineDecos.push(...getBoldDecos(state, text, line.from, isActive));
        lineDecos.push(...getItalicDecos(state, text, line.from, isActive));
        lineDecos.push(...getBulletListDecos(state, text, line.from, isActive));
        lineDecos.push(...getInlineCodeDecos(state, text, line.from, isActive));
        lineDecos.push(...getNumberedListDecos(text, line.from));
        lineDecos.push(...getStrikethroughDecos(state, text, line.from, isActive));
        lineDecos.push(...getTagDecos(text, line.from));
        lineDecos.push(...getHighlightDecos(state, text, line.from, isActive));
        lineDecos.push(...getInlineMathDecos(state, text, line.from, isActive));
        lineDecos.push(...getBlockquoteDecos(state, text, line.from, isActive));
        lineDecos.push(...getTaskDecos(state, text, line.from, isActive));
        lineDecos.push(...getHRDecos(state, text, line.from, line.to, isActive));
      }
    }

    allDecos.push(...lineDecos);
    i = skipToLine;
  }

  return RangeSet.of(
    allDecos.sort((a, b) => a.from - b.from),
    true
  );
}
export function getFullSplits(customSplits: number[], docLength: number) {
  const safeSplits: number[] = [];
  let currentStart = 0;
  const sortedCustom = [...customSplits].sort((a, b) => a - b);

  for (const split of sortedCustom) {
    let temp = currentStart;
    while (temp + 512 < split) {
      temp += 512;
      safeSplits.push(temp);
    }
    safeSplits.push(split);
    currentStart = split;
  }

  while (currentStart + 512 < docLength) {
    currentStart += 512;
    safeSplits.push(currentStart);
  }

  return safeSplits;
}

export function buildChunkDecorations(view: EditorView, customSplits: [number, number][], canEditChunk: boolean): RangeSet<Decoration> {
  const allDecos: StateRange<Decoration>[] = [];
  const docLength = view.state.doc.length;

  const BUFFER = 2000;
  const viewFrom = Math.max(0, view.viewport.from - BUFFER);
  const viewTo = Math.min(docLength, view.viewport.to + BUFFER);

  for (let i = 0; i < customSplits.length; i++) {
    const [start, end] = customSplits[i];

    // Only render if it intersects the buffered viewport
    if (end >= viewFrom && start <= viewTo) {
      const size = end - start;

      if (start < end) allDecos.push(Decoration.mark({ class: `cm-chunk-highlight chunk-bg-${i % 7} py-1 rounded-[2px] px-1` }).range(start, end));
      if (canEditChunk) {
        // side: 1 Places it after the text
        allDecos.push(Decoration.widget({ widget: new DragHandleWidget(start, i, 'start', size), side: 1 }).range(start));
        // side: -1 Places it after the text
        allDecos.push(Decoration.widget({ widget: new DragHandleWidget(end, i, 'end', size), side: -1 }).range(end));
      }
    }
  }

  return RangeSet.of(
    allDecos.sort((a, b) => a.from - b.from),
    true
  );
}
