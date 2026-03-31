import { Decoration } from '@codemirror/view';
import { Range as StateRange, EditorState, RangeSet, Line, SelectionRange, Transaction } from '@codemirror/state';
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
import { chunkModeFacet, sourceModeField } from '../plugins';
import { FrontmatterWidget } from '../widgets/front-matter-widget';

function isRangeSelected(state: EditorState, from: number, to: number): boolean {
  const sel = state.selection.main;
  if (sel.empty) {
    return false;
  }
  // console.log('state.selection', state.selection);
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
  const match = text.match(/^(#{1,6})\s/);
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

// Move Regex outside so it's not re-compiled thousands of times
const BOLD_REGEX = /\*\*(.*?)\*\*/g;

export function getBoldDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  if (!text.includes('**')) return [];
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

    // Inline "isRangeSelected" logic for maximum speed
    const isSelected = selection.from <= end && selection.to >= start;

    // Obsidian-style logic: Hide if not active line AND not selected
    if (viewMode || (!isLineActive && !isSelected && !sourceMode && !isChunkMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(start, start + 2));
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(end - 2, end));
    }
  }
  return decos;
}
export function getInlineCodeDecos(state: EditorState, text: string, lineFrom: number, isLineActive: boolean): StateRange<Decoration>[] {
  if (text.indexOf('`') === text.lastIndexOf('`')) return [];
  const decos: StateRange<Decoration>[] = [];
  const codeRegex = /`([^`]+)`/g;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
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
  const italicRegex = /(^|[^*_])([*_])([^*_]+)\2/g;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  let match;

  while ((match = italicRegex.exec(text)) !== null) {
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
  const trimmed = text.trim();
  if (!trimmed || !['-', '*', '+'].includes(trimmed[0])) return [];

  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

  // 2. SPECIFIC TASK CHECK:
  // We only skip if it's a checkbox: "- [ ]" or "- [x]"
  if (/^[-*+]\s+\[[ xX]\](\s|$)/.test(trimmed)) return [];

  const match = text.match(/^(\s*)([-*+])(\s+)/);
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
  if (!text || text[0] < '0' || text[0] > '9') return [];
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

// export function getFenceDecos(state: EditorState, activeLineNum: number): StateRange<Decoration>[] {
//   if (!state.doc.toString().includes('```')) {
//     return [];
//   }
//   const decos: StateRange<Decoration>[] = [];
//   let isInsideBlock = false;
//   let blockStartLine = -1;

//   for (let i = 1; i <= state.doc.lines; i++) {
//     const line = state.doc.line(i);
//     const text = line.text;
//     const trimmedText = text.trim();

//     if (trimmedText.startsWith('```')) {
//       const isOpening = !isInsideBlock;

//       if (isOpening) {
//         blockStartLine = i;

//         let searchIndex = 0;
//         let foundAny = false;

//         while (searchIndex < text.length) {
//           const openingIndex = text.indexOf('```', searchIndex);
//           if (openingIndex === -1) break;

//           const closingIndex = text.indexOf('```', openingIndex + 3);
//           if (closingIndex === -1) break;

//           foundAny = true;

//           const isBlockActive = activeLineNum === i;
//           const isSelected = isRangeSelected(state, line.from, line.to);
//           const sourceMode = state.field(sourceModeField, false);
//           const viewMode = state.facet(EditorState.readOnly);
//           const isChunkMode = state.facet(chunkModeFacet);

//           const openingStart = line.from + openingIndex;
//           const openingEnd = openingStart + 3;
//           const closingStart = line.from + closingIndex;
//           const closingEnd = closingStart + 3;
//           const contentStart = openingEnd;
//           const contentEnd = closingStart;

//           if (viewMode || (!isBlockActive && !isSelected && !sourceMode && !isChunkMode)) {
//             decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(openingStart, openingEnd));
//             decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(closingStart, closingEnd));

//             decos.push(
//               Decoration.mark({
//                 class: 'cm-fenced-inline-code',
//               }).range(contentStart, contentEnd)
//             );
//           } else {
//             decos.push(Decoration.mark({ class: 'cm-code-fence-marker' }).range(openingStart, openingEnd));
//             decos.push(Decoration.mark({ class: 'cm-code-fence-marker' }).range(closingStart, closingEnd));
//           }

//           searchIndex = closingIndex + 3;
//         }

//         if (foundAny) continue;

//         const content = [];
//         let closingLine = i;

//         for (let j = i + 1; j <= state.doc.lines; j++) {
//           const nextLine = state.doc.line(j);
//           if (nextLine.text.trim().startsWith('```')) {
//             closingLine = j;
//             break;
//           }
//           content.push(nextLine.text);
//         }

