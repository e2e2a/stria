import mermaid from 'mermaid';
import { EditorState, RangeSetBuilder, Text } from '@codemirror/state';
import { initView, mermaidHeightCache, mermaidPrerenderedEffect, mermaidSvgCache } from '../plugins/mermaid';
import { MermaidWidget, resolveTheme } from '../widgets/mermaid-widget';
import { Decoration } from '@uiw/react-codemirror';
import { chunkModeFacet, sourceModeField } from '../plugins';
import { useEditorSettings } from '../stores/setting';

export function extractAllMermaidBlocks(doc: Text, from = 1, to = doc.lines) {
  const blocks: { code: string; startLine: number; endLine: number }[] = [];

  for (let i = from; i <= to; i++) {
    const line = doc.line(i);
    if (!line.text.trim().startsWith('```mermaid')) continue;

    let j = i + 1;
    const content: string[] = [];

    while (j <= doc.lines) {
      const l = doc.line(j);
      if (l.text.trim().startsWith('```')) break;
      content.push(l.text);
      j++;
    }

    blocks.push({ code: content.join('\n'), startLine: i, endLine: j });
    i = j;
  }

  return blocks;
}

export function estimateMermaidHeight(code: string): number {
  const lines = code.split('\n').length;
  return 120 + lines * 28;
}

export async function prerenderThenBuild(state: EditorState, from: number, to: number) {
  const blocks = extractAllMermaidBlocks(state.doc, from, to);
  const resolvedTheme = resolveTheme(useEditorSettings.getState().theme);
  await Promise.all(
    blocks.map(async ({ code }) => {
      const svgCacheKey = `${resolvedTheme}-${code}`;
      const cachedSvg = mermaidSvgCache.get(svgCacheKey);

      if (cachedSvg) return;
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

  initView?.dispatch({
    effects: mermaidPrerenderedEffect.of(null),
  });
}

export function buildMermaidDecorations(state: EditorState, from: number, to: number) {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = state.doc;

  const activeLine = doc.lineAt(state.selection.main.head).number;

  for (let i = from; i <= to; i++) {
    const line = doc.line(i);

    if (!line.text.trim().startsWith('```mermaid')) continue;

    let j = i + 1;
    const content: string[] = [];

    while (j <= doc.lines) {
      const l = doc.line(j);
      if (l.text.trim().startsWith('```')) break;
      content.push(l.text);
      j++;
    }

    const endLine = j <= doc.lines ? j : i;

    const fromPos = doc.line(i).from;
    const toPos = doc.line(endLine).to;

    const code = content.join('\n');

    const isBlockActive = activeLine >= i && activeLine <= endLine;
    const sourceMode = state.field(sourceModeField, false);
    const viewMode = state.facet(EditorState.readOnly);
    const isChunkMode = state.facet(chunkModeFacet);
    const theme = useEditorSettings.getState().theme;

    if (viewMode || (!isBlockActive && !sourceMode && !isChunkMode)) {
      builder.add(
        fromPos,
        toPos,
        Decoration.replace({
          widget: new MermaidWidget(code, fromPos, theme),
          block: true,
        })
      );
    } else {
      // This is EDIT MODE → DO NOTHING -> let fenceCode Decoration work on it
    }

    i = endLine;
  }

  return builder.finish();
}
