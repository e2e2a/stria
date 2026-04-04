import { INode } from '@/types';

export interface SearchMatch {
  text: string;
  before: string;
  after: string;
  index: number;
  lineNumber: number;
  lineContent: string;
  matchIndices: number[];
}

export interface SearchResult {
  nodeId: string;
  title: string;
  matches: SearchMatch[];
}

/**
 * Main entry point for search.
 * Splits between specialized operators and standard text search.
 */
export function performSearch(query: string, nodes: INode[] | null): SearchResult[] {
  if (!query || query.length < 1 || !nodes) return [];
  const trimmed = query.trim().toLowerCase();

  if (trimmed.startsWith('["') && trimmed.endsWith('"]')) {
    const propertyTerm = trimmed.substring(2, trimmed.length - 2).trim();
    return handlePropertySearch(propertyTerm, nodes);
  }

  const operatorMatch = query.match(/^(tag|file|line):(.*)/i);
  const operator = operatorMatch ? operatorMatch[1].toLowerCase() : null;
  const searchTerm = (operatorMatch ? operatorMatch[2] : query).trim();

  if (!searchTerm && operator !== 'file') return [];

  if (operator) {
    return handleOperatorSearch(operator, searchTerm, nodes);
  } else {
    return handlePlainTextSearch(searchTerm, nodes);
  }
}

/**
 * PATH A: Operator Logic (tag:, line:, file:)
 * Preserves your original state-machine for frontmatter tags.
 */