//         const language = trimmedText.slice(3).trim();
//         const isBlockActive = activeLineNum >= i && activeLineNum <= closingLine;

//         decos.push(
//           Decoration.widget({
//             widget: new FenchCodeWidget(language, content.join('\n')),
//             side: -1,
//             block: false,
//           }).range(line.from)
//         );

//         decos.push(
//           Decoration.line({
//             attributes: { class: 'cm-code-block-fence cm-code-block-start' },
//           }).range(line.from)
//         );

//         const isSelected = isRangeSelected(state, line.from, state.doc.line(closingLine).to);
//         const sourceMode = state.field(sourceModeField, false);
//         const viewMode = state.facet(EditorState.readOnly);
//         const isChunkMode = state.facet(chunkModeFacet);

//         if (viewMode || (!isBlockActive && !isSelected && !sourceMode && !isChunkMode)) {
//           decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(line.from, line.to));
//         }

//         isInsideBlock = true;
//         continue;
//       } else {
//         decos.push(
//           Decoration.line({
//             attributes: { class: 'cm-code-block-fence cm-code-block-end' },
//           }).range(line.from)
//         );

//         const isBlockActive = activeLineNum >= blockStartLine && activeLineNum <= i;
//         const isSelected = isRangeSelected(state, state.doc.line(blockStartLine).from, line.to);
//         const sourceMode = state.field(sourceModeField, false);
//         const viewMode = state.facet(EditorState.readOnly);

//         if (viewMode || (!isBlockActive && !isSelected && !sourceMode)) {
//           decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(line.from, line.to));
//         }

//         isInsideBlock = false;
//         continue;
//       }
//     }

//     if (isInsideBlock) {
//       decos.push(
//         Decoration.line({
//           attributes: { class: 'cm-code-block-line' },
//         }).range(line.from)
//       );
//     }
//   }

