import { EditorView, WidgetType } from '@uiw/react-codemirror';
import mermaid from 'mermaid';

// mermaid.initialize({ startOnLoad: false, theme: 'dark' });
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
    curve: 'basis',
    nodeSpacing: 50,
    rankSpacing: 50,
  },
  sequence: { useMaxWidth: false },
  gantt: { useMaxWidth: false },
});

export class MermaidWidget extends WidgetType {
  constructor(
    readonly code: string,
    readonly pos: number
  ) {
    super();
  }

  toDOM(view: EditorView) {
    const mainContainer = document.createElement('div');
    const container = document.createElement('div');
    mainContainer.className = 'z-100 relative group';

    container.className =
      'group border border-transparent hover:border-border transition-colors relative block w-full max-w-full box-border z-10 select-none leading-[0] overflow-x-auto! overflow-y-hidden!';
    container.tabIndex = -1;

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
      'bg-background hover:bg-accent/60 flex text-accent-foreground cursor-pointer text-[11px] border hover:border-border items-center z-20 rounded-md absolute top-[6px] right-[8px] opacity-0 group-hover:opacity-100 transition-opacity py-[6px]! px-[2px]';

    btn.innerHTML = `<span>&lt;/&gt;</span>`;
    btn.tabIndex = -1;
    btn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();

      const state = view.state;
      const blockStartLine = state.doc.lineAt(this.pos);

      // Always place cursor on first content line (opening fence + 1)
      const firstContentLine = state.doc.line(blockStartLine.number + 1);

      view.dispatch({
        selection: { anchor: firstContentLine.from },
        scrollIntoView: true,
        userEvent: 'select',
      });
      view.focus();
    };

    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'block! w-full! max-w-full! relative contain-[inline-size]';

    const renderArea = document.createElement('div');
    renderArea.className = 'mermaid-render-area min-h-auto h-auto relative inline-block pr-[5px] pb-[5px] w-auto! min-w-full';
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
    renderArea.id = id;

    scrollWrapper.appendChild(renderArea);
    container.appendChild(scrollWrapper);
    mainContainer.appendChild(btn);
    mainContainer.appendChild(container);
    const test = async () => {
      try {
        const isValid = await mermaid.parse(this.code, { suppressErrors: true });
        if (!isValid) throw new Error('Syntax Error');

        const { svg } = await mermaid.render(`${id}-svg`, this.code);
        renderArea.innerHTML = svg;

        const svgElement = renderArea.querySelector('svg');
        if (svgElement) {
          svgElement.style.maxWidth = 'none';
          svgElement.style.width = 'auto';
          svgElement.style.height = 'auto';
          // svgElement.setAttribute('height', 'auto');
        }
        view.requestMeasure();
      } catch {
        renderArea.innerHTML = `<div style="line-height: normal; color: #ef4444; font-size: 12px; padding: 10px;">Syntax Error</div>`;
        view.requestMeasure();
      }
    };
    test();
    return mainContainer;
  }
  eq(other: MermaidWidget) {
    return other.code === this.code;
  }
}
