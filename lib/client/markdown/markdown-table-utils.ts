import { TablePreviewWidget } from '@/features/editor/widgets/table';
import { EditorState, EditorView } from '@uiw/react-codemirror';
export type PendingTableFocus = {
  row: number;
  col: number;
} | null;

export function splitRow(row: string): string[] {
  const trimmed = row.trim();

  if (trimmed === '|') return [];

  let content = trimmed;
  if (content.startsWith('|')) content = content.slice(1);
  if (content.endsWith('|')) content = content.slice(0, -1);
  return content.split(/(?<!\\)\|/).map(cell => cell.trim());
}

function isStrictSeparatorRow(line: string, cols: number): boolean {
  const trimmed = line.trim();
  if (!trimmed.endsWith('|')) return false;
  const cells = splitRow(line);
  if (cells.length !== cols) return false;

  return cells.every(cell => /^:?-{1,}:?$/.test(cell.trim()));
}

export function isValidTable(lines: string[]): boolean {
  if (lines.length < 2) return false;

  const headerCols = splitRow(lines[0]);
  const columnCount = headerCols.length;

  if (!isStrictSeparatorRow(lines[1], columnCount)) return false;
  for (let i = 2; i < lines.length; i++) if (splitRow(lines[i]).length !== columnCount) return false;
  return true;
}

export function getTableRange(state: EditorState, startLine: number) {
  let endLine = startLine;
  const currentLines: string[] = [state.doc.line(startLine).text];

  for (let i = startLine + 1; i <= state.doc.lines; i++) {
    const nextLineText = state.doc.line(i).text;

    if (nextLineText.trim().startsWith('|')) {
      if (isValidTable(currentLines)) {
        const rowCols = splitRow(nextLineText).length;
        const tableCols = splitRow(currentLines[0]).length;

        if (rowCols === tableCols) {
          endLine = i;
          currentLines.push(nextLineText);
        } else {
          break;
        }
      } else {
        endLine = i;
        currentLines.push(nextLineText);
      }
    } else {
      break;
    }
  }
  return { start: startLine, end: endLine };
}

export function createTableActionButton(type: 'row' | 'col', onAction: () => void): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = `cm-table-unified-${type}-trigger`;

  const btn = document.createElement('span');
  btn.textContent = '+';

  btn.onmousedown = e => {
    e.preventDefault();
    e.stopPropagation();
    onAction();
  };

  wrapper.appendChild(btn);
  return wrapper;
}

export function addTableColumn(data: string[][]): string[][] {
  return data.map((row, idx) => (idx === 1 ? [...row, '---'] : [...row, ' ']));
}

export function addTableRow(data: string[][]): string[][] {
  return [...data, new Array(data[0].length).fill(' ')];
}

export function handleTableTabNavigation(widget: TablePreviewWidget, view: EditorView, tableData: string[][], editor: HTMLElement, shiftKey: boolean) {
  const pos = getTablePosition(editor);
  if (!pos) return;

  const { table, rowIndex, cellIndex } = pos;
  const isLastRow = rowIndex === table.rows.length - 1;
  const isLastCell = cellIndex === table.rows[rowIndex].cells.length - 1;
  const isFirstRow = rowIndex === 0;
  const isFirstCell = cellIndex === 0;

  if (shiftKey) {
    if (isFirstRow && isFirstCell) return; // Exit at start
    let r = rowIndex,
      c = cellIndex;
    if (c < 0) {
      r--;
      c = table.rows[r].cells.length - 1;
    }
    const target = table.rows[r].cells[c].querySelector('.cm-table-cell-editor') as HTMLElement;
    target?.focus();
    return;
  }

  if (isLastRow && isLastCell) {
    const next = addTableRow(tableData);
    view.focus();
    view.dispatch({
      changes: { from: widget.from, to: widget.to, insert: serializeTableAligned(next) },
      userEvent: 'input.table',
    });
    focusTableCell(view, widget.from, tableData.length, 0);
  } else {
    let r = rowIndex,
      c = cellIndex;
    if (c >= table.rows[r].cells.length) {
      r++;
      c = 0;
    }
    const target = table.rows[r].cells[c].querySelector('.cm-table-cell-editor') as HTMLElement;
    target?.focus();
  }
  return;
}

