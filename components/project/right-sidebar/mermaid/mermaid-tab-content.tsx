import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MermaidPreview } from './mermaid-preview';
import { useNodeStore } from '@/features/editor/stores/nodes';

const MERMAID_GALLERY = {
  Flowchart: [
    { label: 'Vertical', syntax: 'flowchart TD\n  A --> B', description: 'Top-to-bottom flow.' },
    { label: 'Horizontal', syntax: 'flowchart LR\n  A --> B', description: 'Left-to-right flow.' },
    { label: 'Rounded', syntax: 'flowchart TD\n  id1(Text)', description: 'Rounded node.' },
    { label: 'Stadium', syntax: 'flowchart TD\n  id1([Text])', description: 'Pill shape node.' },
    { label: 'Subroutine', syntax: 'flowchart TD\n  id1[[Text]]', description: 'Double-walled node.' },
    { label: 'Cylinder', syntax: 'flowchart TD\n  id1[(Database)]', description: 'Database node.' },
    { label: 'Circle', syntax: 'flowchart TD\n  id1((Text))', description: 'Circle node.' },
    { label: 'Double Circle', syntax: 'flowchart TD\n  id1(((Text)))', description: 'Double circle node.' },
    { label: 'Decision', syntax: 'flowchart TD\n  id1{Text}', description: 'Rhombus node.' },
    { label: 'Hexagon', syntax: 'flowchart TD\n  id1{{Text}}', description: 'Hexagon node.' },
    { label: 'Parallelogram', syntax: 'flowchart TD\n  id1[/Text/]', description: 'Input/Output slant.' },
    { label: 'Trapezoid', syntax: 'flowchart TD\n  id1[/Text\\]', description: 'Trapezoid node.' },
    { label: 'Dotted', syntax: 'flowchart LR\n  A-.->B', description: 'Dashed line.' },
    { label: 'Thick', syntax: 'flowchart LR\n  A==>B', description: 'Bold line.' },
    { label: 'Text Link', syntax: 'flowchart LR\n  A-- label -->B', description: 'Labeled arrow.' },
    { label: 'Multi-End', syntax: 'flowchart LR\n  A--o B', description: 'Circle-end arrow.' },
    { label: 'Subgraph', syntax: 'flowchart TD\n  subgraph Title\n  A-->B\n  end', description: 'Container.' },
  ],
  SequenceDiagram: [
    { label: 'Basic', syntax: 'sequenceDiagram\n  Alice->>Bob: Hello', description: 'Standard interaction.' },
    { label: 'Note', syntax: 'sequenceDiagram\n  Note right of Alice: Thought', description: 'Annotated sequence.' },
  ],
  ClassDiagram: [
    { label: 'Class', syntax: 'classDiagram\n  class User{\n    +String name\n  }', description: 'Class with members.' },
    { label: 'Relation', syntax: 'classDiagram\n  Animal <|-- Dog', description: 'Inheritance.' },
  ],
  StateDiagram: [{ label: 'v2 State', syntax: 'stateDiagram-v2\n  [*] --> Still\n  Still --> [*]', description: 'Modern state machine.' }],
  ERDiagram: [{ label: 'Entity', syntax: 'erDiagram\n  USER ||--o{ POST : writes', description: 'ER Relationship.' }],
  Mindmap: [{ label: 'Mindmap', syntax: 'mindmap\n  root\n    topic', description: 'Idea map.' }],
  Gantt: [{ label: 'Gantt', syntax: 'gantt\n  section S1\n  T1:2024-01-01, 5d', description: 'Timeline.' }],
  Pie: [{ label: 'Pie', syntax: 'pie title Pets\n  "Dogs" : 40', description: 'Data chart.' }],
  GitGraph: [{ label: 'Git', syntax: 'gitGraph\n  commit\n  branch dev', description: 'Git history.' }],
  Kanban: [{ label: 'Kanban', syntax: 'kanban\n  Todo\n    Task 1', description: 'Task board.' }],
  XYChart: [
    { label: 'XY Chart', syntax: 'xychart-beta\n  x-axis [a, b]\n  y-axis 0 --> 10\n  line [1, 2]', description: 'A coordinate-based line chart.' },
  ],
  Packet: [{ label: 'Packet', syntax: 'packet-beta\n  0-15: "Port"', description: 'Network packet.' }],
};

const MermaidTabContent = () => {
  const [category, setCategory] = useState<keyof typeof MERMAID_GALLERY>('Flowchart');

  return (
    <div className="flex flex-col h-full text-foreground overflow-hidden">
      <div className="border-border flex items-center p-3 gap-2">
        <Select value={category} onValueChange={val => setCategory(val as keyof typeof MERMAID_GALLERY)}>
          <SelectTrigger className="w-full border-border foreground text-xs h-8">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(MERMAID_GALLERY).map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-foreground hover:text-white"
          title={`Insert default ${category} snippet`}
          onClick={() => {
            const defaultItem = MERMAID_GALLERY[category][0];
            if (!defaultItem) return;

            const activeNodeId = useNodeStore.getState().activeNode;
            if (!activeNodeId) return console.log('no active node');

            window.dispatchEvent(
              new CustomEvent('editor-action', {
                detail: {
                  nodeId: activeNodeId,
                  text: `\n\`\`\`mermaid\n${defaultItem.syntax}\n\`\`\`\n`,
                },
              })
            );
          }}
        >
          <span className="text-[10px] font-mono">{'</>'}</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex flex-wrap gap-2 items-stretch justify-start">
          {MERMAID_GALLERY[category].map((item, index) => (
            <button
              key={index}
              onClick={() => {
                const activeNodeId = useNodeStore.getState().activeNode;
                if (!activeNodeId) return;
                window.dispatchEvent(
                  new CustomEvent('editor-action', {
                    detail: {
                      nodeId: activeNodeId,
                      text: `${item.syntax}`,
                    },
                  })
                );
              }}
              className="flex-1 min-w-[120px] min-h-[100px] flex flex-col items-center justify-center p-3 border rounded-md border-border bg-card hover:bg-accent/50 cursor-pointer overflow-hidden transition-none"
              title={item.description}
            >
              <div className="w-full h-full pointer-events-none flex items-center justify-center">
                <MermaidPreview chart={item.syntax} />
              </div>
              <span className="text-[10px] mt-2 text-muted-foreground opacity-70 uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MermaidTabContent;
