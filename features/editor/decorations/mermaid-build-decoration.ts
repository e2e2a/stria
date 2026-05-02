import mermaid from 'mermaid';
import { EditorState, RangeSetBuilder, Text } from '@codemirror/state';
import { mermaidHeightCache, mermaidPrerenderedEffect, mermaidSvgCache, viewRegistry } from '../plugins/mermaid';
import { MermaidWidget, resolveTheme } from '../widgets/mermaid-widget';
import { Decoration } from '@uiw/react-codemirror';
import { chunkModeFacet, sourceModeField } from '../plugins';
import { useEditorSettings } from '../stores/setting';

export function extractAllMermaidBlocks(doc: Text, from = 1, to = doc.lines) {
  console.log('extracting');
  const blocks: { code: string; startLine: number; endLine: number }[] = [];

  for (let i = from; i <= to; i++) {
    const line = doc.line(i);
    if (!line.text.trim().startsWith('```mermaid')) continue;

    let j = i + 1;
    const content: string[] = [];
    let isClosed = false;

    while (j <= doc.lines) {
      const l = doc.line(j);
      if (l.text.trim().startsWith('```')) {
        isClosed = true;
        break;
      }
      content.push(l.text);
      j++;
    }

    const code = content.join('\n');
    if (isClosed && code.trim() !== '') blocks.push({ code: content.join('\n'), startLine: i, endLine: j });
    i = j;
  }

  return blocks;
}

export function estimateMermaidHeight(code: string): number {
  const lines = code.split('\n').length;
  return 120 + lines * 28;
}

export async function prerenderThenBuild(state: EditorState, from: number, to: number, nodeId: string) {
  const blocks = extractAllMermaidBlocks(state.doc, from, to);
  const resolvedTheme = resolveTheme(useEditorSettings.getState().theme);

  await Promise.all(
    blocks.map(async ({ code }) => {
      const svgCacheKey = `${resolvedTheme}-${code}`;
      if (mermaidSvgCache.has(svgCacheKey) && mermaidHeightCache.has(code)) return;

      if (!mermaidHeightCache.has(code)) {
        mermaidHeightCache.set(code, estimateMermaidHeight(code));
      }

      if (mermaidSvgCache.has(svgCacheKey)) return;

      try {
        const id = `pre-${crypto.randomUUID()}`;
        const { svg } = await mermaid.render(id, code);
        mermaidSvgCache.set(svgCacheKey, svg);

        const el = document.createElement('div');
        el.style.cssText = 'position:absolute;visibility:hidden;width:800px';
        el.innerHTML = svg;
        document.body.appendChild(el);
        const height = el.getBoundingClientRect().height;
        el.remove();

        mermaidHeightCache.set(code, height);
      } catch {
        mermaidHeightCache.set(code, estimateMermaidHeight(code));
      }
    })
  );

  const targetView = viewRegistry.get(nodeId);
  targetView?.dispatch({ effects: mermaidPrerenderedEffect.of(null) });
}

export function buildMermaidDecorations(state: EditorState, from: number, to: number) {
  const doc = state.doc;
  const docStr = doc.toString();

  if (!docStr.includes('```mermaid')) return Decoration.none;

  const mermaidStartPositions = new Set<number>();
  let searchFrom = 0;
  while (true) {
    const idx = docStr.indexOf('```mermaid', searchFrom);
    if (idx === -1) break;
    mermaidStartPositions.add(doc.lineAt(idx).number);
    searchFrom = idx + 1;
  }
  console.log('mermaidStartPositions', mermaidStartPositions.size);
  if (mermaidStartPositions.size === 0) return Decoration.none;

  const builder = new RangeSetBuilder<Decoration>();
  const activeLine = doc.lineAt(state.selection.main.head).number;
  const sourceMode = state.field(sourceModeField, false);
  const viewMode = state.facet(EditorState.readOnly);
  const isChunkMode = state.facet(chunkModeFacet);
  const theme = useEditorSettings.getState().theme;

  for (const startLineNum of mermaidStartPositions) {
    if (startLineNum < from || startLineNum > to) continue;

    let j = startLineNum + 1;
    const content: string[] = [];
    let isClosed = false;

    while (j <= doc.lines) {
      const l = doc.line(j);
      if (l.text.trim().startsWith('```')) {
        isClosed = true;
        break;
      }
      content.push(l.text);
      j++;
    }

    const code = content.join('\n');
    if (!isClosed || code.trim() === '') continue;

    const endLine = j <= doc.lines ? j : startLineNum;
    const fromPos = doc.line(startLineNum).from;
    const toPos = doc.line(endLine).to;
    const isBlockActive = activeLine >= startLineNum && activeLine <= endLine;

    if (viewMode || (!isBlockActive && !sourceMode && !isChunkMode)) {
      builder.add(
        fromPos,
        toPos,
        Decoration.replace({
          widget: new MermaidWidget(code, fromPos, toPos, theme),
          block: true,
        })
      );
    }
  }

  return builder.finish();
}
