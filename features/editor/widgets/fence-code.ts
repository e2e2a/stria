import { getLanguageLabel } from '@/features/helpers/editor/getLanguageLabel';
import { WidgetType } from '@uiw/react-codemirror';
import { fenceCodeHeightCache } from '../plugins';

export function estimateFenceCodeHeight(code: string): number {
  const lines = code.split('\n').length;
  return 28 + lines * 20; // header ~28px + per-line height
}
export class FenchCodeWidget extends WidgetType {
  constructor(
    readonly lang: string,
    readonly code: string
  ) {
    super();
  }

  get estimatedHeight(): number {
    return fenceCodeHeightCache.get(this.code) ?? 34;
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
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 10) {
          fenceCodeHeightCache.set(this.code, h);
          observer.disconnect();
        }
      }
    });
    observer.observe(wrapper);
    return wrapper;
  }
  eq(other: FenchCodeWidget) {
    // return other.lang === this.lang;
    return other.lang === this.lang;
  }
}
