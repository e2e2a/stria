export const normalizeGraphPath = (p: string) => {
  if (!p) return '';
  let cleanPath = p.replace(/[<>]/g, '').replace(/\+/g, ' ');
  try {
    cleanPath = decodeURIComponent(cleanPath);
  } catch {
    cleanPath = cleanPath.replace(/%20/g, ' ').replace(/%28/g, '(').replace(/%29/g, ')');
  }
  return cleanPath.replace(/\\/g, '/').replace(/\.md$/i, '').toLowerCase().trim();
};

export const parseMarkdownForGraph = (content: string) => {
  const tags = new Set<string>();
  const parsedLinks = new Set<string>();

  const lines = content.replace(/\r/g, '').split('\n');
  const tagRegex = /(^|\s)#([a-zA-Z0-9_\-\/]+)/g;
  const linkRegex = /\[\[([^\]]+)\]\]|\[([^\]]+)\]\(((?:[^()]+|\([^()]*\))+)\)/g;

  // Extract Tags
  lines.forEach(line => {
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
      tags.add(`tag-${match[2].toLowerCase()}`);
    }
  });

  // Extract Links
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    let rawLink = (match[1] || match[3] || '').split('|')[0].split('#')[0];
    rawLink = normalizeGraphPath(rawLink.replace(/\s+["'].*?["']$/, ''));
    parsedLinks.add(rawLink);
  }

  return { tags: Array.from(tags), parsedLinks: Array.from(parsedLinks) };
};
