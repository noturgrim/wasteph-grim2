import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
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

// Scope CSS selectors so template styles only apply inside the editor
const scopeStyles = (css, scopeSelector) => {
  return css.replace(/([^{}]+)\{/g, (match, selectors) => {
    const scoped = selectors
      .split(",")
      .map((selector) => {
        const trimmed = selector.trim();
        if (!trimmed || trimmed === "*") return `${scopeSelector} ${trimmed}`;
        if (trimmed.startsWith(scopeSelector)) return trimmed;
        // Skip @-rules (@media, @keyframes, etc.) — they're not selectors
        if (trimmed.startsWith("@")) return trimmed;
        return `${scopeSelector} ${trimmed}`;
      })
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

  const isInTable = editor.isActive("table");

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
        {/* Insert table (only when cursor is NOT inside a table) */}
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

        {/* Row / Column controls (only when cursor IS inside a table) */}
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
              className="p-1.5 rounded transition-colors bg-white text-red-600 hover:bg-red-50 border border-gray-300"
              title="Delete Row"
            >
              <span className="flex items-center gap-0.5 text-xs font-medium">
                <Trash2 className="w-3 h-3" /> Row
              </span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="p-1.5 rounded transition-colors bg-white text-red-600 hover:bg-red-50 border border-gray-300"
              title="Delete Column"
            >
              <span className="flex items-center gap-0.5 text-xs font-medium">
                <Trash2 className="w-3 h-3" /> Col
              </span>
            </button>
          </>
        )}
      </div>

      {/* Save / Reset */}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onReset}
          disabled={!canReset}
          className={canReset ? "text-gray-700 hover:bg-gray-100" : "text-gray-400 cursor-not-allowed"}
          title="Reset to original template"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={!hasUnsavedChanges}
          className={
            hasUnsavedChanges
              ? "bg-[#106934] hover:bg-[#0d5129] text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }
        >
          <Save className="w-4 h-4 mr-1" />
          {hasUnsavedChanges ? "Save Changes" : "Saved"}
        </Button>
      </div>
    </div>
  );
};

/**
 * ProposalHtmlEditor — Tiptap-based rich text editor for proposal / contract HTML.
 * Preserves template styles via scoped CSS injection.
 *
 * @param {string}   content          – Initial HTML body content
 * @param {string}   templateStyles   – Raw CSS extracted from the template <head>
 * @param {function} onChange         – Called on save with { html, json }
 * @param {function} onUnsavedChange  – Called with boolean whenever unsaved state changes
 * @param {string}   className        – Extra Tailwind classes for the outer wrapper
 */
const ProposalHtmlEditor = ({ content, templateStyles, onChange, onUnsavedChange, className = "" }) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const originalContentRef = useRef(content || "");
  const savedContentRef = useRef(content || "");
  const onUnsavedChangeRef = useRef(onUnsavedChange);

  useEffect(() => {
    onUnsavedChangeRef.current = onUnsavedChange;
  }, [onUnsavedChange]);

  const scopedStyles = templateStyles ? scopeStyles(templateStyles, ".proposal-editor-scope") : "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: { HTMLAttributes: { class: null } },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph", "tableCell", "tableHeader"] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || "",
    immediatelyRender: false,
    parseOptions: { preserveWhitespace: "full" },
    onUpdate: ({ editor: ed }) => {
      const currentHtml = ed.getHTML();
      const hasChanges = currentHtml !== savedContentRef.current;
      setHasUnsavedChanges(hasChanges);
      if (onUnsavedChangeRef.current) {
        onUnsavedChangeRef.current(hasChanges);
      }
    },
    editorProps: {
      attributes: {
        class: "proposal-editor-scope p-4 focus:outline-none min-h-[300px] bg-white",
      },
    },
  });

  // Sync when parent passes new content (e.g. navigating back to step 3)
  useEffect(() => {
    if (editor && content !== undefined && content !== savedContentRef.current) {
      editor.commands.setContent(content || "");
      originalContentRef.current = content || "";
      savedContentRef.current = content || "";
      setHasUnsavedChanges(false);
    }
  }, [content, editor]);

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
    const original = originalContentRef.current;
    editor.commands.setContent(original);
    savedContentRef.current = original;
    setHasUnsavedChanges(false);
    if (onUnsavedChangeRef.current) onUnsavedChangeRef.current(false);
    if (onChange) onChange({ html: original, json: null });
  }, [editor, onChange]);

  const canReset = editor ? editor.getHTML() !== originalContentRef.current : false;

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden flex flex-col ${className}`}>
      {/* Inject scoped template styles so the template's own CSS applies inside the editor */}
      {scopedStyles && <style>{scopedStyles}</style>}

      {/* Ensure tables render correctly inside ProseMirror regardless of template styles */}
      <style>{`
        .proposal-editor-scope table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }
        .proposal-editor-scope table th,
        .proposal-editor-scope table td {
          border: 1px solid #d1d5db;
          padding: 8px 10px;
          text-align: left;
          vertical-align: top;
        }
        .proposal-editor-scope table th {
          font-weight: 600;
          background-color: #f3f4f6;
        }
        /* Selected cell highlight (Tiptap default) */
        .proposal-editor-scope .selectedCell {
          background-color: #dbeafe !important;
        }
        /* Column / row grip controls that Tiptap renders */
        .proposal-editor-scope .grip-row,
        .proposal-editor-scope .grip-column {
          background-color: #e5e7eb;
        }
        .proposal-editor-scope .grip-row.selected,
        .proposal-editor-scope .grip-column.selected {
          background-color: #106934;
        }
      `}</style>

      <MenuBar
        editor={editor}
        onSave={handleSave}
        onReset={handleReset}
        hasUnsavedChanges={hasUnsavedChanges}
        canReset={canReset}
      />

      <div className="flex-1 overflow-y-auto min-h-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default ProposalHtmlEditor;
