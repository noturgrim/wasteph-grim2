import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
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
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Scope CSS selectors so template styles only apply inside the editor
// Safer handling of @-rules and nested blocks
const scopeStyles = (css, scopeSelector) => {
  if (!css || !scopeSelector) {
    return "";
  }

  return css.replace(/([^{}]+)\{/g, (match, selectors) => {
    const raw = selectors.trim();

    if (!raw) {
      return match;
    }

    // Leave at-rules like @media, @supports, @font-face, @keyframes untouched.
    // Their inner rules will be matched separately and scoped.
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

const MenuBar = ({
  editor,
  onSave,
  onReset,
  hasUnsavedChanges,
  canReset,
  onFullPreview,
}) => {
  if (!editor) return null;

  const btnClass = (isActive) =>
    `p-1.5 rounded transition-colors ${
      isActive
        ? "bg-[#106934] text-white dark:bg-[#16a34a] dark:text-white"
        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
    }`;

  // Check if cursor is inside a table (either in a cell or header)
  // This is more reliable than checking if table node is active
  const isInTable =
    editor.isActive("tableCell") ||
    editor.isActive("tableHeader") ||
    editor.isActive("table");

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 items-center justify-between">
      <div className="flex flex-wrap gap-1 items-center">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive("italic"))}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive("underline"))}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5 self-center" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive("bulletList"))}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive("orderedList"))}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5 self-center" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={btnClass(editor.isActive({ textAlign: "left" }))}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={btnClass(editor.isActive({ textAlign: "center" }))}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={btnClass(editor.isActive({ textAlign: "right" }))}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={btnClass(editor.isActive({ textAlign: "justify" }))}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5 self-center" />

        {/* Table Controls */}
        {/* Insert table (only when cursor is NOT inside a table) */}
        {!isInTable && (
          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
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
              className="p-1.5 rounded transition-colors bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 border border-gray-300 dark:border-gray-600"
              title="Delete Row"
            >
              <span className="flex items-center gap-0.5 text-xs font-medium">
                <Trash2 className="w-3 h-3" /> Row
              </span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="p-1.5 rounded transition-colors bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 border border-gray-300 dark:border-gray-600"
              title="Delete Column"
            >
              <span className="flex items-center gap-0.5 text-xs font-medium">
                <Trash2 className="w-3 h-3" /> Col
              </span>
            </button>
          </>
        )}
      </div>

      {/* Save / Reset / Full Preview */}
      <div className="flex gap-2">
        {onFullPreview && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onFullPreview}
            className="gap-1 text-gray-700 dark:text-gray-200"
          >
            <Eye className="w-4 h-4 mr-1" />
            Full Preview
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onReset}
          disabled={!canReset}
          className={
            canReset
              ? "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
          }
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
const ProposalHtmlEditor = ({
  content,
  templateStyles,
  onChange,
  onUnsavedChange,
  className = "",
  onFullPreview,
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Track selection changes to force MenuBar re-render when cursor moves
  const [selectionUpdate, setSelectionUpdate] = useState(0);
  // Store the RAW HTML string BEFORE Tiptap parses it (preserves structure for reset)
  const originalRawHtmlRef = useRef(content || "");
  // Don't initialize savedContentRef with raw content - wait for Tiptap to render first
  const savedContentRef = useRef("");
  const onUnsavedChangeRef = useRef(onUnsavedChange);
  const isInitializingRef = useRef(true);

  useEffect(() => {
    onUnsavedChangeRef.current = onUnsavedChange;
  }, [onUnsavedChange]);

  // Store original raw HTML whenever content prop changes (before Tiptap parsing)
  // This ensures reset can restore the original structure even if Tiptap simplified it
  useEffect(() => {
    if (content !== undefined) {
      const rawHtml = content || "";
      originalRawHtmlRef.current = rawHtml;
    }
  }, [content]);

  const scopedStyles = templateStyles
    ? scopeStyles(templateStyles, ".proposal-editor-scope")
    : "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            // Allow classes on paragraphs to preserve template styling
            class: null,
          },
        },
        // Configure hardBreak to preserve line breaks
        hardBreak: {
          HTMLAttributes: {
            class: null,
          },
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph", "tableCell", "tableHeader"],
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: "pricing-table",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          // Preserve any classes on table headers
          class: null,
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          // Preserve any classes on table cells
          class: null,
        },
      }),
    ],
    content: content || "",
    immediatelyRender: false,
    parseOptions: {
      preserveWhitespace: "full",
      // Preserve HTML structure better by not stripping unknown elements
      findPositions: false,
    },
    onCreate: ({ editor: ed }) => {
      // On initial creation, sync savedContentRef to what Tiptap actually rendered
      // This prevents false "unsaved changes" on initial load
      const renderedHtml = ed.getHTML();
      savedContentRef.current = renderedHtml;
      isInitializingRef.current = false;
      setHasUnsavedChanges(false);
      if (onUnsavedChangeRef.current) {
        onUnsavedChangeRef.current(false);
      }
    },
    onSelectionUpdate: () => {
      // Force MenuBar re-render when selection changes (e.g., clicking in table)
      setSelectionUpdate((prev) => prev + 1);
    },
    onUpdate: ({ editor: ed }) => {
      // Skip comparison during initialization to avoid false positives
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
        class:
          "proposal-editor-scope p-4 focus:outline-none min-h-[300px] bg-white",
      },
      // Preserve HTML attributes when parsing
      transformPastedHTML: (html) => {
        return html;
      },
    },
  });

  // Sync when parent passes new content (e.g. navigating back to step 3)
  useEffect(() => {
    if (editor && content !== undefined) {
      const rawHtml = content || "";
      originalRawHtmlRef.current = rawHtml;
      // Mark as initializing to prevent false "unsaved changes" during content update
      isInitializingRef.current = true;
      // Always re-parse from raw HTML to ensure we get the latest structure
      editor.commands.setContent(rawHtml);
      // After content is set, update savedContentRef to match what Tiptap rendered
      // Use setTimeout to ensure Tiptap has finished rendering
      setTimeout(() => {
        if (editor) {
          savedContentRef.current = editor.getHTML();
          isInitializingRef.current = false;
          setHasUnsavedChanges(false);
          if (onUnsavedChangeRef.current) {
            onUnsavedChangeRef.current(false);
          }
        }
      }, 0);
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
    // Reset to the ORIGINAL raw HTML (before Tiptap parsing) to restore structure
    const originalRaw = originalRawHtmlRef.current;
    editor.commands.setContent(originalRaw);
    const resetHtml = editor.getHTML(); // Get what Tiptap rendered after reset
    savedContentRef.current = resetHtml;
    setHasUnsavedChanges(false);
    if (onUnsavedChangeRef.current) onUnsavedChangeRef.current(false);
    if (onChange) onChange({ html: resetHtml, json: null });
  }, [editor, onChange]);

  const canReset = editor
    ? editor.getHTML() !== savedContentRef.current
    : false;

  return (
    <div
      className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col ${className}`}
    >
      {/* Inject scoped template styles so the template's own CSS applies inside the editor */}
      {scopedStyles && (
        <style
          dangerouslySetInnerHTML={{
            __html: sanitizeCss(scopedStyles),
          }}
        />
      )}

      {/* Ensure tables render correctly inside ProseMirror regardless of template styles */}
      <style>{`
        /* Page break indicators - matched to actual PDF output with header (140px top + 20px bottom margins) */
        .proposal-editor-scope {
          background-image: repeating-linear-gradient(
            transparent,
            transparent 930px,  /* Content area per page in PDF (A4 height ~1123px - 140px top - 20px bottom - padding = ~930px usable) */
            #94a3b8 930px,     /* Page break line color */
            #94a3b8 932px      /* Line thickness: 2px */
          );
          background-position: 0 0; /* Start from top since we're showing content area only */
          /* Force text to stay dark in both light and dark mode */
          color: #000000 !important;
          /* Add top margin to account for sticky header indicator */
          margin-top: 0;
        }

        /* ProseMirror contenteditable - show full pages like Google Docs */
        .proposal-editor-scope .ProseMirror {
          /* Always show at least 1 full page of content area */
          min-height: 930px !important;
          /* Add slight top padding for breathing room after header indicator */
          padding-top: 8px;
        }

        /* Add spacer after content to allow scrolling through the full current page */
        .proposal-editor-scope .ProseMirror::after {
          content: '';
          display: block;
          height: 930px; /* Full page of extra space below content */
        }

        /* Ensure all text elements inside editor stay dark */
        .proposal-editor-scope *:not(th):not(.header *) {
          color: inherit !important;
        }

        /* Keep header text visible (it has its own styling) */
        .proposal-editor-scope .header * {
          color: inherit;
        }

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
          color: #000000 !important;
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
        onFullPreview={onFullPreview}
        key={selectionUpdate}
      />

      <div className="flex-1 overflow-y-auto min-h-0 relative">
        {/* Header space indicator - shows where the PDF header will appear */}
        <div className="sticky top-0 z-20 bg-linear-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-b-2 border-blue-300 dark:border-blue-700 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Header Area</span>
              <span className="text-blue-600 dark:text-blue-400">
                (Company header will appear here in PDF - not editable)
              </span>
            </div>
            <span className="text-blue-600 dark:text-blue-400 font-mono">~140px reserved</span>
          </div>
        </div>

        <EditorContent editor={editor} />

        {/* Page break legend */}
        <div className="sticky top-16 left-4 inline-block bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300 shadow-sm z-10 ml-4 mt-2">
          <span className="font-medium">Horizontal lines</span> = PDF page
          breaks (approx. A4 size)
        </div>
      </div>
    </div>
  );
};

export default ProposalHtmlEditor;
