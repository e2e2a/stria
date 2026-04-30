import { EditorView, WidgetType } from '@codemirror/view';
import {
  addTableColumn,
  addTableRow,
  cleanPastedColumn,
  createTableActionButton,
  focusTableCell,
  handleTableEnterNavigation,
  handleTableTabNavigation,
  moveTableColumn,
  removeTableColumn,
  selectColumn,
  splitRow,
  updateTable,
} from '@/lib/client/markdown/markdown-table-utils';
import { ChangeSpec, EditorSelection, Transaction } from '@uiw/react-codemirror';
import 'katex/dist/katex.min.css';
import { tableHeightCache } from '../plugins/table';

function parseCellHTML(text: string): string {
  if (!text) return '';
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/(^|\s|\|)#([a-zA-Z][\w-]+)/g, '$1<span class="cm-hashtag" data-tag="#$2">#$2</span>');
  html = html.replace(/`([^`]+)`/g, '<code class="cm-inline-code">$1</code>');

  return html;
}

export class TablePreviewWidget extends WidgetType {
  public isFreshInsert = true;
  public selectedColumn: number | null = null;
  private GRIP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-horizontal-icon lucide-grip-horizontal"><circle cx="12" cy="9" r="1"/><circle cx="19" cy="9" r="1"/><circle cx="5" cy="9" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="19" cy="15" r="1"/><circle cx="5" cy="15" r="1"/></svg>`;
  constructor(
    readonly rawText: string,
    readonly from: number,
    readonly to: number,
    readonly isViewMode: boolean
  ) {
    super();
  }
  get estimatedHeight(): number {
    // 🎯 If we have seen this exact table before, return its exact pixel height!
    const cached = tableHeightCache.get(this.rawText);
    if (cached) return cached;

    // Fallback for brand new tables that haven't been measured yet
    const rows = this.rawText.split('\n').filter(l => l.trim()).length;
    return (rows - 1) * 9 + 12;
  }
  private getLiveBounds(view: EditorView, container: HTMLElement) {
    // If the widget was destroyed or detached by CodeMirror, abort.
    if (!container.isConnected || !view.dom.contains(container)) {
      return null;
    }

    try {
      const liveFrom = view.posAtDOM(container);
      const currentRaw = container.getAttribute('data-raw-text') || this.rawText;
      const liveTo = liveFrom + currentRaw.length;
      return { liveFrom, liveTo };
    } catch {
      return null;
    }
  }

  toDOM(view: EditorView): HTMLElement {
    console.log('running viewmode', this.isViewMode);
    const lines = this.rawText.split('\n').filter(l => l.trim());
    const tableData = lines.map(line => splitRow(line));
    const container = document.createElement('div');
    container.className = 'cm-table-widget-container';
    container.tabIndex = -1;

    container.setAttribute('data-raw-text', this.rawText);
    container.setAttribute('data-view-mode', String(this.isViewMode));

    container.style.minHeight = `${this.estimatedHeight}px`;

    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'cm-table-scroll-wrapper';
    scrollWrapper.tabIndex = -1;
    const inner = document.createElement('div');
    inner.className = 'cm-table-inner';

    container.addEventListener('keydown', e => {
      if (this.selectedColumn === null) return;

      // 🚨 THE FIX: Always parse the freshest data right when the key is pressed!
      const currentRaw = container.getAttribute('data-raw-text') || this.rawText;
      const liveTableData = currentRaw
        .split('\n')
        .filter(l => l.trim())
        .map(splitRow);

      if (e.key === 'Backspace' || e.key === 'Delete' || ((e.ctrlKey || e.metaKey) && e.key === 'x')) {
        e.preventDefault();
        let newData: string[][] = [];

        // Use liveTableData instead of the stale tableData
        if (liveTableData[0].length > 1) newData = removeTableColumn(liveTableData, this.selectedColumn!);

        const bounds = this.getLiveBounds(view, container);
        if (!bounds) return;

        updateTable(view, bounds.liveFrom, bounds.liveTo, newData);
        this.selectedColumn = null;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();

        // Use liveTableData instead of the stale tableData
        const markdownCol = liveTableData
          .map((row, i) => {
            if (i === 1) return '| --- |';
            return `| ${row[this.selectedColumn!]} |`;
          })
          .join('\n');
        navigator.clipboard.writeText(markdownCol);
      }
    });

    container.addEventListener('focusout', e => {
      const relatedTarget = e.relatedTarget as Node | null;
      // If focus is leaving the container entirely (not moving to another child inside it)
      if (!relatedTarget || !container.contains(relatedTarget)) {
        if (this.selectedColumn !== null) {
          this.selectedColumn = null;
          selectColumn(container, null);
        }
      }
    });

    container.addEventListener('paste', e => {
      if (this.selectedColumn === null) return;
      e.preventDefault();
      e.stopPropagation();

      const cleanValues = cleanPastedColumn(e.clipboardData?.getData('text/plain') || '');
      const newData = [...tableData];
      let pasteIdx = 0;
      for (let i = 0; i < newData.length; i++) {
        if (i === 1) continue;
        if (cleanValues[pasteIdx] !== undefined) {
          newData[i][this.selectedColumn] = cleanValues[pasteIdx];
          pasteIdx++;
        }
      }

      const bounds = this.getLiveBounds(view, container);
      if (!bounds) return; // Silent abort if widget is dead

      updateTable(view, bounds.liveFrom, bounds.liveTo, newData);
      focusTableCell(view, bounds.liveFrom, 0, this.selectedColumn);
    });
    container.onmousedown = e => {
      if (e.target === container || e.target === scrollWrapper) {
        e.stopPropagation();
        e.preventDefault();

        const bounds = this.getLiveBounds(view, container);
        if (!bounds) return;
        const docLength = view.state.doc.length;
        const targetPos = Math.min(bounds.liveTo + 1, docLength);

        view.dispatch({
          selection: EditorSelection.cursor(targetPos),
          scrollIntoView: true,
        });
        view.focus();
      }
    };

    const table = document.createElement('table');
    table.className = 'cm-interactive-table';
    if (this.selectedColumn !== null) table.classList.add('has-selection');

    tableData.forEach((row, rIdx) => {
      if (rIdx === 1) return;
      const tr = document.createElement('tr');

      row.forEach((cellText, cIdx) => {
        const td = document.createElement(rIdx === 0 ? 'th' : 'td');

        if (this.selectedColumn === cIdx) td.classList.add('cm-table-col-selected');

        if (rIdx === 0 && !this.isViewMode) {
          const grip = document.createElement('div');
          grip.className = 'cm-table-col-grip';
          grip.draggable = true;
          grip.innerHTML = this.GRIP_ICON;
          const tableId = `table-${this.from}`;
          grip.onmousedown = e => {
            e.stopPropagation();
            const isAlreadySelected = this.selectedColumn === cIdx;
            this.selectedColumn = isAlreadySelected ? null : cIdx;
            selectColumn(container, this.selectedColumn);
            view.dispatch({ effects: [] });
          };

          grip.ondragstart = e => {
            e.dataTransfer?.setData('column-index', String(cIdx));
            e.dataTransfer?.setData('source-table-id', tableId);
            table.classList.add('is-dragging-active');
            grip.classList.add('is-dragging');
            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
          };

          grip.ondragenter = e => e.preventDefault();

          td.ondragover = e => {
            e.preventDefault();
            container.querySelectorAll('.drag-over-column').forEach(el => el.classList.remove('drag-over-column'));
            container.querySelectorAll(`td:nth-child(${cIdx + 1}), th:nth-child(${cIdx + 1})`).forEach(cell => cell.classList.add('drag-over-column'));
          };

          td.ondragleave = e => {
            e.preventDefault();
            td.classList.remove('drag-over');
          };
          td.ondrop = e => {
            e.preventDefault();
            container.querySelectorAll('.drag-over-column').forEach(el => el.classList.remove('drag-over-column'));
            table.classList.remove('is-dragging-active');

            const sourceTableId = e.dataTransfer?.getData('source-table-id');
            const fromIdx = parseInt(e.dataTransfer?.getData('column-index') || '-1');
            if (sourceTableId !== tableId) return;

            if (fromIdx === -1 || fromIdx === cIdx) return;

            const currentRaw = container.getAttribute('data-raw-text') || this.rawText;
            const liveTableData = currentRaw
              .split('\n')
              .filter(l => l.trim())
              .map(splitRow);

            const newData = moveTableColumn(liveTableData, fromIdx, cIdx);

            const bounds = this.getLiveBounds(view, container);
            if (!bounds) return;

            this.selectedColumn = cIdx;
            updateTable(view, bounds.liveFrom, bounds.liveTo, newData);

            requestAnimationFrame(() => {
              selectColumn(container, this.selectedColumn);
            });
          };

          td.ondragenter = e => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
          };

          td.appendChild(grip);
        }

        const editor = document.createElement('div');
        editor.className = 'cm-table-cell-editor';
        editor.contentEditable = `${!this.isViewMode}`;

        const rawTextValue = cellText.replace(/\\\|/g, '|');
        editor.dataset.raw = rawTextValue;

        editor.innerHTML = parseCellHTML(rawTextValue);

        if (!this.isViewMode) {
          editor.addEventListener('focus', () => {
            if (editor.innerHTML !== editor.dataset.raw) {
              editor.textContent = editor.dataset.raw || '';
            }
          });

          editor.addEventListener('blur', () => {
            const currentRaw = editor.textContent || '';
            editor.dataset.raw = currentRaw;
            editor.innerHTML = parseCellHTML(currentRaw);
          });
        }
        editor.addEventListener('input', () => {
          const newText = editor.textContent || '';

          const bounds = this.getLiveBounds(view, container);
          if (!bounds) return;

          const liveText = view.state.doc.sliceString(bounds.liveFrom, bounds.liveTo);
          const liveTableData = liveText
            .split('\n')
            .filter(l => l.trim())
            .map(splitRow);

          liveTableData[rIdx][cIdx] = newText;

          updateTable(view, bounds.liveFrom, bounds.liveTo, liveTableData);

          requestAnimationFrame(() => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;

            const range = sel.getRangeAt(0);
            const caretRect = range.getBoundingClientRect();
            const wrapperRect = scrollWrapper.getBoundingClientRect();

            if (caretRect.width === 0 && caretRect.height === 0) return;

            const caretRelativeX = caretRect.left - wrapperRect.left + scrollWrapper.scrollLeft;
            const targetScrollLeft = caretRelativeX - wrapperRect.width / 2;

            scrollWrapper.scrollTo({
              left: Math.max(0, targetScrollLeft),
              behavior: 'smooth',
            });
          });
        });
        editor.addEventListener('copy', e => {
          e.stopPropagation();
          e.preventDefault();
          const selection = window.getSelection();
          if (selection) {
            e.clipboardData?.setData('text/plain', selection.toString());
          }
        });

        // 2. CUT: Force plain text copy, then delete the selection
        editor.addEventListener('cut', e => {
          e.stopPropagation();
          e.preventDefault();
          const selection = window.getSelection();
          if (selection) {
            e.clipboardData?.setData('text/plain', selection.toString());

            // Delete the highlighted text naturally
            document.execCommand('delete', false, undefined);
            // (Note: This automatically triggers your 'input' listener to sync with CodeMirror!)
          }
        });

        // 3. PASTE: The most important fix. Strip HTML and Newlines.
        editor.addEventListener('paste', e => {
          e.stopPropagation();
          e.preventDefault(); // STOP the browser from pasting HTML elements!

          // Grab only the raw text from the clipboard
          const pastedText = e.clipboardData?.getData('text/plain') || '';

          // Tables break if a cell contains a newline. Replace newlines with spaces.
          const cleanText = pastedText.replace(/\r?\n/g, ' ');

          // Insert the clean text exactly where the cursor is.
          // We use execCommand because it natively moves the caret forward and
          // perfectly triggers your existing 'input' event listener to save the data!
          document.execCommand('insertText', false, cleanText);
        });
        editor.addEventListener('keydown', e => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            e.stopPropagation();
            const range = document.createRange();
            range.selectNodeContents(editor);
            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
            editor.focus();
          }

          if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key)) return e.stopPropagation();
          if (this.isViewMode) return;
          const isUp = e.key === 'ArrowUp';
          const isDown = e.key === 'ArrowDown';
          const isTab = e.key === 'Tab';
          const isEnter = e.key === 'Enter';
          if (!isUp && !isDown && !isTab && !isEnter) return;
          e.stopPropagation();

          if (isEnter) return handleTableEnterNavigation(this, view, tableData, editor);
          if (isTab) return handleTableTabNavigation(this, view, tableData, editor, e.shiftKey);

          const isFirstRow = rIdx === 0;
          const hasNoBodyRows = tableData.length <= 2;
          const isLastRow = rIdx === tableData.length - 1 || (isFirstRow && hasNoBodyRows);

          const getExitPos = (targetLineNum: number) => {
            const targetLine = view.state.doc.line(targetLineNum);
            const selection = window.getSelection();
            const offset = selection ? selection.anchorOffset : 0;
            return Math.min(targetLine.from + offset, targetLine.to);
          };

          if (isUp && isFirstRow) {
            e.preventDefault();
            const bounds = this.getLiveBounds(view, container);
            if (!bounds) return;
            const line = view.state.doc.lineAt(bounds.liveFrom);
            if (line.number > 1) {
              view.focus();
              view.dispatch({
                selection: EditorSelection.cursor(getExitPos(line.number - 1)),
                scrollIntoView: true,
              });
            }
            return;
          }

          if (isDown && isLastRow) {
            e.preventDefault();
            const bounds = this.getLiveBounds(view, container);
            if (!bounds) return;
            const line = view.state.doc.lineAt(bounds.liveTo);
            if (line.number < view.state.doc.lines) {
              view.focus();
              view.dispatch({
                selection: EditorSelection.cursor(getExitPos(line.number + 1)),
                scrollIntoView: true,
              });
            }
            return;
          }

          e.preventDefault();
          let targetRow = isUp ? rIdx - 1 : rIdx + 1;
          if (targetRow === 1) targetRow = isUp ? 0 : 2;
          const cssRowIndex = targetRow > 1 ? targetRow : targetRow + 1;
          const targetEditor = container.querySelector(
            `tr:nth-child(${cssRowIndex}) :is(td, th):nth-child(${cIdx + 1}) .cm-table-cell-editor`
          ) as HTMLElement | null;

          if (targetEditor) {
            targetEditor.focus();
          }
        });

        editor.onmousedown = e => {
          if (this.isViewMode) return;
          e.stopPropagation();
          if (this.selectedColumn !== null) {
            this.selectedColumn = null;
            container.querySelectorAll('.cm-table-col-selected').forEach(el => el.classList.remove('cm-table-col-selected'));
          }
          const pos = view.posAtDOM(editor);
          view.dispatch({
            selection: { anchor: pos },
            scrollIntoView: false,
          });
        };

        td.appendChild(editor);
        tr.appendChild(td);
      });

      table.appendChild(tr);
    });

    if (!this.isViewMode && view.hasFocus) {
      const head = view.state.selection.main.head;

      // ✅ Use live bounds for initial focus setup
      const bounds = this.getLiveBounds(view, container);
      const isNewlyCreated = bounds && head >= bounds.liveFrom && head <= bounds.liveTo;

      if (isNewlyCreated) {
        const performSetup = () => {
          if (!container.isConnected) return;

          const doc = view.state.doc;
          const changes: ChangeSpec[] = [];

          if (bounds.liveFrom === 0) changes.push({ from: 0, insert: '\n' });
          if (bounds.liveTo === doc.length) changes.push({ from: doc.length, insert: '\n' });

          if (changes.length > 0) {
            view.dispatch({
              changes,
              annotations: [Transaction.userEvent.of('input.type')],
            });
          }

          const firstCell = container.querySelector('.cm-table-cell-editor') as HTMLElement;
          if (firstCell && document.activeElement !== firstCell) {
            firstCell.focus({ preventScroll: true });
            window.getSelection()?.collapse(firstCell.firstChild || firstCell, 0);
          }
        };

        queueMicrotask(performSetup);
      }
    }

    requestAnimationFrame(() => {
      if (!view.dom.isConnected || !view.hasFocus) return;

      let pos: number;
      try {
        pos = view.posAtDOM(container);
      } catch {
        return;
      }
      if (pos < 0) return;
      const doc = view.state.doc;
      const line = doc.lineAt(pos);
      const changes: ChangeSpec[] = [];
      const liveTo = pos + this.rawText.length;

      if (line.number > 1) {
        const prevLine = doc.line(line.number - 1);
        if (prevLine.text.trim() !== '' || prevLine.text.includes('|')) changes.push({ from: prevLine.to, insert: '\n' });
      }
      if (line.number === 1) changes.push({ from: 0, insert: '\n' });
      if (liveTo === doc.length) changes.push({ from: doc.length, insert: '\n' });

      if (changes.length > 0)
        view.dispatch({
          changes,
          annotations: [Transaction.userEvent.of('input.type'), Transaction.addToHistory.of(true)],
        });
    });

    const colBtn = createTableActionButton('col', () => {
      const bounds = this.getLiveBounds(view, container);
      if (!bounds) return;
      const next = addTableColumn(tableData);
      updateTable(view, bounds.liveFrom, bounds.liveTo, next);
      focusTableCell(view, bounds.liveFrom, 0, next[0].length - 1);
    });
    if (this.isViewMode) colBtn.style.display = 'none'; // Hide if view mode
    inner.appendChild(colBtn);

    const rowBtn = createTableActionButton('row', () => {
      const bounds = this.getLiveBounds(view, container);
      if (!bounds) return;
      const next = addTableRow(tableData);
      updateTable(view, bounds.liveFrom, bounds.liveTo, next);
      focusTableCell(view, bounds.liveFrom, next.length - 1, 0);
    });
    if (this.isViewMode) rowBtn.style.display = 'none'; // Hide if view mode
    inner.appendChild(rowBtn);

    inner.appendChild(table);
    scrollWrapper.appendChild(inner);
    container.appendChild(scrollWrapper);

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        if (height > 0) {
          // Save the exact pixel height to our memory bank!
          tableHeightCache.set(this.rawText, height);

          // Keep the minHeight synced so the scrollbar stays locked
          container.style.minHeight = `${height}px`;
        }
      }
    });

    // Start watching the container
    observer.observe(container);

    // Attach the observer to the DOM node so we can clean it up later
    (container as HTMLDivElement & { _heightObserver?: ResizeObserver })._heightObserver = observer;
    return container;
  }

  ignoreEvent(event: Event): boolean {
    if (event instanceof KeyboardEvent) {
      const target = event.target as HTMLElement;
      // if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') return true;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') return true;
      if (['copy', 'paste', 'cut'].includes(event.type)) return true;
      if (target.closest('.cm-table-cell-editor')) {
        return ['ArrowUp', 'ArrowDown', 'Tab', 'Enter'].includes(event.key);
      }
    }
    return false;
  }
  updateDOM(dom: HTMLElement): boolean {
    const oldViewMode = dom.getAttribute('data-view-mode');

    // 🚨 THE FIX: Do NOT return false! We patch the UI in-place to protect the scroll!
    if (oldViewMode !== String(this.isViewMode)) {
      dom.setAttribute('data-view-mode', String(this.isViewMode));

      // 1. Flip editing mode on all cells instantly
      dom.querySelectorAll('.cm-table-cell-editor').forEach(editor => {
        (editor as HTMLElement).contentEditable = String(!this.isViewMode);
      });

      // 2. Hide or show the column grips
      dom.querySelectorAll('.cm-table-col-grip').forEach(grip => {
        (grip as HTMLElement).style.display = this.isViewMode ? 'none' : '';
      });

      // 3. Hide or show the action buttons (They are siblings to the table inside 'inner')
      const inner = dom.querySelector('.cm-table-inner');
      if (inner) {
        Array.from(inner.children).forEach(child => {
          if (child.tagName.toLowerCase() !== 'table') {
            (child as HTMLElement).style.display = this.isViewMode ? 'none' : '';
          }
        });
      }
    }
    const oldRaw = dom.getAttribute('data-raw-text') || '';
    if (oldRaw === this.rawText) return true;

    const oldLines = oldRaw.split('\n').filter(l => l.trim());
    const newLines = this.rawText.split('\n').filter(l => l.trim());

    if (oldLines.length !== newLines.length) return false;

    const oldTableData = oldLines.map(splitRow);
    const newTableData = newLines.map(splitRow);

    if (oldTableData[0].length !== newTableData[0].length) return false;

    newTableData.forEach((row, rIdx) => {
      if (rIdx === 1) return;
      row.forEach((cellText, cIdx) => {
        if (cellText !== oldTableData[rIdx][cIdx]) {
          const domRowIdx = rIdx === 0 ? 1 : rIdx;
          const editor = dom.querySelector(`tr:nth-child(${domRowIdx}) :is(td, th):nth-child(${cIdx + 1}) .cm-table-cell-editor`) as HTMLElement;

          if (editor) {
            const rawValue = cellText.replace(/\\\|/g, '|');

            editor.dataset.raw = rawValue;

            const currentText = editor.textContent || '';
            const isUserTyping = document.activeElement === editor && currentText.trim() === rawValue.trim();

            if (!isUserTyping) {
              editor.innerHTML = parseCellHTML(rawValue);
            }
          }
        }
      });
    });

    dom.setAttribute('data-raw-text', this.rawText);

    return true;
  }
  eq(other: TablePreviewWidget) {
    return (
      other.from === this.from &&
      other.to === this.to &&
      other.rawText === this.rawText &&
      other.selectedColumn === this.selectedColumn &&
      other.isViewMode === this.isViewMode
    );
  }
}
