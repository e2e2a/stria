import { EditorView, WidgetType } from '@codemirror/view';
import { marked } from 'marked';
import { getLanguageLabel } from '../../helpers/editor/getLanguageLabel';
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
import katex from 'katex';
import 'katex/dist/katex.min.css';

export class BulletWidget extends WidgetType {
  constructor(readonly active: boolean) {
    super();
  }
  toDOM() {
    const content = this.active ? '-' : '•';
    const span = document.createElement('span');
    span.textContent = content;
    span.style.marginLeft = '12px';
    return span;
  }

  eq(other: BulletWidget) {
    return this.active === other.active;
  }

  ignoreEvent() {
    return false;
  }
}
function parseCellHTML(text: string): string {
  if (!text) return '';
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); // Prevent XSS

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

  toDOM(view: EditorView): HTMLElement {
    const lines = this.rawText.split('\n').filter(l => l.trim());
    const tableData = lines.map(line => splitRow(line));
    const container = document.createElement('div');
    container.className = 'cm-table-widget-container';
    container.setAttribute('data-from', String(this.from));
    container.setAttribute('data-to', String(this.to));
    container.tabIndex = -1;
    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'cm-table-scroll-wrapper';
    scrollWrapper.tabIndex = -1;
    const inner = document.createElement('div');
    inner.className = 'cm-table-inner';

    container.addEventListener('keydown', e => {
      if (this.selectedColumn === null) return;

      if (e.key === 'Backspace' || e.key === 'Delete' || ((e.ctrlKey || e.metaKey) && e.key === 'x')) {
        e.preventDefault();
        let newData: string[][] = [];
        if (tableData[0].length > 1) newData = removeTableColumn(tableData, this.selectedColumn!);

        updateTable(view, this.from, this.to, newData);
        this.selectedColumn = null;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        const markdownCol = tableData
          .map((row, i) => {
            if (i === 1) return '| --- |';
            return `| ${row[this.selectedColumn!]} |`;
          })
          .join('\n');
        navigator.clipboard.writeText(markdownCol);
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
      updateTable(view, this.from, this.to, newData);
      focusTableCell(view, this.from, 0, this.selectedColumn);
    });
    container.onmousedown = e => {
      if (e.target === container || e.target === scrollWrapper) {
        e.stopPropagation();
        e.preventDefault();

        const docLength = view.state.doc.length;
        const targetPos = Math.min(this.to + 1, docLength);

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
            this.selectedColumn = null;
            const isSelecting = this.selectedColumn !== cIdx;
            this.selectedColumn = isSelecting ? cIdx : null;
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
            const sourceTableId = e.dataTransfer?.getData('source-table-id');
            const fromIdx = parseInt(e.dataTransfer?.getData('column-index') || '-1');
            if (sourceTableId !== tableId) return container.querySelectorAll('.drag-over-column').forEach(el => el.classList.remove('drag-over-column'));

            const newData = moveTableColumn(tableData, fromIdx, cIdx);
            if (fromIdx !== -1 && fromIdx !== cIdx) updateTable(view, this.from, this.to, newData);
          };
          td.ondragenter = e => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
          };

          td.appendChild(grip);
        }

        // const editor = document.createElement('div');
        // editor.className = 'cm-table-cell-editor';
        // editor.contentEditable = `${!this.isViewMode}`;
        // editor.textContent = cellText.replace(/\\\|/g, '|');
        const editor = document.createElement('div');
        editor.className = 'cm-table-cell-editor';
        editor.contentEditable = `${!this.isViewMode}`;

        const rawTextValue = cellText.replace(/\\\|/g, '|');
        editor.dataset.raw = rawTextValue; // Store the raw markdown safely

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

        let debounceTimer: ReturnType<typeof setTimeout>;
        editor.addEventListener('input', () => {
          const newText = editor.textContent || '';
          if (newText === cellText) return;

          const selection = window.getSelection();
          const offset = selection?.anchorOffset || 0;

          clearTimeout(debounceTimer);

          debounceTimer = setTimeout(() => {
            const newData = [...tableData];
            newData[rIdx][cIdx] = newText;

            updateTable(view, this.from, this.to, newData);

            requestAnimationFrame(() => {
              const newWidget = view.dom.querySelector(`.cm-table-widget-container[data-from="${this.from}"]`);
              const domRowIdx = rIdx === 0 ? 1 : rIdx;
              const selector = `tr:nth-child(${domRowIdx}) :is(td, th):nth-child(${cIdx + 1}) .cm-table-cell-editor`;
              const newEditor = newWidget?.querySelector(selector) as HTMLElement;

              if (newEditor) {
                newEditor.focus();
                if (!newEditor.firstChild) newEditor.appendChild(document.createTextNode(''));

                const s = window.getSelection();
                const r = document.createRange();
                const textNode = newEditor.firstChild!;
                r.setStart(textNode, Math.min(offset, textNode.textContent?.length || 0));
                r.collapse(true);
                s?.removeAllRanges();
                s?.addRange(r);
              }
            });
          }, 0);
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
          // e.preventDefault();
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
            const line = view.state.doc.lineAt(this.from);
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
            const line = view.state.doc.lineAt(this.to);
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

        editor.addEventListener('cut', e => e.stopPropagation());
        editor.addEventListener('copy', e => e.stopPropagation());
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
      const isNewlyCreated = head >= this.from && head <= this.to;

      if (isNewlyCreated) {
        const performSetup = () => {
          if (!container.isConnected) return;

          const doc = view.state.doc;
          const changes: ChangeSpec[] = [];

          if (this.from === 0) changes.push({ from: 0, insert: '\n' });
          if (this.to === doc.length) changes.push({ from: doc.length, insert: '\n' });

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

      if (line.number > 1) {
        const prevLine = doc.line(line.number - 1);
        if (prevLine.text.trim() !== '' || prevLine.text.includes('|')) changes.push({ from: prevLine.to, insert: '\n' });
      }
      if (line.number === 1) changes.push({ from: 0, insert: '\n' });
      if (this.to === doc.length) changes.push({ from: doc.length, insert: '\n' });
      if (changes.length > 0)
        view.dispatch({
          changes,
          annotations: [Transaction.userEvent.of('input.type'), Transaction.addToHistory.of(true)],
          // selection: view.state.selection,
        });
    });

    if (!this.isViewMode) {
      inner.appendChild(
        createTableActionButton('col', () => {
          const next = addTableColumn(tableData);
          updateTable(view, this.from, this.to, next);
          focusTableCell(view, this.from, 0, next[0].length - 1);
        })
      );

      inner.appendChild(
        createTableActionButton('row', () => {
          const next = addTableRow(tableData);
          updateTable(view, this.from, this.to, next);
          focusTableCell(view, this.from, next.length - 1, 0);
        })
      );
    }
    inner.appendChild(table);
    scrollWrapper.appendChild(inner);
    container.appendChild(scrollWrapper);
    return container;
  }

  ignoreEvent(event: Event): boolean {
    if (event instanceof KeyboardEvent) {
      const target = event.target as HTMLElement;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') return true;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') return true;
      if (['copy', 'paste', 'cut'].includes(event.type)) return true;
      if (target.closest('.cm-table-cell-editor')) {
        return ['ArrowUp', 'ArrowDown', 'Tab', 'Enter'].includes(event.key);
      }
    }
    return false;
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

export class MarkdownLivePreviewWidget extends WidgetType {
  constructor(
    private content: string,
    private pos: number
  ) {
    super();
  }

  toDOM(view: EditorView) {
    // 1. Determine heading level
    const match = this.content.match(/^(#{1,6})\s/);
    const level = match ? match[1].length : 0;

    const tagName = level > 0 ? `h${level}` : 'span';
    const dom = document.createElement(tagName);

    dom.className = 'markdown-render-inline';
    if (level > 0) dom.classList.add(`cm-h${level}`);

    const rawText = level > 0 ? this.content.replace(/^#{1,6}\s/, '') : this.content;
    dom.innerHTML = String(marked.parseInline(rawText)).trim();

    dom.style.display = 'inline-block';
    dom.style.margin = '0';

    dom.onclick = e => {
      e.preventDefault();
      view.dispatch({
        selection: { anchor: this.pos },
        scrollIntoView: false,
      });
      view.focus();
    };

    return dom;
  }

  eq(other: MarkdownLivePreviewWidget) {
    return other.content === this.content && other.pos === this.pos;
  }
}

export class FenchCodeWidget extends WidgetType {
  constructor(
    readonly lang: string,
    readonly code: string
  ) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-code-header-container';

    const button = document.createElement('button');
    button.className = 'cm-code-copy-btn';

    const labelText = getLanguageLabel(this.lang);
    button.textContent = labelText;

    button.onclick = e => {
      e.preventDefault();
      navigator.clipboard.writeText(this.code);

      const originalText = button.textContent;
      button.textContent = 'copied!';
      button.classList.add('copied');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
    };
    wrapper.append(button);
    return wrapper;
  }
  eq(other: FenchCodeWidget) {
    return other.lang === this.lang;
  }
}

export class ImageWidget extends WidgetType {
  constructor(
    readonly url: string,
    readonly alt: string,
    readonly pos: number
  ) {
    super();
  }

  eq(other: ImageWidget) {
    return other.url === this.url && other.alt === this.alt;
  }
  toDOM(view: EditorView) {
    const wrapper = document.createElement('span');
    wrapper.contentEditable = 'false';
    wrapper.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img');
    img.src = this.url;
    img.alt = this.alt;

    img.className = 'cm-image';
    img.onclick = e => {
      e.preventDefault();
      if (!view?.dispatch) return;
      if (view.state.selection.main.empty) {
        view.dispatch({
          // selection: { anchor: this.pos, head: this.pos },
          selection: { anchor: this.pos },

          scrollIntoView: false,
        });
      }
      // view.focus();
    };

    wrapper.appendChild(img);
    return wrapper;
  }

  ignoreEvent() {
    return true;
  }
}

export class BlockquoteContainerWidget extends WidgetType {
  constructor(readonly level: number) {
    super();
  }

  toDOM() {
    const container = document.createElement('div');
    container.className = `cm-blockquote-container cm-bq-level-${this.level}`;
    return container;
  }

  ignoreEvent() {
    return false;
  }

  eq(other: BlockquoteContainerWidget) {
    return other.level === this.level;
  }
}

export class CalloutWidget extends WidgetType {
  constructor(
    readonly type: string,
    readonly rawText: string
  ) {
    super();
  }

  getIcon(type: string) {
    const icons: Record<string, string> = {
      note: '📝',
      info: 'ℹ️',
      todo: '✅',
      warning: '⚠️',
      error: '🛑',
      success: '✔️',
      bug: '🐛',
      example: '🧪',
    };
    return icons[type] || '📝';
  }

  toDOM(view: EditorView) {
    const container = document.createElement('div');
    container.className = `cm-callout cm-callout-${this.type}`;
    container.tabIndex = -1;
    container.oncontextmenu = () => {
      const pos = view.posAtDOM(container);
      window.dispatchEvent(new CustomEvent('set-editor-context', { detail: { type: 'callout', pos } }));
    };
    const btn = document.createElement('button');
    btn.className = 'cm-callout-toggle';
    btn.innerHTML = `<span>&lt;/&gt;</span>`;
    container.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      if (!view) return;
      const currentPos = view.posAtDOM(container);
      view.dispatch({
        selection: { anchor: currentPos },
        scrollIntoView: true,
      });
      view.focus();
    };
    btn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      if (!view) return;
      const currentPos = view.posAtDOM(container);
      view.dispatch({
        selection: { anchor: currentPos },
        scrollIntoView: true,
      });
      view.focus();
    };

    const content = document.createElement('div');
    content.className = 'cm-callout-content';

    const lines = this.rawText.split('\n');

    const firstLineClean = lines[0].replace(/^(\s{0,3})>\s?\[!\w+\]\s?/, '').trim();
    const titleText = firstLineClean || this.type.toUpperCase();

    const bodyText = lines
      .slice(1)
      .map(line => line.replace(/^(\s{0,3})>\s?/, ''))
      .join('\n');

    // Header Construction
    const header = document.createElement('div');
    header.className = 'cm-callout-header';

    const icon = document.createElement('span');
    icon.innerText = this.getIcon(this.type);

    const title = document.createElement('span');
    title.className = 'cm-callout-title';
    title.innerText = titleText;

    header.appendChild(icon);
    header.appendChild(title);

    const body = document.createElement('div');
    body.className = 'cm-callout-body';
    const parsedContent = marked.parse(bodyText) as string;
    const temp = document.createElement('div');
    temp.innerHTML = parsedContent;
    const cleanContent = Array.from(temp.childNodes)
      .map(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '') {
          return null;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          Array.from(element.childNodes).forEach(child => {
            if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim() === '') {
              child.remove();
            }
          });
          return element.outerHTML;
        }
        return node.textContent;
      })
      .filter(Boolean)
      .join('');

    body.innerHTML = cleanContent as string;

    content.appendChild(header);
    content.appendChild(body);

    container.appendChild(btn);
    container.appendChild(content);

    return container;
  }

  eq(other: CalloutWidget) {
    return other.rawText === this.rawText && other.type === this.type;
  }
}

