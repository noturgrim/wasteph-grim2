import { useRef, useEffect } from "react";
import { Bold, Italic, List, ListOrdered, Undo, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/utils/sanitize";

export function RichTextEditor({ value, onChange, placeholder, className }) {
  const editorRef = useRef(null);
  const isUpdating = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isUpdating.current) {
      // Only update if content is different
      const sanitized = sanitizeHtml(value || "");
      if (editorRef.current.innerHTML !== sanitized) {
        editorRef.current.innerHTML = sanitized;
      }
    }
  }, [value]);

  const handleInput = (e) => {
    isUpdating.current = true;
    onChange(e.currentTarget.innerHTML);
    setTimeout(() => {
      isUpdating.current = false;
    }, 0);
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    // Trigger change event
    handleInput({ currentTarget: editorRef.current });
  };

  const handleKeyDown = (e) => {
    // Handle Ctrl+Z (Undo) and Ctrl+Y (Redo)
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') {
        e.preventDefault();
        execCommand('undo');
      } else if (e.key === 'y') {
        e.preventDefault();
        execCommand('redo');
      }
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 bg-muted/30 p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          title="Bold (Ctrl+B)"
          className="h-8 px-2"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          title="Italic (Ctrl+I)"
          className="h-8 px-2"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <div className="mx-1 h-6 w-px bg-border" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
          className="h-8 px-2"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
          className="h-8 px-2"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className="mx-1 h-6 w-px bg-border" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('undo')}
          title="Undo (Ctrl+Z)"
          className="h-8 px-2"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('redo')}
          title="Redo (Ctrl+Y)"
          className="h-8 px-2"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={`min-h-[200px] rounded-b-md border border-t-0 p-3 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}
        data-placeholder={placeholder}
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      />

      <style>{`
        [contentEditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contentEditable] {
          line-height: 1.6;
        }
        [contentEditable] strong {
          font-weight: 700;
        }
        [contentEditable] em {
          font-style: italic;
        }
        [contentEditable] ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        [contentEditable] ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        [contentEditable] li {
          display: list-item;
          margin: 0.25rem 0;
        }
        [contentEditable] p {
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
