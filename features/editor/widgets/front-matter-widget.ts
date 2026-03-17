import { EditorView, WidgetType } from '@codemirror/view';

const AVAILABLE_PROPS = [
  { id: 'tags', label: 'tags', icon: '🏷' },
  { id: 'aliases', label: 'aliases', icon: '↪' },
  { id: 'description', label: 'description', icon: '≡' },
  { id: 'cssclasses', label: 'cssclasses', icon: '≡' },
];

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
    const container = document.createElement('div');
    container.className = 'p-2 mt-5 bg-sidebar track border border-border flex flex-col gap-1 font-sans! select-none';

    container.onclick = e => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      e.stopPropagation();
      const firstLineEnd = view.state.doc.line(1).to;
      view.dispatch({ selection: { anchor: firstLineEnd, head: firstLineEnd }, scrollIntoView: true });
      view.focus();
    };

    const header = document.createElement('div');
    header.className = 'text-lg mb-1 tracking-wider flex items-center gap-2';
    header.innerHTML = `Properties`;
    container.appendChild(header);
    const data = this.parse();

    AVAILABLE_PROPS.forEach(prop => {
      if (data[prop.id]) {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-3 text-xs';
        // @ToDo this val will have a link to search th tags, description and etc.
        row.innerHTML = `
          <div class="w-24 flex items-center gap-2">
            <span>${prop.icon}</span> <span>${prop.label}</span>
          </div>
          <div class="flex flex-wrap gap-1 ">
            ${data[prop.id]
              .map(
                val => `
              <span class="px-2 py-0.5 bg-white/5 rounded border border-white/10 cursor-pointer">${val}</span> 
            `
              )
              .join('')}
          </div>
        `;
        container.appendChild(row);
      }
    });

    if (container.querySelectorAll('.flex.items-center.gap-3').length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'text-[10px] text-gray-600 uppercase tracking-widest font-bold';
      placeholder.textContent = '⌄ Properties (Empty)';
      container.appendChild(placeholder);
    }

    const existingKeys = Object.keys(data);
    const remainingProps = AVAILABLE_PROPS.filter(p => !existingKeys.includes(p.id));

    if (remainingProps.length > 0) {
      const addBtnContainer = document.createElement('div');
      addBtnContainer.className = 'mt-1 border-t border-white/5 pt-2';

      const addBtn = document.createElement('button');
      addBtn.className = 'flex items-center gap-2 text-[10px] text-gray-500 hover:text-white transition-colors uppercase tracking-wider font-bold p-1';
      addBtn.innerHTML = `<span>+</span> Add Property`;

      addBtn.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        this.showPropertyMenu(view, addBtn, remainingProps);
      };

      addBtnContainer.appendChild(addBtn);
      container.appendChild(addBtnContainer);
    }

    return container;
  }

  private showPropertyMenu(view: EditorView, anchor: HTMLElement, props: typeof AVAILABLE_PROPS) {
    const menu = document.createElement('div');
    menu.className = 'absolute z-[100] bg-[#1a1a1a] border border-white/10 rounded-md shadow-2xl py-1 min-w-[140px]';
    menu.onmousedown = e => e.stopPropagation();

    props.forEach(prop => {
      const item = document.createElement('div');
      item.className = 'px-3 py-1.5 text-xs text-gray-300 hover:bg-blue-600 hover:text-white cursor-pointer flex items-center gap-2';
      item.innerHTML = `<span>${prop.icon}</span> ${prop.label}`;

      item.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        this.insertProperty(view, prop.id);
        menu.remove();
      };
      menu.appendChild(item);
    });

    const rect = anchor.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 5}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;

    document.body.appendChild(menu);

    const closer = () => {
      menu.remove();
      document.removeEventListener('mousedown', closer);
    };
    setTimeout(() => document.addEventListener('mousedown', closer), 10);
  }

  private insertProperty(view: EditorView, key: string) {
    const lines = this.raw.split('\n');
    const insertIndex = lines.length - 1;
    lines.splice(insertIndex, 0, `${key}: `);

    const newFrontmatter = lines.join('\n');

    view.dispatch({
      changes: { from: this.pos, to: this.pos + this.raw.length, insert: newFrontmatter },
      selection: { anchor: this.pos + newFrontmatter.indexOf(`${key}: `) + `${key}: `.length },
    });

    view.focus();
  }
}
