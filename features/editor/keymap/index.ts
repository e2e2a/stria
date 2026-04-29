import { keymap, EditorView, Command } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { getAllTableRanges } from '@/lib/client/markdown/markdown-table-utils';
import { autocompletion, Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { useNodeStore } from '../stores/nodes';
import { flattenNodeTree } from '@/utils/client/node-utils';
import { useTabStore } from '../stores/tabs';
import { INode } from '@/types';
import { classifyLink } from '@/features/helpers/editor/parse-link';
import { handleInternalLink, openRelativeFile } from '@/features/helpers/editor/link-actions';
import { extractHeadings, getCachedNodes, getSearchIndex } from '@/features/helpers/editor/node-cache';
import { TablePreviewWidget } from '../widgets/table';
import { markdownLivePreviewField } from '../plugins';

interface LinkCompletion extends Completion {
  type: 'file' | 'folder' | 'heading';
  parentId?: string | null;
  title: string;
}

export const selectAllToTop: Command = view => {
  view.dispatch({
    selection: EditorSelection.single(0, view.state.doc.length),
  });
  return true;
};

export const tableBackspace = keymap.of([
  {
    key: 'Backspace',
    run(view: EditorView) {
      const { state } = view;
      const { main } = state.selection;
      const decoSet = state.field(markdownLivePreviewField, false);
      if (!decoSet) return false;

      if (!main.empty) {
        let isTableSelection = false;
        decoSet.between(main.from, main.to, (f, t, deco) => {
          if (deco.spec.widget instanceof TablePreviewWidget && f >= main.from && t <= main.to) isTableSelection = true;
        });

        if (isTableSelection) {
          view.dispatch({
            changes: { from: main.from, to: main.to, insert: '' },
            selection: { anchor: main.from },
          });
          return true;
        }
        return false;
      }

      const line = state.doc.lineAt(main.head);
      if (main.head !== line.from || line.number === 1) return false;

      const prevPos = main.head - 1;
      let tableRange: { from: number; to: number } | null = null;

      decoSet.between(prevPos, prevPos, (from, to, deco) => {
        if (deco.spec.widget instanceof TablePreviewWidget) tableRange = { from, to };
      });

      if (tableRange) {
        const range = tableRange as { from: number; to: number };
        view.dispatch({
          selection: EditorSelection.range(range.to, range.from),
          scrollIntoView: true,
        });
        return true;
      }
      return false;
    },
  },
]);

export const tableKeyboardHandler = EditorView.domEventHandlers({
  keydown: (event, view) => {
    const isUp = event.key === 'ArrowUp';
    const isDown = event.key === 'ArrowDown';
    if (!isUp && !isDown) return false;

    if ((event.target as HTMLElement).closest('.cm-table-cell-editor')) return false;

    const { state } = view;
    const sel = state.selection.main;
    const currentLine = state.doc.lineAt(sel.head);
    const tables = getAllTableRanges(state);

    for (const { from, to } of tables) {
      const tableStartLine = state.doc.lineAt(from).number;
      const tableEndLine = state.doc.lineAt(to).number;

      // --- BOUNDARY DETECTION ---
      const atTopBoundary = currentLine.number === tableStartLine - 1;
      const atBottomBoundary = currentLine.number === tableEndLine + 1;

      if (event.shiftKey) {
        if (isDown && atTopBoundary) {
          event.preventDefault();
          const nextLineNum = Math.min(state.doc.lines, tableEndLine + 1);
          const nextLine = state.doc.line(nextLineNum);

          view.dispatch({
            selection: EditorSelection.range(sel.anchor, nextLine.from),
            scrollIntoView: true,
          });
          return true;
        }
        if (isUp && atBottomBoundary) {
          event.preventDefault();

          const prevLineNum = Math.max(1, tableStartLine - 1);
          const prevLine = state.doc.line(prevLineNum);

          view.dispatch({
            selection: event.shiftKey ? EditorSelection.range(sel.anchor, prevLine.from) : EditorSelection.cursor(prevLine.from),
            scrollIntoView: true,
          });
          return true;
        }
      } else {
        // not needed cm will handle isDown
        // if (isDown && atTopBoundary) {
        //   event.preventDefault();

        //   const container = view.dom.querySelector(`.cm-table-widget-container[data-from="${from}"][data-to="${to}"]`) as HTMLElement | null;

        //   const firstCell = container?.querySelector('tr:nth-child(1) :is(td, th):nth-child(1) .cm-table-cell-editor') as HTMLElement | null;

        //   firstCell?.focus();
        //   return true;
        // }
        if (isUp && atBottomBoundary) {
          const container = view.dom.querySelector(`.cm-table-widget-container[data-from="${from}"][data-to="${to}"]`) as HTMLElement | null;
          if (!container) continue;
          event.preventDefault();
          const rows = container?.querySelectorAll('tr');
          const lastRow = rows?.[rows.length - 1];

          const firstCell = lastRow?.querySelector(':is(td, th):nth-child(1) .cm-table-cell-editor') as HTMLElement | null;

          if (firstCell) {
            firstCell.focus();
            return true;
          }
        }
      }
    }
    return false;
  },
});

export const internalLinkCompletion = autocompletion({
  activateOnTyping: true,
  activateOnTypingDelay: 60,

  override: [
    (context: CompletionContext): CompletionResult | null => {
      const word = context.matchBefore(/\[\[[^\]]*/);
      if (!word) return null;
      const cachedFlatNodes = getCachedNodes();
      const cachedSearchIndex = getSearchIndex();
      const typed = word.text.slice(2); // remove [[

      const state = useNodeStore.getState();
      const currentNode = state.activeNode;

      const options: LinkCompletion[] = [];

      // -------------------------------------------------
      // CASE 1 — Heading autocomplete
      // -------------------------------------------------

      if (typed.includes('#')) {
        const [pathPart, headingQuery] = typed.split('#');

        let targetNode: INode | undefined;

        // [[#Heading]] → same file
        if (!pathPart) {
          targetNode = currentNode!;
        }

        // [[Note#Heading]]
        else {
          targetNode = cachedFlatNodes.find(n => n.path === pathPart);
        }

        if (!targetNode) return null;

        const headings = extractHeadings(targetNode.content || '');

        for (const h of headings) {
          if (headingQuery && !h.text.toLowerCase().includes(headingQuery.toLowerCase())) continue;

          options.push({
            label: h.text,
            title: h.text,
            type: 'heading',
            detail: 'H' + h.level,
            apply: (view, completion, from, to) => {
              const doc = view.state.doc;

              const nextChars = doc.sliceString(to, to + 2);
              const shouldClose = nextChars !== ']]';

              const insertText = (pathPart ? pathPart : '') + '#' + h.text + (shouldClose ? ']]' : '');

              view.dispatch({
                changes: { from, to, insert: insertText },
              });
            },
          });
        }

        return {
          from: word.from + 2,
          options,
          filter: false,
        };
      }

      // -------------------------------------------------
      // CASE 2 — File autocomplete (existing logic)
      // -------------------------------------------------

      for (const n of cachedFlatNodes) {
        if (n._id === currentNode?._id) continue;

        const searchText = cachedSearchIndex.get(n._id);
        if (!searchText) continue;

        if (typed && !searchText.includes(typed.toLowerCase())) continue;

        const isFolder = n.type === 'folder';

        options.push({
          label: n.title,
          title: n.title,
          type: isFolder ? 'folder' : 'file',
          parentId: n.parentId,
          detail: n?.path,
          apply: (view, completion, from, to) => {
            const doc = view.state.doc;

            const nextChars = doc.sliceString(to, to + 2);
            const shouldClose = nextChars !== ']]';

            const insertText = n?.path + (isFolder ? '/' : shouldClose ? ']]' : '');

            view.dispatch({
              changes: { from, to, insert: insertText },
            });
          },
        });

        if (options.length >= 50) break;
      }

      return {
        from: word.from + 2,
        options,
        filter: false,
      };
    },
  ],
  optionClass: completion => {
    if (completion.type === 'heading') return 'cm-heading-option';
    return 'cm-file-option';
  },
});

export const internalLinkClickHandler = EditorView.domEventHandlers({
  mousedown(event) {
    const el = (event.target as HTMLElement).closest('.cm-internal-link') as HTMLElement | null;
    if (!el || event.button !== 0) return false;

    const link = el.dataset.link;
    if (!link) return false;

    setTimeout(() => {
      const nodeState = useNodeStore.getState();
      const { openTab } = useTabStore.getState();
      const currentNode = nodeState.activeNode;

      if (!currentNode) return;

      let filePath = '';
      let heading = '';

      // 1. Parse Link Path & Heading
      if (link.startsWith('#')) {
        filePath = currentNode.path!;
        heading = link.slice(1);
      } else if (link.includes('#')) {
        const parts = link.split('#');
        filePath = parts[0];
        heading = parts[1];
      } else {
        filePath = link;
      }

      // 2. Resolve target and navigate
      const targetNode = flattenNodeTree(nodeState.nodes).find((n: INode) => n.path === filePath);
      if (targetNode) {
        if (heading) {
          nodeState.setPendingScrollHeading(heading);
        }
        nodeState.setActiveNode(targetNode._id);
        openTab(targetNode.projectId, targetNode, true);
      }
    }, 0);

    event.preventDefault();
    return true;
  },
});

export const linkClickHandler = EditorView.domEventHandlers({
  mousedown(event) {
    if (event.button !== 0) return false;

    const el = (event.target as HTMLElement).closest('.cm-link-text, .cm-internal-link') as HTMLElement | null;
    if (!el) return false;

    const link = el.dataset.link;
    if (!link) return false;

    const type = classifyLink(link);

    if (type === 'external') {
      window.open(link, '_blank');
      event.preventDefault();
      return true;
    }

    if (type === 'relative') {
      openRelativeFile(link);
      event.preventDefault();
      return true;
    }

    handleInternalLink(link);

    event.preventDefault();
    return true;
  },
});
