import { INode } from '@/types';

export interface SearchMatch {
  text: string;
  before: string;
  after: string;
  index: number;
}

export interface SearchResult {
  nodeId: string;
  title: string;
  matches: SearchMatch[];
}

export function performSearch(query: string, nodes: INode[] | null): SearchResult[] {
  if (!query || query.length < 2) return [];
  if (!nodes) return [];

  const operatorMatch = query.match(/^(tag|file|line):(.*)/i);
  const operator = operatorMatch ? operatorMatch[1].toLowerCase() : null;
  const searchTerm = (operatorMatch ? operatorMatch[2] : query).trim();

  if (!searchTerm && operator !== 'file') return [];

  return nodes.reduce((results: SearchResult[], node) => {
    const content = node.content || '';
    const matches: SearchMatch[] = [];

    if (operator === 'file') {
      if (node.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push({ nodeId: node._id, title: node.title, matches: [] });
      }
      return results;
    }

    let regex: RegExp;
    if (operator === 'tag') {
      const cleanTerm = searchTerm.replace(/^#/, '');

      const fmMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
      if (fmMatch) {
        const fmContent = fmMatch[1];
        const lines = fmContent.split('\n');
        const tagBlock: string[] = [];
        let inBlock = false;
        let found = false;
        let finalTargetIndex = -1;

        const fmStartIndex = content.indexOf(fmContent);

        lines.forEach(line => {
          const isStart = line.startsWith('tags:');
          const isList = line.trim().startsWith('-');

          if (isStart) inBlock = true;
          else if (inBlock && !isList && line.trim() !== '') inBlock = false;

          if (inBlock) {
            tagBlock.push(line);
            const lowerLine = line.toLowerCase();
            const lowerTerm = cleanTerm.toLowerCase();

            if (lowerLine.includes(lowerTerm)) {
              found = true;
              const termInLineIdx = lowerLine.indexOf(lowerTerm);
              // Math: Start of FM + Start of Line + Offset to the actual word
              finalTargetIndex = fmStartIndex + fmContent.indexOf(line) + termInLineIdx;
            }
          }
        });

        if (found && tagBlock.length > 0) {
          const fullBlock = tagBlock.join('\n');
          const termIdx = fullBlock.toLowerCase().indexOf(cleanTerm.toLowerCase());

          matches.push({
            text: fullBlock.substring(termIdx, termIdx + cleanTerm.length),
            before: fullBlock.substring(0, termIdx),
            after: fullBlock.substring(termIdx + cleanTerm.length),
            index: finalTargetIndex, // Precisely targets the start of the word
          });
        }
      }

      // 2. Body Hashtag Search
      regex = new RegExp(`#(?!\\s)(${cleanTerm})(\\s|$)`, 'gi');
    } else if (operator === 'line') {
      const keywords = searchTerm.split(/\s+/).filter(k => k.length > 0);
      if (keywords.length === 0) return results;
      const lookaheads = keywords.map(k => `(?=.*${k})`).join('');
      regex = new RegExp(`^${lookaheads}.*$`, 'gim');
    } else {
      regex = new RegExp(`(${searchTerm})`, 'gi');
    }

    let match;
    while ((match = regex.exec(content)) !== null) {
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const lineEnd = content.indexOf('\n', match.index);
      const end = lineEnd === -1 ? content.length : lineEnd;

      const matchedText = operator === 'line' ? content.substring(match.index, end) : match[1];
      const matchLen = operator === 'line' ? matchedText.length : match[1].length;
      const offset = operator === 'tag' ? 1 : 0;

      matches.push({
        text: operator === 'tag' ? `#${match[1]}` : matchedText,
        before: operator === 'line' ? '' : content.substring(lineStart, match.index),
        after: operator === 'line' ? '' : content.substring(match.index + matchLen + offset, end),
        index: match.index,
      });
    }

    const hasMatches = matches.length > 0;
    const isTextSearchMatch = !operator && node.title.toLowerCase().includes(searchTerm.toLowerCase());

    if (hasMatches || isTextSearchMatch) {
      results.push({ nodeId: node._id, title: node.title, matches });
    }

    return results;
  }, []);
}
