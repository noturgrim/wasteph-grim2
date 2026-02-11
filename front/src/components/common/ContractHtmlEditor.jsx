import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Node, mergeAttributes } from "@tiptap/core";
import { sanitizeCss } from "../../utils/sanitize";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom Div extension to preserve div elements with classes
const Div = Node.create({
  name: "div",
  content: "block+",
  group: "block",
  defining: true,

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) => {
          if (!attributes.class) {
            return {};
          }
          return { class: attributes.class };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "div" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },
});

// Custom Span extension to preserve span elements with classes
const Span = Node.create({
  name: "span",
  content: "inline*",
  group: "inline",
  inline: true,

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) => {
          if (!attributes.class) {
            return {};
          }
          return { class: attributes.class };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

// Scope CSS selectors so template styles only apply inside the editor
const scopeStyles = (css, scopeSelector) => {
  if (!css || !scopeSelector) {
    return "";
  }

  return css.replace(/([^{}]+)\{/g, (match, selectors) => {
    const raw = selectors.trim();

    if (!raw) {
      return match;
    }

    // Leave at-rules like @media, @supports, @font-face, @keyframes untouched
    if (raw.startsWith("@")) {
      return match;
    }

    const scoped = raw
      .split(",")
      .map((selector) => {
        const trimmed = selector.trim();
        if (!trimmed) return "";
        if (trimmed === "*") return `${scopeSelector} ${trimmed}`;
        if (trimmed.startsWith(scopeSelector)) return trimmed;
        return `${scopeSelector} ${trimmed}`;
      })
      .filter(Boolean)
      .join(", ");

    return `${scoped} {`;
  });
};

const MenuBar = ({ editor, onSave, onReset, hasUnsavedChanges, canReset }) => {
  if (!editor) return null;

  const btnClass = (isActive) =>
    `p-1.5 rounded transition-colors ${
      isActive
        ? "bg-[#106934] text-white"
        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
    }`;

  const isInTable = editor.isActive("tableCell") || editor.isActive("tableHeader") || editor.isActive("table");

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200 items-center justify-between">
      <div className="flex flex-wrap gap-1 items-center">
        {/* Text Formatting */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))} title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))} title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive("underline"))} title="Underline">
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5 self-center" />

        {/* Lists */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))} title="Bullet List">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))} title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5 self-center" />

        {/* Alignment */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btnClass(editor.isActive({ textAlign: "left" }))} title="Align Left">
          <AlignLeft className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btnClass(editor.isActive({ textAlign: "center" }))} title="Align Center">
          <AlignCenter className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={btnClass(editor.isActive({ textAlign: "right" }))} title="Align Right">
          <AlignRight className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={btnClass(editor.isActive({ textAlign: "justify" }))} title="Justify">
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5 self-center" />

        {/* Table Controls */}
        {!isInTable && (
          <button
            type="button"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className={btnClass(false)}
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        )}

        {isInTable && (
          <>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className={btnClass(false)}
              title="Add Row Below"
            >
              <span className="flex items-center gap-0.5 text-xs font-medium">
                <Plus className="w-3 h-3" /> Row
              </span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className={btnClass(false)}
              title="Add Column Right"
            >
              <span className="flex items-center gap-0.5 text-xs font-medium">
                <Plus className="w-3 h-3" /> Col
              </span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className={btnClass(false)}
              title="Delete Row"
            >
              <span className="flex items-center gap-0.5 text-xs font-medium">
                <Trash2 className="w-3 h-3" /> Row
              </span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className={btnClass(false)}
              title="Delete Column"
            >
              <span className="flex items-center gap-0.5 text-xs font-medium">
                <Trash2 className="w-3 h-3" /> Col
              </span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className={btnClass(false)}
              title="Delete Table"
            >
              <span className="flex items-center gap-0.5 text-xs font-medium">
                <Trash2 className="w-3 h-3" /> Table
              </span>
            </button>
          </>
        )}
      </div>

      {/* Save/Reset buttons */}
      <div className="flex gap-2 items-center ml-auto">
        <Button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          variant="ghost"
          size="sm"
          className="h-7 px-2"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          <span className="text-xs">Reset</span>
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={!hasUnsavedChanges}
          size="sm"
          className="h-7 px-3 bg-green-600 hover:bg-green-700"
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          <span className="text-xs">Save Changes</span>
          {hasUnsavedChanges && (
            <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-white animate-pulse" />
          )}
        </Button>
      </div>
    </div>
  );
};

