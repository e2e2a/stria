import { EditorView, WidgetType } from '@codemirror/view';
import { marked } from 'marked';
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