//   return decos;
// }
export function getFenceDecos(state: EditorState, lineNum: number, activeLineNum: number) {
  const line = state.doc.line(lineNum);
  const text = line.text;
  const trimmedText = text.trim();

  // If it doesn't start a fence, return null so the loop continues
  if (!trimmedText.startsWith('```')) return null;

  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

  // --- 1. HANDLE INLINE TRIPLE BACKTICKS (```code```) ---
  // If the line has both opening and closing on the same line
  const firstMatch = text.indexOf('```');
  const secondMatch = text.indexOf('```', firstMatch + 3);

  if (secondMatch !== -1) {
    let searchIndex = 0;
    while (searchIndex < text.length) {
      const openingIndex = text.indexOf('```', searchIndex);
      if (openingIndex === -1) break;
      const closingIndex = text.indexOf('```', openingIndex + 3);
      if (closingIndex === -1) break;

      const isBlockActive = activeLineNum === lineNum;
      const isSelected = isRangeSelected(state, line.from, line.to);

      const openingStart = line.from + openingIndex;
      const openingEnd = openingStart + 3;
      const closingStart = line.from + closingIndex;
      const closingEnd = closingStart + 3;

      if (viewMode || (!isBlockActive && !isSelected && !sourceMode && !isChunkMode)) {
        decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(openingStart, openingEnd));
        decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(closingStart, closingEnd));
        decos.push(Decoration.mark({ class: 'cm-fenced-inline-code' }).range(openingEnd, closingStart));
      } else {
        decos.push(Decoration.mark({ class: 'cm-code-fence-marker' }).range(openingStart, openingEnd));
        decos.push(Decoration.mark({ class: 'cm-code-fence-marker' }).range(closingStart, closingEnd));
      }
      searchIndex = closingIndex + 3;
    }
    return { decos, skipToLine: lineNum };
  }

  // --- 2. HANDLE MULTI-LINE CODE BLOCKS ---
  let closingLine = lineNum;
  const content = [];

  // Scan down to find the end of the fence
  for (let j = lineNum + 1; j <= state.doc.lines; j++) {
    const nextLine = state.doc.line(j);
    if (nextLine.text.trim().startsWith('```')) {
      closingLine = j;
      break;
    }
    content.push(nextLine.text);
  }

  const isBlockActive = activeLineNum >= lineNum && activeLineNum <= closingLine;
  const isSelected = isRangeSelected(state, line.from, state.doc.line(closingLine).to);
  const language = trimmedText.slice(3).trim();

  // A. Opening Line Decor
  decos.push(
    Decoration.widget({
      widget: new FenchCodeWidget(language, content.join('\n')),
      side: -1,
    }).range(line.from)
  );

  decos.push(Decoration.line({ attributes: { class: 'cm-code-block-fence cm-code-block-start' } }).range(line.from));
  if (viewMode || (!isBlockActive && !isSelected && !sourceMode && !isChunkMode)) {
    decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(line.from, line.to));
  }

  // B. Content Lines
  for (let m = lineNum + 1; m < closingLine; m++) {
    decos.push(Decoration.line({ attributes: { class: 'cm-code-block-line' } }).range(state.doc.line(m).from));
  }

  // C. Closing Line Decor (if found)
  if (closingLine > lineNum) {
    const lastLine = state.doc.line(closingLine);
    decos.push(Decoration.line({ attributes: { class: 'cm-code-block-fence cm-code-block-end' } }).range(lastLine.from));
    if (viewMode || (!isBlockActive && !isSelected && !sourceMode)) {
      decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(lastLine.from, lastLine.to));
    }
  }

  return { decos, skipToLine: closingLine };
}
export function getTableDecos(state: EditorState, startLine: number) {
  const line = state.doc.line(startLine);
  if (!line.text.trim().startsWith('|')) return null;

  if (startLine < state.doc.lines) {
    const nextLineText = state.doc.line(startLine + 1).text.trim();

    const isNextLineSeparator = nextLineText.includes('-') && /^[\s|:-]+$/.test(nextLineText);
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
  if (viewMode || (!isLineActive && !isSelected && !sourceMode && !isChunkMode))
    decos.push(Decoration.mark({ class: 'cm-syntax-hide' }).range(markerStart, markerEnd));

  return decos;
}

export function getCalloutDecos(state: EditorState, startLine: number, activeLineNum: number) {
  const doc = state.doc;
  const firstLine = doc.line(startLine);
  const text = firstLine.text;
  if (!text.includes('[!')) return null;
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
  const isHR = /^(\s{0,3})([-*_])(\s*\2){2,}\s*$/.test(text);
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

export function getTaskDecos(state: EditorState, text: string, lineFrom: number): StateRange<Decoration>[] {
  if (!text.includes('[')) return [];

  const trimmed = text.trimStart();
  if (trimmed[0] !== '-') return [];

  const decos: StateRange<Decoration>[] = [];

  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

  const match = text.match(/^(\s*)-\s\[([ xX])\](\s)/);
  if (!match) return decos;

  const indent = match[1].length;
  const isChecked = match[2].toLowerCase() === 'x';

  const start = lineFrom + indent;
  const end = start + match[0].trimStart().length - 1;
  if (sourceMode || isChunkMode) return decos;
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
  if (!text.includes('[') && !text.includes('](')) return [];
  const decos: StateRange<Decoration>[] = [];
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

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
  if (!state.doc.toString().includes('```mermaid')) {
    return [];
  }
  const decos: StateRange<Decoration>[] = [];
  const doc = state.doc;
  const selection = state.selection.main;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

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
      if (viewMode || (!isBlockActive && !isSelected && !sourceMode && !isChunkMode)) {
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
  if (!text.includes('#')) return [];
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
  if (!text.includes('~~')) return [];
  const decos: StateRange<Decoration>[] = [];
  const strikeRegex = /~~(.*?)~~/g;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  let match;

  while ((match = strikeRegex.exec(text)) !== null) {
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
  const highRegex = /==(.*?)==/g;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  let match;

  while ((match = highRegex.exec(text)) !== null) {
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
  const mathRegex = /\$(?:`([^`]+)`|([^$]+))\$/g;

  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  let match;

  while ((match = mathRegex.exec(text)) !== null) {
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
export function getMathBlockDecos(state: EditorState, activeLineNum: number): StateRange<Decoration>[] {
  if (!state.doc.toString().includes('$$')) return [];
  const decos: StateRange<Decoration>[] = [];
  const doc = state.doc;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);

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

        if (viewMode || (!isBlockActive && !isSelected && !sourceMode && !isChunkMode)) {
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
  if (!text.includes('[[')) return [];
  const decos: StateRange<Decoration>[] = [];

  // Regex: Group 1 = Path/Heading, Group 2 = Alias
  const wikiRegex = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;

  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  const selection = state.selection.main;

  let match;
  while ((match = wikiRegex.exec(text)) !== null) {
    const start = lineFrom + match.index;
    const end = start + match[0].length;

    const fullLink = match[1]; // e.g., "#Introduction" or "Note#Conclusion"
    const displayText = match[2]; // e.g., "Alias"

    const isCursorInside = selection.from >= start && selection.to <= end;
    const shouldHide = viewMode || (!isLineActive && !isCursorInside && !sourceMode && !isChunkMode);

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
      Decoration.widget({
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

export interface LineCtx {
  state: EditorState;
  sourceMode: boolean;
  chunkMode: boolean;
  viewMode: boolean;
  selection: SelectionRange;
}

export function makeCtx(state: EditorState): LineCtx {
  return {
    state,
    sourceMode: state.field(sourceModeField, false) ?? false,
    chunkMode: state.facet(chunkModeFacet),
    viewMode: state.facet(EditorState.readOnly),
    selection: state.selection.main,
  };
}

export function buildLineDecos(state: EditorState, line: Line, isActive: boolean, ctx?: LineCtx): StateRange<Decoration>[] {
  const c = ctx ?? makeCtx(state);
  const { text, from, to } = line;

  return [
    ...getHeadingDecos(c.state, text, from, isActive),
    ...getInternalLinkDecos(c.state, text, from, isActive),
    ...getBoldDecos(c.state, text, from, isActive),
    ...getInlineCodeDecos(c.state, text, from, isActive),
    ...getHRDecos(c.state, text, from, to, isActive),
    ...getItalicDecos(c.state, text, from, isActive),
    ...getTaskDecos(c.state, text, from),
    ...getNumberedListDecos(text, from),
    ...getBulletListDecos(c.state, text, from, isActive),
    ...getStrikethroughDecos(c.state, text, from, isActive),
    ...getHighlightDecos(c.state, text, from, isActive),
    ...getInlineMathDecos(c.state, text, from, isActive),
    ...getLinkDecos(c.state, text, from, isActive),
    ...getBlockquoteDecos(c.state, text, from, isActive),
    ...getTagDecos(text, from),
    ...getImageDecos(c.state, text, from, to, isActive),
  ];
}

export function buildDecorations(state: EditorState): RangeSet<Decoration> {
  const decos: StateRange<Decoration>[] = [];
  const activeLineNum = state.doc.lineAt(state.selection.main.head).number;
  const ctx = makeCtx(state);

  // Block-level decorations (multi-line, full-doc scan)
  const frontmatter = getFrontmatterDecos(state, activeLineNum);
  let skipUntil = -1;
  if (frontmatter) {
    decos.push(...frontmatter.decos);
    skipUntil = frontmatter.skipToLine;
  }
  decos.push(...getMermaidDecos(state, activeLineNum));
  // decos.push(...getFenceDecos(state, activeLineNum));
  decos.push(...getMathBlockDecos(state, activeLineNum));

  // Per-line decorations
  for (let lineNum = 1; lineNum <= state.doc.lines; lineNum++) {
    if (lineNum <= skipUntil) continue;

    // Multi-line blocks — must be checked before single-line
    const tableResult = getTableDecos(state, lineNum);
    if (tableResult) {
      decos.push(...tableResult.decos);
      lineNum = tableResult.skipToLine;
      continue;
    }

    const fenceResult = getFenceDecos(state, lineNum, activeLineNum);
    if (fenceResult) {
      decos.push(...fenceResult.decos);
      lineNum = fenceResult.skipToLine;
      continue;
    }

    const calloutResult = getCalloutDecos(state, lineNum, activeLineNum);
    if (calloutResult) {
      decos.push(...calloutResult.decos);
      lineNum = calloutResult.skipToLine;
      continue;
    }

    // Single-line decorations
    const line = state.doc.line(lineNum);
    decos.push(...buildLineDecos(state, line, lineNum === activeLineNum, ctx));
  }

  return RangeSet.of(
    decos.sort((a, b) => a.from - b.from),
    true
  );
}
function isInsideFence(state: EditorState, lineNum: number): boolean {
  const line = state.doc.line(lineNum);
  const text = line.text.trim();

  // If the current line is a marker, it counts as "block"
  if (text.startsWith('```')) return true;

  // Scan upwards to find the opening fence
  // We cap this at 100 lines to keep it instant
  for (let i = lineNum - 1; i >= Math.max(1, lineNum - 100); i--) {
    const prevText = state.doc.line(i).text.trim();
    if (prevText.startsWith('```')) {
      // If we found a ``` and it's NOT a self-contained inline code
      // then we are inside a block.
      return true;
    }
  }
  return false;
}

const isBlockLine = (state: EditorState, lineNum: number, activeLineNum: number) => {
  const line = state.doc.line(lineNum);
  const text = line.text;

  // 1. Direct match for block markers
  if (text.startsWith('```') || text.trim().startsWith('$$')) return true;

  // 2. Complex block detection (Callouts / Tables)
  if (getCalloutDecos(state, lineNum, activeLineNum)) return true;
  if (getTableDecos(state, lineNum)) return true;

  // 3. Context detection (Are we inside a code block?)
  if (isInsideFence(state, lineNum)) return true;

  return false;
};
export function updateChangedLines(decos: RangeSet<Decoration>, tr: Transaction): RangeSet<Decoration> {
  const state = tr.state;
  const activeLineNum = state.doc.lineAt(state.selection.main.head).number;
  const ctx = makeCtx(state);
  const toAdd: StateRange<Decoration>[] = [];
  const affectedRanges: { from: number; to: number }[] = [];
  let needsFullRebuild = false;

  // Iterate over changed ranges
  tr.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
    if (needsFullRebuild) return;

    const startLine = state.doc.lineAt(fromB).number;
    const endLine = state.doc.lineAt(toB).number;
    for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
      if (isBlockLine(state, lineNum, activeLineNum)) {
        // Any block-level change triggers a full rebuild
        needsFullRebuild = true;
        return;
      }

      const line = state.doc.line(lineNum);
      affectedRanges.push({ from: line.from, to: line.to });
      toAdd.push(...buildLineDecos(state, line, lineNum === activeLineNum, ctx));
    }
  });

  if (needsFullRebuild) {
    return buildDecorations(state);
  }

  // Only update affected lines
  return decos.update({
    filter: (from, to) => !affectedRanges.some(r => from >= r.from && to <= r.to),
    add: toAdd,
    sort: true,
  });
}

export function updateActiveLine(decos: RangeSet<Decoration>, tr: Transaction): RangeSet<Decoration> {
  const state = tr.state;
  const startState = tr.startState;

  const prevSel = startState.selection.main;
  const nextSel = state.selection.main;

  const prevStartLine = startState.doc.lineAt(prevSel.from).number;
  const prevEndLine = startState.doc.lineAt(prevSel.to).number;
  const nextStartLine = state.doc.lineAt(nextSel.from).number;
  const nextEndLine = state.doc.lineAt(nextSel.to).number;

  if (prevSel.eq(nextSel)) {
    console.log('  [skip] selections are identical');
    return decos;
  }

  // Block check
  const prevIsBlock = isBlockLine(startState, prevStartLine, prevStartLine) || isBlockLine(startState, prevEndLine, prevEndLine);
  const nextIsBlock = isBlockLine(state, nextStartLine, nextStartLine) || isBlockLine(state, nextEndLine, nextEndLine);
  console.log(' d');
  // console.log('  prevIsBlock:', prevIsBlock, '| nextIsBlock:', nextIsBlock);

  if (prevIsBlock || nextIsBlock) {
    console.log(' e');
    return buildDecorations(state);
  }

  // Detect ctrl+a → collapse (previous selection spanned whole doc)
  const prevWasFullDoc = !prevSel.empty && prevStartLine === 1 && prevEndLine === startState.doc.lines;

  console.log('  prevWasFullDoc:', prevWasFullDoc, '| nextEmpty:', nextSel.empty);

  if (prevWasFullDoc && nextSel.empty) {
    console.log('  [full rebuild] ctrl+a → click collapse');
    return buildDecorations(state);
  }

  // Refresh zone = union of prev and next selection line ranges
  const refreshStart = Math.min(prevStartLine, nextStartLine);
  const refreshEnd = Math.max(prevEndLine, nextEndLine);

  console.log('  refresh zone: lines', refreshStart, '→', refreshEnd);

  const toAdd: StateRange<Decoration>[] = [];
  const affectedRanges: { from: number; to: number }[] = [];
  const ctx = makeCtx(state);

  for (let i = refreshStart; i <= refreshEnd; i++) {
    const line = state.doc.line(i);
    const isActive = i >= nextStartLine && i <= nextEndLine;

    // Per-line debug: log every line that has a non-trivial selection interaction
    if (!nextSel.empty || !prevSel.empty) {
      const isSelected = isRangeSelected(state, line.from, line.to);
      console.log(
        `  line ${i}: isActive=${isActive} isSelected=${isSelected}`,
        `from=${line.from} to=${line.to}`,
        `selFrom=${nextSel.from} selTo=${nextSel.to}`
      );
    }

    affectedRanges.push({ from: line.from, to: line.to });
    toAdd.push(...buildLineDecos(state, line, isActive, ctx));
  }

  return decos.update({
    filter: (from, to) => !affectedRanges.some(r => from >= r.from && to <= r.to),
    add: toAdd,
    sort: true,
  });
}
