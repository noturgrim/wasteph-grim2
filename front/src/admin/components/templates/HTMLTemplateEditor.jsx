import { useState, useEffect, useRef, useCallback } from "react";
import { Code2, ChevronDown, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { api } from "../../services/api";

// Simple placeholders for proposal templates
const PROPOSAL_PLACEHOLDERS = [
  // Client Info
  { key: "clientName", description: "Client full name", group: "Client" },
  { key: "clientEmail", description: "Client email address", group: "Client" },
  { key: "clientPhone", description: "Client phone number", group: "Client" },
  { key: "clientCompany", description: "Company name", group: "Client" },
  { key: "clientPosition", description: "Position/title", group: "Client" },
  { key: "clientAddress", description: "Client address", group: "Client" },

  // Dates
  { key: "proposalDate", description: "Proposal date", group: "Dates" },
  { key: "validUntilDate", description: "Valid until date", group: "Dates" },
];

const ALL_PLACEHOLDERS = PROPOSAL_PLACEHOLDERS;

// Group placeholders by category
const groupPlaceholders = (placeholders) => {
  const groups = {};

  placeholders.forEach((p) => {
    const groupName = p.group || "Other";
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(p);
  });

  return Object.entries(groups);
};

export function HTMLTemplateEditor({ content, onChange, onFullPreview }) {
  const [previewHtml, setPreviewHtml] = useState("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const textareaRef = useRef(null);
  const debounceRef = useRef(null);

  // Generate preview with debouncing — server-side Handlebars via /render endpoint
  const generatePreview = useCallback(
    async (htmlContent) => {
      if (!htmlContent || !htmlContent.trim()) {
        setPreviewHtml("");
        return;
      }

      setIsGeneratingPreview(true);
      try {
        const sampleData = {
          clientName: "John Doe",
          clientEmail: "john.doe@example.com",
          clientPhone: "+63 912 345 6789",
          clientCompany: "ABC Corporation",
          clientPosition: "Operations Manager",
          clientAddress: "123 Business St, Metro Manila",
          proposalDate: new Date().toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          validUntilDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          services: [
            { name: "Fixed Monthly Collection", quantity: 1, unitPrice: 5000, subtotal: 5000 },
          ],
          pricing: {
            subtotal: 5000,
            tax: 500,
            discount: 0,
            total: 5500,
            monthlyRate: 5000,
            wasteAllowance: 1000,
            excessRate: 4,
          },
          terms: "Standard terms and conditions apply.",
        };

        const response = await api.renderProposalTemplate(htmlContent, sampleData);
        if (response.success && response.data?.html) {
          setPreviewHtml(response.data.html);
        }
      } catch (error) {
        console.error("Error generating preview:", error);
        setPreviewHtml("");
      } finally {
        setIsGeneratingPreview(false);
      }
    },
    []
  );

  // Debounced preview generation
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      generatePreview(content);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [content, generatePreview]);

  const handleInsertPlaceholder = (placeholder) => {
    const textarea = textareaRef.current;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = content || "";

      // Use example if available (for complex placeholders like #each)
      const insertText = placeholder.example || `{{${placeholder.key}}}`;

      const newValue =
        currentValue.substring(0, start) + insertText + currentValue.substring(end);

      onChange(newValue);

      // Restore cursor position after the inserted placeholder
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + insertText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleTextChange = (e) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e) => {
    // Handle Tab key for indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = content || "";
      const newValue = currentValue.substring(0, start) + "  " + currentValue.substring(end);

      onChange(newValue);

      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  };

  const groupedPlaceholders = groupPlaceholders(ALL_PLACEHOLDERS);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <Code2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium">HTML Template Editor</span>
          <span className="text-xs text-gray-400">(Handlebars syntax)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Insert Placeholder Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                title="Insert Placeholder"
              >
                <Code2 className="w-4 h-4 text-green-600" />
                Insert Placeholder
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[500px] overflow-y-auto w-[420px]" align="end">
              <DropdownMenuLabel className="text-sm font-semibold">
                Available Placeholders & Helpers
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_PLACEHOLDERS.length === 0 ? (
                <div className="px-3 py-6 text-sm text-gray-500 text-center">
                  Loading placeholders...
                </div>
              ) : (
                groupedPlaceholders.map(([groupName, items]) => (
                  <DropdownMenuGroup key={groupName}>
                    <DropdownMenuLabel className="text-xs text-gray-500 font-medium px-2 py-1.5">
                      {groupName}
                    </DropdownMenuLabel>
                    {items.map((placeholder) => (
                      <DropdownMenuItem
                        key={placeholder.key}
                        onClick={() => handleInsertPlaceholder(placeholder)}
                        className="cursor-pointer px-3 py-2.5"
                      >
                        <div className="flex flex-col gap-1 w-full">
                          <code className="text-xs font-mono bg-green-50 text-green-700 px-2 py-1 rounded w-fit">
                            {placeholder.example ? "See example ↓" : `{{${placeholder.key}}}`}
                          </code>
                          <span className="text-xs text-gray-600">{placeholder.description}</span>
                          {placeholder.example && (
                            <pre className="text-[10px] bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                              <code className="text-gray-700">{placeholder.example}</code>
                            </pre>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </DropdownMenuGroup>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-0">
        {/* HTML Code Editor */}
        <div className="flex flex-col rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm min-h-[500px] max-h-[600px]">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-xs font-medium text-gray-600 ml-2">HTML Code</span>
            </div>
            <span className="text-xs text-gray-400">Tab for indent</span>
          </div>
          <textarea
            ref={textareaRef}
            value={content || ""}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className="flex-1 p-4 font-mono text-sm leading-relaxed bg-[#1e1e1e] text-gray-100 resize-none focus:outline-none overflow-auto min-h-0"
            placeholder={`<!-- Enter your HTML template here -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
  </style>
</head>
<body>
  <h1>Proposal</h1>
  <p>Date: {{proposalDate}}</p>

  <h3>Client Information</h3>
  <p>{{clientName}}</p>
  <p>{{clientCompany}}</p>
  <p>{{clientEmail}}</p>

  <p>Valid until: {{validUntilDate}}</p>
</body>
</html>`}
            spellCheck={false}
          />
        </div>

        {/* Live Preview */}
        <div className="flex flex-col rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm min-h-[500px] max-h-[600px]">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Live Preview</span>
              <span className="text-xs text-gray-400">(with sample data)</span>
            </div>
            {isGeneratingPreview && (
              <span className="text-xs text-green-600 animate-pulse">Updating...</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden bg-white min-h-0">
            {previewHtml ? (
              <iframe
                srcdoc={previewHtml}
                title="Template Preview"
                sandbox="allow-same-origin"
                className="w-full h-full border-0"
                style={{ minHeight: "460px" }}
              />
            ) : (
              <div className="h-full flex items-center justify-center" style={{ minHeight: "460px" }}>
                <div className="text-center text-gray-400">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Preview will appear here</p>
                  <p className="text-xs mt-1">Start typing HTML to see the live preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Helper Tips */}
      <div className="flex items-center gap-6 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">
            Tab
          </kbd>
          <span>Indent</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-green-600">{`{{clientName}}`}</span>
          <span>Insert placeholders for client data</span>
        </span>
      </div>
    </div>
  );
}
