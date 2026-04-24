import { EditorView, WidgetType } from '@uiw/react-codemirror';
import mermaid from 'mermaid';
import { estimateMermaidHeight } from '../decorations/mermaid-build-decoration';
import { mermaidHeightCache, mermaidSvgCache } from '../plugins/mermaid';

export function resolveTheme(theme: string) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default';
  }
  return theme === 'dark' || theme === '' ? 'dark' : 'default';
}

export class MermaidWidget extends WidgetType {
  constructor(
    readonly code: string,
    readonly from: number,
    readonly to: number,
    readonly theme: string
  ) {
    super();
  }

  get estimatedHeight() {
    return mermaidHeightCache.get(this.code) ?? estimateMermaidHeight(this.code);
  }
  toDOM(view: EditorView) {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'z-100 relative group';

    const cachedHeight = mermaidHeightCache.get(this.code);
    mainContainer.style.minHeight = `${cachedHeight ?? estimateMermaidHeight(this.code)}px`;

    // if (!mermaidSvgCache.has(this.code)) {
    //   // not ready yet — wait for prerenderAllThenBuild to fill cache
    //   const interval = setInterval(() => {
    //     const svg = mermaidSvgCache.get(this.code);
    //     if (!svg) return;
    //     clearInterval(interval);
    //     const h = mermaidHeightCache.get(this.code);
    //     if (h) mainContainer.style.minHeight = `${h}px`;
    //     mountContent(mainContainer, this.code, this.pos, view);
    //   }, 30);
    //   return mainContainer;
    // }
    mermaid.initialize({
      startOnLoad: false,
      theme: resolveTheme(this.theme),
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

    const svgCacheKey = `${this.theme}-${this.code}`;
    if (!mermaidSvgCache.has(svgCacheKey)) {
      renderMermaid(this.code, mainContainer, this.from, this.to, view, svgCacheKey);
      return mainContainer;
    }
    mountContent(mainContainer, this.code, this.from, this.to, view, svgCacheKey);
    return mainContainer;
  }
  eq(other: MermaidWidget) {
    return (
      other.code === this.code &&
      other.from === this.from &&
      other.theme === this.theme &&
      mermaidHeightCache.get(this.code) === mermaidHeightCache.get(other.code) &&
      mermaidSvgCache.get(`${this.theme}-${this.code}`) === mermaidSvgCache.get(`${other.theme}-${other.code}`)
    );
  }
}

async function renderMermaid(code: string, container: HTMLElement, from: number, to: number, view: EditorView, svgCacheKey: string) {
  try {
    const id = `live-${crypto.randomUUID()}`;
    const { svg } = await mermaid.render(id, code);

    mermaidSvgCache.set(svgCacheKey, svg);

    const temp = document.createElement('div');
    temp.style.cssText = 'position:absolute;visibility:hidden;width:800px';
    temp.innerHTML = svg;
    document.body.appendChild(temp);

    const height = temp.getBoundingClientRect().height;
    temp.remove();

    mermaidHeightCache.set(code, height);

    container.style.minHeight = `${height}px`;
    container.innerHTML = '';

    mountContent(container, code, from, to, view, svgCacheKey);
  } catch (e) {
    console.error('Mermaid render failed:', e);
  }
}

function mountContent(mainContainer: HTMLElement, code: string, from: number, to: number, view: EditorView, svgCacheKey: string) {
  const svg = mermaidSvgCache.get(svgCacheKey)!;

  const container = document.createElement('div');
  container.className =
    'group border border-transparent hover:border-border transition-colors relative block w-full max-w-full box-border z-10 select-none leading-[0] overflow-x-auto! overflow-y-hidden!';
  container.tabIndex = -1;

  const button = document.createElement('button');
  button.textContent = 'Edit';
  button.className = 'absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-700 text-white px-2 py-1 rounded';

  button.onclick = e => {
    e.stopPropagation();
    view.focus();
    const safeFrom = Math.min(view.state.doc.length, from + 11);
    const safeTo = Math.min(view.state.doc.length, to - 4);
    view.dispatch({
      selection: {
        anchor: safeTo,
        head: safeFrom,
      },
      scrollIntoView: true,
      effects: EditorView.scrollIntoView(from, { y: 'center' }),
    });
  };

  const scrollWrapper = document.createElement('div');
  scrollWrapper.className = 'block! w-full! max-w-full! relative contain-[inline-size]';

  const renderArea = document.createElement('div');
  renderArea.className = 'mermaid-render-area min-h-auto h-auto relative inline-block pr-[5px] pb-[5px] w-auto! min-w-full';
  renderArea.innerHTML = svg;

  const svgEl = renderArea.querySelector('svg');
  if (svgEl) {
    svgEl.style.maxWidth = 'none';
    svgEl.style.width = 'auto';
    svgEl.style.height = 'auto';
  }

  scrollWrapper.appendChild(renderArea);
  container.appendChild(scrollWrapper);
  container.appendChild(button);
  mainContainer.appendChild(container);

  // silently update height cache
  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      const h = entry.contentRect.height;
      if (h > 10) {
        mermaidHeightCache.set(code, h);
        observer.disconnect();
      }
    }
  });
  observer.observe(mainContainer);
}
