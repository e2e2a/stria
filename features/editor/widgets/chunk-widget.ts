import { WidgetType } from '@codemirror/view';

export class DragHandleWidget extends WidgetType {
  constructor(
    readonly pos: number,
    readonly index: number,
    readonly size: number
  ) {
    super();
  }

  eq(other: DragHandleWidget) {
    return this.pos === other.pos && this.index === other.index && this.size === other.size;
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = `cm-drag-handle chunk-border-${this.index % 7}`;

    span.style.cssText = `
      display: inline-block;
      width: 6px;
      height: 1.3em;
      background-color: #ffffff;
      vertical-align: text-bottom;
      cursor: col-resize;
      margin: 0 4px;
      border-radius: 3px;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
      pointer-events: auto;
    `;

    const tooltip = document.createElement('div');
    tooltip.textContent = `${this.size} chars`;
    tooltip.style.cssText = `
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background-color: #09090b; /* slate-950 */
      color: #fafafa;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-family: ui-sans-serif, system-ui, sans-serif;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease-in-out;
      z-index: 50;
      border: 1px solid #27272a; /* slate-800 */
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    `;

    span.onmouseenter = () => (tooltip.style.opacity = '1');
    span.onmouseleave = () => (tooltip.style.opacity = '0');

    span.dataset.splitIndex = this.index.toString();
    span.dataset.splitPos = this.pos.toString();
    span.onmousedown = e => {
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('chunk-drag-start', { detail: { index: this.index } }));
    };

    span.appendChild(tooltip);
    return span;
  }
}