export class CheckboxWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly from: number,
    readonly to: number
  ) {
    super();
  }

  eq(other: CheckboxWidget) {
    return other.checked === this.checked;
  }

  toDOM(view: EditorView) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'cm-task-checkbox';
    input.checked = this.checked;
    input.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
    });
    input.onclick = e => {
      e.preventDefault();

      const text = view.state.doc.lineAt(this.from).text;
      const bracketIndex = text.indexOf('[');
      if (bracketIndex !== -1) {
        const pos = this.from + bracketIndex + 1;
        const newValue = this.checked ? ' ' : 'x';

        view.dispatch({
          changes: { from: pos, to: pos + 1, insert: newValue },
        });
      }
    };

    return input;
  }

  ignoreEvent() {
    return false;
  }
}

export class MathWidget extends WidgetType {
  constructor(
    readonly code: string,
    readonly pos: number
  ) {
    super();
  }

  toDOM(view: EditorView) {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'z-[100] relative group w-full my-2';

    const container = document.createElement('div');
    container.className =
      'border border-transparent hover:border-border transition-colors relative block w-full max-w-full box-border z-10 select-none leading-[0] cursor-pointer';

    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'block! w-full! max-w-full! relative contain-[inline-size] overflow-x-auto! overflow-y-hidden!';

    const renderArea = document.createElement('div');
    renderArea.className = 'relative inline-block pr-[5px] pb-[5px] w-auto! min-w-full text-center';

    const getCurrentPos = () => {
      try {
        return view.posAtDOM(mainContainer);
      } catch {
        return this.pos;
      }
    };

    container.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      view.requestMeasure();
      const currentPos = getCurrentPos();
      view.dispatch({ selection: { anchor: currentPos }, scrollIntoView: true, userEvent: 'select' });
      view.focus();
    };