const ContractHtmlEditor = ({
  content = "",
  templateStyles = "",
  onChange,
  onUnsavedChange,
  className = "",
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectionUpdate, setSelectionUpdate] = useState(0);
  const savedContentRef = useRef("");
  const originalRawHtmlRef = useRef("");
  const isInitializingRef = useRef(true);
  const onUnsavedChangeRef = useRef(onUnsavedChange);

  useEffect(() => {
    onUnsavedChangeRef.current = onUnsavedChange;
  }, [onUnsavedChange]);

  useEffect(() => {
    if (content !== undefined) {
      const rawHtml = content || "";
      originalRawHtmlRef.current = rawHtml;
    }
  }, [content]);

  const scopedStyles = templateStyles ? scopeStyles(templateStyles, ".contract-editor-scope") : "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: null,
          },
        },
        heading: {
          HTMLAttributes: {
            class: null,
          },
        },
        hardBreak: {
          HTMLAttributes: {
            class: null,
          },
        },
      }),
      Div, // Preserve div elements with classes
      Span, // Preserve span elements with classes
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph", "tableCell", "tableHeader"] }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: 'contract-table',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
    ],
    content: content || "",
    immediatelyRender: false,
    parseOptions: {
      preserveWhitespace: "full",
      findPositions: false,
    },
    onCreate: ({ editor: ed }) => {
      const renderedHtml = ed.getHTML();
      savedContentRef.current = renderedHtml;
      isInitializingRef.current = false;
      setHasUnsavedChanges(false);
      if (onUnsavedChangeRef.current) {
        onUnsavedChangeRef.current(false);
      }
    },
    onSelectionUpdate: () => {
      setSelectionUpdate((prev) => prev + 1);
    },
    onUpdate: ({ editor: ed }) => {
      if (isInitializingRef.current) {
        return;
      }
      const currentHtml = ed.getHTML();
      const hasChanges = currentHtml !== savedContentRef.current;
      setHasUnsavedChanges(hasChanges);
      if (onUnsavedChangeRef.current) {
        onUnsavedChangeRef.current(hasChanges);
      }
    },
    editorProps: {
      attributes: {
        class: "contract-editor-scope p-4 focus:outline-none min-h-[500px] bg-white",
      },
      transformPastedHTML: (html) => {
        return html;
      },
    },
  });

  useEffect(() => {
    if (editor && content !== undefined) {
      const rawHtml = content || "";
      originalRawHtmlRef.current = rawHtml;
      isInitializingRef.current = true;
      editor.commands.setContent(rawHtml);
      setTimeout(() => {
        const renderedHtml = editor.getHTML();
        savedContentRef.current = renderedHtml;
        isInitializingRef.current = false;
        setHasUnsavedChanges(false);
        if (onUnsavedChangeRef.current) {
          onUnsavedChangeRef.current(false);
        }
      }, 0);
    }
  }, [editor, content]);

  const handleSave = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    savedContentRef.current = html;
    setHasUnsavedChanges(false);
    if (onUnsavedChangeRef.current) onUnsavedChangeRef.current(false);
    if (onChange) onChange({ html, json: null });
  }, [editor, onChange]);

  const handleReset = useCallback(() => {
    if (!editor) return;
    const originalRaw = originalRawHtmlRef.current;
    editor.commands.setContent(originalRaw);
    const resetHtml = editor.getHTML();
    savedContentRef.current = resetHtml;
    setHasUnsavedChanges(false);
    if (onUnsavedChangeRef.current) onUnsavedChangeRef.current(false);
    if (onChange) onChange({ html: resetHtml, json: null });
  }, [editor, onChange]);

  const canReset = editor ? editor.getHTML() !== savedContentRef.current : false;

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden flex flex-col ${className}`}>
      {/* Inject scoped template styles */}
      {scopedStyles && (
        <style
          dangerouslySetInnerHTML={{
            __html: sanitizeCss(scopedStyles),
          }}
        />
      )}

      {/* Contract-specific styles */}
      <style>{`
        .contract-editor-scope {
          /* Force text to stay dark in both light and dark mode */
          color: #000000 !important;
        }

        /* Ensure all text elements inside editor stay dark */
        .contract-editor-scope *:not(th):not(.header *) {
          color: inherit !important;
        }

        /* Keep header text visible (it has its own styling) */
        .contract-editor-scope .header * {
          color: inherit;
        }

        .contract-editor-scope table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }
        .contract-editor-scope table th,
        .contract-editor-scope table td {
          border: 1px solid #d1d5db;
          padding: 8px 10px;
          text-align: left;
          vertical-align: top;
        }
        .contract-editor-scope table th {
          font-weight: 600;
          background-color: #f3f4f6;
          color: #000000 !important;
        }
        .contract-editor-scope .selectedCell {
          background-color: #dbeafe !important;
        }
        .contract-editor-scope .grip-row,
        .contract-editor-scope .grip-column {
          background-color: #e5e7eb;
        }
        .contract-editor-scope .grip-row.selected,
        .contract-editor-scope .grip-column.selected {
          background-color: #3b82f6;
        }
      `}</style>

      <MenuBar
        editor={editor}
        onSave={handleSave}
        onReset={handleReset}
        hasUnsavedChanges={hasUnsavedChanges}
        canReset={canReset}
        key={selectionUpdate}
      />

      <div className="flex-1 overflow-y-auto min-h-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default ContractHtmlEditor;
