'use client';

import {
  createSuggestionItems,
  EditorBubble,
  EditorBubbleItem,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  handleCommandNavigation,
} from 'novel';
import { useEffect,useState } from 'react';

// ── Slash command items ─────────────────────────────────────────────────────

const slashItems = createSuggestionItems([
  {
    title: 'Heading 2',
    description: 'Section heading',
    icon: <span className="text-xs font-bold">H2</span>,
    searchTerms: ['heading', 'h2', 'section'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Sub-section heading',
    icon: <span className="text-xs font-bold">H3</span>,
    searchTerms: ['heading', 'h3', 'subsection'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: 'Paragraph',
    description: 'Plain text paragraph',
    icon: <span className="text-xs">P</span>,
    searchTerms: ['paragraph', 'text', 'normal'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered bullet list',
    icon: <span className="text-xs">-</span>,
    searchTerms: ['bullet', 'list', 'unordered'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered numbered list',
    icon: <span className="text-xs">1.</span>,
    searchTerms: ['numbered', 'list', 'ordered'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Blockquote',
    description: 'Quote block',
    icon: <span className="text-xs">&ldquo;</span>,
    searchTerms: ['quote', 'blockquote'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Code snippet',
    icon: <span className="text-xs font-mono">{'{}'}</span>,
    searchTerms: ['code', 'codeblock'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Horizontal Rule',
    description: 'Visual divider',
    icon: <span className="text-xs">---</span>,
    searchTerms: ['hr', 'divider', 'rule'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
]);

// ── Main editor component ───────────────────────────────────────────────────

interface NovelEditorProps {
  initialContent?: string;
  onUpdate: (html: string) => void;
}

export function NovelEditor({ initialContent, onUpdate }: NovelEditorProps) {
  const [hydrated, setHydrated] = useState(false);

  // Avoid SSR mismatch -- only render the editor on the client
  useEffect(() => {
    setHydrated(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-[300px] rounded-lg border border-white/20 bg-white/5 p-4">
        <p className="text-sm text-gray-500">Loading editor...</p>
      </div>
    );
  }

  return (
    <EditorRoot>
      <EditorContent
        className="novel-editor min-h-[300px] rounded-lg border border-white/20 bg-white/5 p-4"
        initialContent={
          initialContent
            ? undefined
            : { type: 'doc', content: [{ type: 'paragraph' }] }
        }
        extensions={[]}
        immediatelyRender={false}
        onCreate={({ editor }) => {
          if (initialContent) {
            editor.commands.setContent(initialContent);
          }
        }}
        onUpdate={({ editor }) => {
          onUpdate(editor.getHTML());
        }}
        editorProps={{
          attributes: {
            class: 'novel-content prose-dark focus:outline-none',
          },
          handleKeyDown: (_view, event) => {
            return handleCommandNavigation(event) ?? false;
          },
        }}
      >
        {/* Bubble menu for inline formatting */}
        <EditorBubble className="flex items-center gap-0.5 rounded-lg border border-white/20 bg-gray-900 p-1 shadow-xl">
          <EditorBubbleItem
            onSelect={(editor) => editor.chain().focus().toggleBold().run()}
          >
            <span className="rounded px-2 py-1 text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white">
              B
            </span>
          </EditorBubbleItem>
          <EditorBubbleItem
            onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
          >
            <span className="rounded px-2 py-1 text-xs italic text-white/60 hover:bg-white/10 hover:text-white">
              I
            </span>
          </EditorBubbleItem>
          <EditorBubbleItem
            onSelect={(editor) => editor.chain().focus().toggleStrike().run()}
          >
            <span className="rounded px-2 py-1 text-xs text-white/60 line-through hover:bg-white/10 hover:text-white">
              S
            </span>
          </EditorBubbleItem>
          <EditorBubbleItem
            onSelect={(editor) => editor.chain().focus().toggleCode().run()}
          >
            <span className="rounded px-2 py-1 font-mono text-xs text-white/60 hover:bg-white/10 hover:text-white">
              {'</>'}
            </span>
          </EditorBubbleItem>
        </EditorBubble>

        {/* Slash command menu */}
        <EditorCommand className="z-50 rounded-lg border border-white/20 bg-gray-900 p-1 shadow-xl">
          <EditorCommandEmpty className="px-3 py-2 text-sm text-gray-500">
            No results
          </EditorCommandEmpty>
          <EditorCommandList>
            {slashItems.map((item) => (
              <EditorCommandItem
                key={item.title}
                value={item.title}
                onCommand={(val) => item.command?.(val)}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 aria-selected:bg-white/10"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-white/20 bg-white/5">
                  {item.icon}
                </span>
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>
      </EditorContent>
    </EditorRoot>
  );
}