    const btn = document.createElement('button');
    btn.className =
      'bg-background hover:bg-accent/60 flex text-accent-foreground cursor-pointer text-[11px] border hover:border-border items-center z-20 rounded-md absolute top-[6px] right-[8px] opacity-0 group-hover:opacity-100 transition-opacity py-[4px] px-[8px]';
    btn.innerHTML = `<span>&lt;/&gt;</span>`;
    btn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      view.requestMeasure();
      const currentPos = getCurrentPos();
      view.dispatch({
        selection: { anchor: currentPos },
        scrollIntoView: true,
        userEvent: 'select',
      });
      view.focus();
    };
    scrollWrapper.appendChild(renderArea);
    container.appendChild(scrollWrapper);
    mainContainer.appendChild(btn);
    mainContainer.appendChild(container);

    requestAnimationFrame(() => {
      try {
        katex.render(this.code, renderArea, {
          displayMode: true,
          throwOnError: true,
          output: 'htmlAndMathml',
        });
      } catch {
        renderArea.className = 'w-full py-4 text-center font-mono text-foreground text-sm';
        renderArea.innerHTML = `<span>$$${this.code}$$</span>`;
        btn.style.display = 'none';
      }
    });

    return mainContainer;
  }

  eq(other: MathWidget) {
    return other.code === this.code;
  }
}

export class InlineMathWidget extends WidgetType {
  constructor(
    readonly code: string,
    readonly pos: number
  ) {
    super();
  }

  toDOM(view: EditorView) {
    const span = document.createElement('span');
    span.className = 'cm-math-inline cursor-pointer px-1 rounded hover:bg-muted/50 transition-colors';

    const getCurrentPos = () => {
      try {
        return view.posAtDOM(span);
      } catch {
        return this.pos;
      }
    };

    span.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      view.requestMeasure();
      const currentPos = getCurrentPos();
      view.dispatch({ selection: { anchor: currentPos }, scrollIntoView: true });
      view.focus();
    };

    requestAnimationFrame(() => {
      try {
        katex.render(this.code, span, {
          displayMode: false,
          throwOnError: true,
          output: 'htmlAndMathml',
        });
      } catch {
        span.textContent = `$${this.code}$`;
        span.classList.add('font-mono', 'text-foreground');
      }
    });

    return span;
  }

  eq(other: InlineMathWidget) {
    return other.code === this.code;
  }
}