function handleOperatorSearch(operator: string, searchTerm: string, nodes: INode[]): SearchResult[] {
  const lowerSearchTerm = searchTerm.toLowerCase();

  return nodes.reduce((results: SearchResult[], node) => {
    const content = (node.content || '').replace(/\r/g, '');
    const matches: SearchMatch[] = [];

    if (operator === 'file') {
      if (node.title.toLowerCase().includes(lowerSearchTerm)) {
        results.push({ nodeId: node._id, title: node.title, matches: [] });
      }
      return results;
    }

    if (operator === 'tag') {
      const cleanTerm = searchTerm.replace(/^#/, '').toLowerCase();
      const tagRegex = new RegExp(`(^|\\s)#${cleanTerm}\\b`, 'gi');

      const lines = content.split('\n');
      let absoluteIndex = 0;
      let inTagsBlock = false;

      lines.forEach((line, i) => {
        const trimmed = line.trim();
        const lowerLine = line.toLowerCase();
        const lineMatchIndices: number[] = [];

        const isHeader = trimmed.startsWith('tags:');
        if (isHeader) {
          inTagsBlock = true;
        } else if (inTagsBlock && (trimmed.includes(':') || (trimmed === '' && line.length === 0))) {
          inTagsBlock = false;
        }
        if (cleanTerm.length === 0) return results;
        if (inTagsBlock) {
          const searchStartIndex = isHeader ? lowerLine.indexOf('tags:') + 5 : 0;

          let pos = lowerLine.indexOf(cleanTerm, searchStartIndex);
          console.log('pos', pos);
          while (pos !== -1) {
            lineMatchIndices.push(pos);
            pos = lowerLine.indexOf(cleanTerm, pos + cleanTerm.length);
          }
        } else {
          let m;
          while ((m = tagRegex.exec(line)) !== null) {
            const idx = m.index + m[1].length;
            const charBefore = line[idx - 1];
            const charAfter = line[idx + cleanTerm.length + 1];
            if (!['(', '[', '{', '`'].includes(charBefore) && ![')', ']', '}', '`'].includes(charAfter)) {
              lineMatchIndices.push(idx);
            }
          }
        }

        if (lineMatchIndices.length > 0) {
          const matchText = inTagsBlock ? cleanTerm : searchTerm.startsWith('#') ? searchTerm : `#${searchTerm}`;

          matches.push({
            text: matchText,
            before: line.substring(0, lineMatchIndices[0]),
            after: line.substring(lineMatchIndices[0] + matchText.length),
            index: absoluteIndex,
            lineNumber: i + 1,
            lineContent: line,
            matchIndices: lineMatchIndices,
          });
        }

        absoluteIndex += line.length + 1;
      });
    }

    if (matches.length > 0) {
      results.push({ nodeId: node._id, title: node.title, matches });
    }
    return results;
  }, []);
}
/**
 * PATH B: Plain Text Search
 * Splits by line to provide "Children per line" search results.
 */
export function handlePlainTextSearch(searchTerm: string, nodes: INode[]): SearchResult[] {
  const lowerSearchTerm = searchTerm.toLowerCase();
  const searchLen = searchTerm.length;

  return nodes.reduce((results: SearchResult[], node) => {
    // NORMALIZE: Force Unix-style line endings so we match CodeMirror exactly
    const content = (node.content || '').replace(/\r/g, '');
    const nodeMatches: SearchMatch[] = [];
    const lines = content.split('\n');

    let runningOffset = 0;

    lines.forEach((line, i) => {
      const lowerLine = line.toLowerCase();
      const lineMatchIndices: number[] = [];

      if (searchLen === 0) return;

      let pos = lowerLine.indexOf(lowerSearchTerm);
      while (pos !== -1) {
        lineMatchIndices.push(pos);
        pos = lowerLine.indexOf(lowerSearchTerm, pos + searchLen);
      }

      if (lineMatchIndices.length > 0) {
        nodeMatches.push({
          text: searchTerm,
          before: line.substring(0, lineMatchIndices[0]),
          after: line.substring(lineMatchIndices[0] + searchLen),
          index: runningOffset,
          lineNumber: i + 1,
          lineContent: line,
          matchIndices: lineMatchIndices,
        });
      }

      runningOffset += line.length + 1;
    });

    const isTitleMatch = node.title.toLowerCase().includes(lowerSearchTerm);
    if (nodeMatches.length > 0 || isTitleMatch) {
      results.push({ nodeId: node._id, title: node.title, matches: nodeMatches });
    }
    return results;
  }, []);
}

export function searchSingleNode(query: string, node: INode): SearchMatch[] {
  const results = performSearch(query, [node]);
  return results.length > 0 ? results[0].matches : [];
}

function handlePropertySearch(searchTerm: string, nodes: INode[]): SearchResult[] {
  return nodes.reduce((results: SearchResult[], node) => {
    const content = node.content || '';
    if (!content.startsWith('---')) return results;

    const lines = content.split('\n');
    const matches: SearchMatch[] = [];

    let inFrontmatter = false;
    let currentPropertyKey = '';
    let currentPropertyValues: string[] = [];
    let startLineIdx = -1;
    let absoluteIndex = 0; // Tracks position from start of file
    let currentPropertyStartIdx = 0; // Tracks start of current key

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (i === 0 && trimmed === '---') {
        inFrontmatter = true;
        absoluteIndex += line.length + 1;
        continue;
      }

      if (inFrontmatter && i > 0 && trimmed === '---') {
        // Final property processing
        processProperty(currentPropertyKey, currentPropertyValues, startLineIdx, currentPropertyStartIdx, matches, searchTerm);
        break;
      }

      if (inFrontmatter) {
        const keyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)/);

        if (keyMatch) {
          // Process the PREVIOUS property before moving to the next
          processProperty(currentPropertyKey, currentPropertyValues, startLineIdx, currentPropertyStartIdx, matches, searchTerm);

          currentPropertyKey = keyMatch[1];
          currentPropertyValues = keyMatch[2] ? [keyMatch[2]] : [];
          startLineIdx = i;
          currentPropertyStartIdx = absoluteIndex; // Mark exactly where this key starts
        } else if (trimmed.startsWith('-') && currentPropertyKey) {
          currentPropertyValues.push(trimmed.substring(1).trim());
        }
      }

      // Update absolute index (line length + newline character)
      absoluteIndex += line.length + 1;
    }

    if (matches.length > 0) {
      results.push({ nodeId: node._id, title: node.title, matches });
    }
    return results;
  }, []);
}

function processProperty(key: string, values: string[], lineIdx: number, absIdx: number, matches: SearchMatch[], searchTerm: string) {
  if (!key) return;

  const combinedValue = values.join(', ').replace(/#/g, '');
  const fullLineContent = `${key}: ${combinedValue}`;

  const isMatch = !searchTerm || key.toLowerCase().includes(searchTerm) || combinedValue.toLowerCase().includes(searchTerm);

  if (isMatch) {
    matches.push({
      text: searchTerm,
      before: '',
      after: '',
      index: absIdx,
      lineNumber: lineIdx + 1,
      lineContent: fullLineContent,
      matchIndices: [],
    });
  }
}
