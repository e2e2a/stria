import { WidgetType } from '@codemirror/view';

export class DragHandleWidget extends WidgetType {
  constructor(
    readonly pos: number,
    readonly index: number,
    readonly type: 'start' | 'end',
    readonly size: number
  ) {
    super();
  }

  eq(other: DragHandleWidget) {
    return this.pos === other.pos && this.index === other.index && this.type === other.type && this.size === other.size;
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = `cm-drag-handle chunk-border-${this.index % 7}`;

    span.style.cssText = `
      display: inline-block;
      position: relative;
      z-index: 50; 
      width: 6px;
      height: 1.3em;
      background-color: ${this.type === 'start' ? '#4ec9b0' : '#ffffff'};
      vertical-align: text-bottom;
      cursor: col-resize;
      margin: 0 4px;
      border-radius: 3px;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
      pointer-events: auto;
    `;

    let tooltipEl: HTMLDivElement | null = null;

    const showTooltip = () => {
      document.querySelectorAll('.cm-floating-tooltip').forEach(el => el.remove());

      tooltipEl = document.createElement('div');
      tooltipEl.className =
        'cm-floating-tooltip bg-background text-foreground border border-border shadow-md rounded-md px-2 py-1 text-xs whitespace-nowrap fixed pointer-events-none z-[999999] transition-opacity duration-150';
      tooltipEl.textContent = `${this.size} chars`;
      tooltipEl.style.opacity = '0';

      document.body.appendChild(tooltipEl);

      const rect = span.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();
      const spacing = 8;

      const viewportCenter = window.innerHeight / 2;

      tooltipEl.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;

      if (rect.top > viewportCenter) {
        tooltipEl.style.top = `${rect.top - tooltipRect.height - spacing}px`;
      } else {
        tooltipEl.style.top = `${rect.bottom + spacing}px`;
      }

      requestAnimationFrame(() => {
        if (tooltipEl) tooltipEl.style.opacity = '1';
      });
    };

    const hideTooltip = () => {
      if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
      }
    };

    span.addEventListener('pointerenter', showTooltip);
    span.addEventListener('pointerleave', hideTooltip);

    span.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();

      hideTooltip();

      window.dispatchEvent(
        new CustomEvent('chunk-drag-start', {
          detail: { index: this.index, type: this.type },
        })
      );
    });

    return span;
  }
}