export function handleTableEnterNavigation(widget: TablePreviewWidget, view: EditorView, tableData: string[][], editor: HTMLElement) {
  const pos = getTablePosition(editor);
  if (!pos) return;

  const { table, rowIndex, cellIndex } = pos;
  const nextRowIndex = rowIndex + 1;

  if (nextRowIndex < table.rows.length) {
    const target = table.rows[nextRowIndex].cells[cellIndex].querySelector('.cm-table-cell-editor') as HTMLElement | null;

    if (target) {
      target.focus();
      const selection = window.getSelection();
      selection?.collapse(target, 0);
    }
    return;
  }

  const next = addTableRow(tableData);

  view.dispatch({
    changes: { from: widget.from, to: widget.to, insert: serializeTableAligned(next) },
  });

  const waitAndFocus = () => {
    const container = view.dom.querySelector('.cm-table-widget-container') as HTMLElement;
    if (!container) return;

    const newRow = container.querySelectorAll('tr')[nextRowIndex];
    if (!newRow) {
      requestAnimationFrame(waitAndFocus);
      return;
    }

    const target = newRow.cells[cellIndex].querySelector('.cm-table-cell-editor') as HTMLElement | null;
    if (target) {
      target.focus();
      const selection = window.getSelection();
      selection?.collapse(target, 0);
    } else {
      requestAnimationFrame(waitAndFocus);
    }
  };

  requestAnimationFrame(waitAndFocus);
}
function getTablePosition(editor: HTMLElement) {
  const cell = editor.closest('td, th') as HTMLTableCellElement | null;
  const row = cell?.parentElement as HTMLTableRowElement | null;
  const table = row?.closest('table') as HTMLTableElement | null;

  if (!cell || !row || !table) return null;

  return {
    cell,
    row,
    table,
    rowIndex: Array.from(table.rows).indexOf(row),
    cellIndex: Array.from(row.cells).indexOf(cell),
  };
}

export function focusTableCell(view: EditorView, widgetFrom: number, rowIndex: number, colIndex: number) {
  // Use a tiny timeout to ensure we are outside the CM update cycle
  setTimeout(() => {
    const tableContainer = view.dom.querySelector(`.cm-table-widget-container[data-from="${widgetFrom}"]`) as HTMLElement | null;

    if (!tableContainer) return;

    // Row 0 is the 1st tr (headers), Row 2 is the 2nd tr (first data row)
    const cssRowIndex = rowIndex === 0 ? 1 : rowIndex;
    const selector = `tr:nth-child(${cssRowIndex}) :is(td, th):nth-child(${colIndex + 1}) .cm-table-cell-editor`;
    const targetEditor = tableContainer.querySelector(selector) as HTMLElement | null;

    if (targetEditor) {
      targetEditor.focus();

      const selection = window.getSelection();
      const range = document.createRange();

      if (targetEditor.childNodes.length > 0) {
        range.selectNodeContents(targetEditor);
        range.collapse(false);
      } else {
        range.setStart(targetEditor, 0);
        range.collapse(true);
      }

      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, 10); // 10ms is usually enough to let the DOM settle
}

export function serializeTableAligned(data: string[][]): string {
  if (data.length === 0) return '';

  const numCols = Math.max(...data.map(r => r.length));
  const colWidths = Array(numCols).fill(0);

  data.forEach((row, rowIndex) => {
    if (rowIndex === 1) return;
    row.forEach((cell, colIndex) => {
      const len = (cell || '').trim().length;
      if (len > colWidths[colIndex]) colWidths[colIndex] = len;
    });
  });

  return data
    .map((row, rowIndex) => {
      if (rowIndex === 1) {
        const sep = colWidths.map(w => '-'.repeat(Math.max(w, 3)));
        return `| ${sep.join(' | ')} |`;
      }

      // Data Rows
      const cells = colWidths.map((width, colIndex) => {
        const content = (row[colIndex] || '').trim();
        const padding = ' '.repeat(Math.max(0, width - content.length));
        return `${content}${padding}`;
      });

      return `| ${cells.join(' | ')} |`;
    })
    .join('\n');
}
export function updateTable(view: EditorView, from: number, to: number, data: string[][]) {
  view.dispatch({ changes: { from, to, insert: serializeTableAligned(data) }, userEvent: 'input.table' });
}

export function removeTableColumn(data: string[][], colIndex: number): string[][] {
  return data.map(row => {
    const newRow = [...row];
    newRow.splice(colIndex, 1);
    return newRow;
  });
}

export function moveTableColumn(data: string[][], fromIndex: number, toIndex: number): string[][] {
  return data.map(row => {
    const newRow = [...row];
    const [moved] = newRow.splice(fromIndex, 1);
    newRow.splice(toIndex, 0, moved);
    return newRow;
  });
}

export function selectColumn(container: HTMLElement, colIndex: number | null) {
  container.querySelectorAll('.cm-table-col-selected').forEach(el => el.classList.remove('cm-table-col-selected'));
  if (colIndex !== null) {
    container
      .querySelectorAll(`td:nth-child(${colIndex + 1}), th:nth-child(${colIndex + 1})`)
      .forEach(cell => cell.classList.add('cm-table-col-selected'));
    container.focus();
  }
}

export function cleanPastedColumn(text: string) {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.match(/^\|?\s*:?---*:?\s*\|?$/))
    .map(l => l.replace(/^\||\|$/g, '').trim());
}

export function getAllTableRanges(state: EditorState) {
  const ranges: { from: number; to: number }[] = [];
  for (let i = 1; i <= state.doc.lines; i++) {
    const line = state.doc.line(i);
    if (line.text.trim().startsWith('|')) {
      const range = getTableRange(state, i);
      ranges.push({
        from: state.doc.line(range.start).from,
        to: state.doc.line(range.end).to,
      });
      i = range.end;
    }
  }
  return ranges;
}
