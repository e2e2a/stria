import { EditorView } from '@uiw/react-codemirror';
import React from 'react';
import {
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import {
  Bold,
  Check,
  ClipboardCheck,
  Code,
  CodeXml,
  Copy,
  Eraser,
  ExternalLink,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Highlighter,
  Italic,
  LayoutList,
  Link,
  List,
  ListOrdered,
  Minus,
  Paintbrush,
  Percent,
  Pilcrow,
  Quote,
  Scissors,
  Sigma,
  SquareCheckBig,
  SquareDashed,
  SquareSigma,
  Strikethrough,
  TextAlignStart,
} from 'lucide-react';
import {
  clearFormatting,
  insertCallout,
  insertCodeBlock,
  insertHorizontalRule,
  insertMathBlock,
  insertTable,
  setAsBody,
  toggleHeading,
  toggleInlineFormat,
  toggleList,
  isHeadingActive,
  isFormatActive,
  editorSelectAll,
  editorCopy,
  editorCut,
  editorPaste,
  insertExternalLink,
  insertInternalLink,
} from '@/lib/client/markdown/editor-context-menu/general';

const GeneralContextMenu = ({
  currentLineText,
  cursorPos,
  editorViewRef,
}: {
  currentLineText: string;
  cursorPos: number;
  editorViewRef: React.RefObject<EditorView | null>;
}) => {
  return (
    <ContextMenuContent>
      <ContextMenuGroup>
        <ContextMenuItem onClick={() => insertInternalLink({ editorViewRef })}>
          <Link />
          Add link
        </ContextMenuItem>
        <ContextMenuItem onClick={() => insertExternalLink({ editorViewRef })}>
          <ExternalLink />
          Add external link
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-x-2">
            <Paintbrush />
            Format
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuGroup>
              <ContextMenuItem onClick={() => toggleInlineFormat({ editorViewRef, symbol: '**' })} className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                  <Bold />
                  <span>Bold</span>
                </div>
                {!!isFormatActive({ currentLineText, cursorPos, symbol: '**' }) && <Check className="text-primary" />}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => toggleInlineFormat({ editorViewRef, symbol: '*' })} className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                  <Italic />
                  <span>Italic</span>
                </div>
                {!!isFormatActive({ currentLineText, cursorPos, symbol: '*' }) && <Check className="text-primary" />}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => toggleInlineFormat({ editorViewRef, symbol: '~~' })} className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                  <Strikethrough />
                  <span>Strikethrough</span>
                </div>
                {!!isFormatActive({ currentLineText, cursorPos, symbol: '~~' }) && <Check className="text-primary" />}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => toggleInlineFormat({ editorViewRef, symbol: '==' })} className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                  <Highlighter />
                  <span>Highlight</span>
                </div>
                {!!isFormatActive({ currentLineText, cursorPos, symbol: '==' }) && <Check className="text-primary" />}
              </ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem onClick={() => toggleInlineFormat({ editorViewRef, symbol: '`' })} className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                  <CodeXml />
                  <span>Code</span>
                </div>
                {!!isFormatActive({ currentLineText, cursorPos, symbol: '`' }) && <Check className="text-primary" />}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => toggleInlineFormat({ editorViewRef, symbol: '$' })} className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                  <Sigma />
                  <span>Math</span>
                </div>
                {!!isFormatActive({ currentLineText, cursorPos, symbol: '$' }) && <Check className="text-primary" />}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => toggleInlineFormat({ editorViewRef, symbol: '%%' })} className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                  <Percent />
                  <span>Comment</span>
                </div>
                {!!isFormatActive({ currentLineText, cursorPos, symbol: '%%' }) && <Check className="text-primary" />}
              </ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem onClick={() => clearFormatting({ editorViewRef })}>
                <Eraser />
                Clear formatting
              </ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-x-2">
            <Pilcrow />
            Paragraph
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="ml-1 w-[180px]">
            <ContextMenuGroup>
              <ContextMenuItem onClick={() => toggleList({ editorViewRef, type: 'bullet' })}>
                <List />
                Bullet list
              </ContextMenuItem>
              <ContextMenuItem onClick={() => toggleList({ editorViewRef, type: 'number' })}>
                <ListOrdered />
                Numbered list
              </ContextMenuItem>
              <ContextMenuItem onClick={() => toggleList({ editorViewRef, type: 'task' })}>
                <SquareCheckBig />
                Task list
              </ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              {[1, 2, 3, 4, 5, 6].map(level => {
                const Icon = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6][level - 1];
                const regex = new RegExp(`^(?:>\\s*)*#{${level}}\\s`);
                const active = regex.test(currentLineText);

                return (
                  <ContextMenuItem key={level} onClick={() => toggleHeading({ editorViewRef, level })} className="flex items-center justify-between">
                    <div className="flex items-center gap-x-2">
                      <Icon className="h-4 w-4" />
                      <span>Heading {level}</span>
                    </div>
                    {active && <Check className="text-primary" />}
                  </ContextMenuItem>
                );
              })}
              <ContextMenuItem onClick={() => setAsBody({ editorViewRef })} className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                  <TextAlignStart className="h-4 w-4" />
                  <span>Body</span>
                </div>
                {!!isHeadingActive({ currentLineText }) && <Check className="h-4 w-4 text-primary" />}
              </ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem onClick={() => toggleList({ editorViewRef, type: 'quote' })}>
                <Quote />
                Quote
              </ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-x-2">
            <Pilcrow />
            Insert
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuGroup>
              <ContextMenuItem>
                <List />
                Foot Note
              </ContextMenuItem>
              <ContextMenuItem onClick={() => insertTable({ editorViewRef })}>
                <ListOrdered />
                Table
              </ContextMenuItem>
              <ContextMenuItem onClick={() => insertCallout({ editorViewRef })}>
                <Quote />
                Callout
              </ContextMenuItem>
              <ContextMenuItem onClick={() => insertHorizontalRule({ editorViewRef })}>
                <Minus />
                Horizontal rule
              </ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem onClick={() => insertCodeBlock({ editorViewRef })}>
                <Code />
                Code block
              </ContextMenuItem>
              <ContextMenuItem onClick={() => insertMathBlock({ editorViewRef })}>
                <SquareSigma />
                Math block
              </ContextMenuItem>
              <ContextMenuItem disabled>
                <LayoutList />
                New base
              </ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => editorCut({ editorViewRef })}>
          <Scissors />
          Cut
        </ContextMenuItem>
        <ContextMenuItem onClick={() => editorCopy({ editorViewRef })}>
          <Copy />
          Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={() => editorPaste({ editorViewRef })}>
          <ClipboardCheck />
          Paste
        </ContextMenuItem>
        <ContextMenuItem onClick={() => editorSelectAll({ editorViewRef })}>
          <SquareDashed />
          Select All
        </ContextMenuItem>
      </ContextMenuGroup>
    </ContextMenuContent>
  );
};

export default GeneralContextMenu;
