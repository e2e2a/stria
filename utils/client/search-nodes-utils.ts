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
  return nodes.reduce((results: SearchResult[], node) => {
    const content = node.content || '';
    const matches: SearchMatch[] = [];

    if (operator === 'file') {
      if (node.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push({ nodeId: node._id, title: node.title, matches: [] });
      }
      return results;
    }

    let regex: RegExp | null = null;

    if (operator === 'tag') {
      const cleanTerm = searchTerm.replace(/^#/, '').toLowerCase();
      const lines = content.split('\n');
      let absoluteIndex = 0;

      lines.forEach((line, i) => {
        const lowerLine = line.toLowerCase();
        const matchIndices: number[] = [];

        if (lowerLine.trim().startsWith('tags:')) {
          const valuePart = line.split('tags:')[1];
          const valueStartIdx = line.indexOf(valuePart);

          let pos = valuePart.toLowerCase().indexOf(cleanTerm);
          while (pos !== -1) {
            matchIndices.push(valueStartIdx + pos);
            pos = valuePart.toLowerCase().indexOf(cleanTerm, pos + cleanTerm.length);
          }
        } else {
          const tagWithHash = `#${cleanTerm}`;
          let pos = lowerLine.indexOf(tagWithHash);
          while (pos !== -1) {
            matchIndices.push(pos);
            pos = lowerLine.indexOf(tagWithHash, pos + tagWithHash.length);
          }
        }

        if (matchIndices.length > 0) {
          matches.push({
            text: searchTerm,
            before: line.substring(0, matchIndices[0]),
            after: line.substring(matchIndices[0] + searchTerm.length),
            index: absoluteIndex + matchIndices[0],
            lineNumber: i + 1,
            lineContent: line,
            matchIndices: matchIndices,
          });
        }
        absoluteIndex += line.length + 1;
      });
    } else if (operator === 'line') {
      const keywords = searchTerm.split(/\s+/).filter(k => k.length > 0);
      const lookaheads = keywords.map(k => `(?=.*${k})`).join('');
      regex = new RegExp(`^${lookaheads}.*$`, 'gim');
    }

    if (regex) {
      let m;
      while ((m = regex.exec(content)) !== null) {
        const lineData = getLineContext(content, m.index);
        const matchedText = operator === 'line' ? lineData.content : m[1];
        const matchLen = operator === 'line' ? matchedText.length : m[1].length;
        const offset = operator === 'tag' ? 1 : 0;

        matches.push({
          text: operator === 'tag' ? `#${m[1]}` : matchedText,
          before: operator === 'line' ? '' : content.substring(lineData.start, m.index),
          after: operator === 'line' ? '' : content.substring(m.index + matchLen + offset, lineData.end),
          index: m.index,
          lineNumber: lineData.number,
          lineContent: lineData.content,
          matchIndices: [m.index - lineData.start],
        });
      }
    }

    if (matches.length > 0) results.push({ nodeId: node._id, title: node.title, matches });
    return results;
  }, []);
}

/**
 * PATH B: Plain Text Search
 * Splits by line to provide "Children per line" search results.
 */
function handlePlainTextSearch(searchTerm: string, nodes: INode[]): SearchResult[] {
  const lowerSearchTerm = searchTerm.toLowerCase();
  const searchLen = searchTerm.length;

  return nodes.reduce((results: SearchResult[], node) => {
    const content = node.content || '';
    const nodeMatches: SearchMatch[] = [];
    const lines = content.split('\n');
    let currentPos = 0;

    lines.forEach((line, i) => {
      const lowerLine = line.toLowerCase();
      const lineMatchIndices: number[] = [];

      // 2. Efficiently find all occurrences in the line
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
          index: currentPos + lineMatchIndices[0],
          lineNumber: i + 1,
          lineContent: line,
          matchIndices: lineMatchIndices,
        });
      }
      currentPos += line.length + 1;
    });

    const isTitleMatch = node.title.toLowerCase().includes(lowerSearchTerm);

    if (nodeMatches.length > 0 || isTitleMatch) {
      results.push({
        nodeId: node._id,
        title: node.title,
        matches: nodeMatches,
      });
    }
    return results;
  }, []);
}
function getLineContext(content: string, index: number) {
  const lineStart = content.lastIndexOf('\n', index) + 1;
  const lineEnd = content.indexOf('\n', index);
  const end = lineEnd === -1 ? content.length : lineEnd;
  return {
    start: lineStart,
    end: end,
    content: content.substring(lineStart, end),
    number: content.substring(0, index).split('\n').length,
  };
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
