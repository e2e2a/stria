import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true, // Switch to true for responsive behavior
    htmlLabels: true,
    curve: 'basis',
  },
});

export const MermaidPreview = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    if (!ref.current || !chart) return;

    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (isMounted && ref.current) {
          ref.current.innerHTML = svg;

          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            svgElement.removeAttribute('height');
            svgElement.style.width = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.maxWidth = '100%';
          }
        }
      })
      .catch(err => console.error('Mermaid Render Error:', err));

    return () => {
      isMounted = false;
    };
  }, [chart]);

  return <div ref={ref} className="mermaid-preview w-full h-full flex items-center justify-center overflow-hidden" />;
};
