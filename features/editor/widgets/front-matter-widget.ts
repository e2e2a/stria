import { EditorView, WidgetType } from '@codemirror/view';
import { useProjectUIStore } from '../stores/project-ui';

const ICON_MAP: Record<string, string> = {
  tags: '🏷',
  aliases: '↪',
  description: '≡',
  cssclasses: '🎨',
};

export class FrontmatterWidget extends WidgetType {
  constructor(
    readonly raw: string,
    readonly pos: number
  ) {
    super();
  }

  eq(other: FrontmatterWidget) {
    return other.raw === this.raw;
  }

  private parse() {
    const lines = this.raw.split('\n').slice(1, -1);
    const data: Record<string, string[]> = {};
    let currentKey = '';

    lines.forEach(line => {
      const match = line.match(/^([a-zA-Z_-]+):(.*)$/);
      if (match) {
        currentKey = match[1].trim();
        const val = match[2].trim();
        data[currentKey] = val
          ? val
              .split(',')
              .map(v => v.trim())
              .filter(v => v)
          : [];
      } else if (currentKey && line.trim().startsWith('-')) {
        const val = line.trim().replace(/^-\s*/, '');
        if (val) data[currentKey].push(val);
      }
    });
    return data;
  }

  toDOM(view: EditorView) {
    const normalizedRaw = this.normalizeRaw(this.raw);

    if (normalizedRaw !== this.raw) {
      queueMicrotask(() => {
        view.dispatch({
          changes: {
            from: this.pos,
            to: this.pos + this.raw.length,
            insert: normalizedRaw,
          },
        });
      });
    }
    const container = document.createElement('div');
    container.className = 'p-2 max-w-full w-full min-w-full bg-sidebar track border border-border flex flex-col gap-1 font-sans! select-none rounded-sm';

    container.onclick = e => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      e.stopPropagation();
      const firstLineEnd = view.state.doc.line(1).to;
      view.dispatch({ selection: { anchor: firstLineEnd, head: firstLineEnd }, scrollIntoView: true });
      view.focus();
    };

    const header = document.createElement('div');
    header.className = 'text-[10px] uppercase font-bold text-foreground/90 tracking-widest mb-1';
    header.innerHTML = `Properties`;
    container.appendChild(header);

    const data = this.parse();
    const entries = Object.entries(data);

    if (entries.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'text-[10px] text-foreground/90 italic px-1';
      placeholder.textContent = '(No properties defined)';
      container.appendChild(placeholder);
    } else {
      entries.forEach(([key, values]) => {
        const row = document.createElement('div');
        row.className = 'flex items-start gap-3 text-xs py-0.5';

        const icon = ICON_MAP[key.toLowerCase()] || '≡';

        const valuesHtml = values
          .map(val => {
            if (key.toLowerCase() === 'tags') {
              return `<button type="button" data-val="${val}" class="appearance-none py-0.5 px-2 cm-hashtag cursor-pointer leading-none">${val}</button>`;
            }
            return `<span class="py-0.5 px-1 text-foreground/80">${val}</span>`;
          })
          .join('');

        row.innerHTML = `
          <div class="w-24 shrink-0 flex items-center text-foreground/90 gap-2 opacity-80">
            <span>${icon}</span> <span class="truncate">${key}</span>
          </div>
          <div class="flex flex-wrap flex-row gap-1 flex-1">${valuesHtml}</div>`;

        // Attach listeners for tags
        if (key.toLowerCase() === 'tags') {
          row.querySelectorAll('button[data-val]').forEach(btn => {
            btn.addEventListener('click', e => {
              e.preventDefault();
              e.stopPropagation();

              const val = (btn as HTMLElement).dataset.val;
              const store = useProjectUIStore.getState();

              store.setSearchQuery(`tag:${val}`);
              store.setLeftSidebarTab('search');
            });
          });
        }
        container.appendChild(row);
      });
    }

    // Dynamic "Add Property" button
    const addBtn = document.createElement('button');
    addBtn.className =
      'mt-2 flex items-center gap-2 text-[10px] text-foreground/70 cursor-pointer hover:text-foreground transition-colors uppercase tracking-wider font-bold p-1 w-fit';
    addBtn.innerHTML = `<span>+</span> Add Property`;
    addBtn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      this.insertNewProperty(view);
    };
    container.appendChild(addBtn);

    return container;
  }

  private insertNewProperty(view: EditorView) {
    const lines = this.raw.split('\n');
    const insertIndex = lines.length - 1;
    lines.splice(insertIndex, 0, `property: `);
    const newFrontmatter = lines.join('\n');

    view.dispatch({
      changes: { from: this.pos, to: this.pos + this.raw.length, insert: newFrontmatter },
      selection: { anchor: this.pos + newFrontmatter.lastIndexOf(`property: `) + 10 },
    });
    view.focus();
  }

  private normalizeRaw(raw: string) {
    return raw.replace(/^([a-zA-Z0-9_-]+):/gm, (_, key) => {
      return key.toLowerCase() + ':';
    });
  }
}
