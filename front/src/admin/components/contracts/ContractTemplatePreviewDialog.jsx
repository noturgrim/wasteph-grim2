import { useState, useEffect } from "react";
import { Eye, X, FileText, Calendar, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { sanitizeHtmlWithStyles } from "@/utils/sanitize";

// Sample contract data for preview
const SAMPLE_CONTRACT_DATA = {
  contractNumber: "CONT-20260131-0001",
  contractDate: "January 31, 2026",
  clientName: "Juan Dela Cruz",
  companyName: "Sample Company Inc.",
  clientEmail: "juan.delacruz@sample.com",
  clientAddress: "123 Sample Street, Manila, Philippines",
  contractType: "Long Term Variable Rate",
  contractDuration: "12 months",
  serviceLatitude: "14.5995",
  serviceLongitude: "120.9842",
  collectionSchedule: "Weekly",
  collectionScheduleOther: "",
  wasteAllowance: "500 kg/month",
  ratePerKg: "PHP 3.50/kg",
  specialClauses: "Regular waste collection every Monday and Thursday. Additional charges apply for hazardous materials.",
  clientRequests: "Provide separate bins for recyclable materials",
  signatories: [
    { name: "Maria Santos", position: "Company Representative" },
    { name: "Jose Reyes", position: "Service Provider" },
  ],
};

// Isolate HTML styles to prevent them from affecting the page
const isolateHTMLStyles = (htmlContent) => {
  if (!htmlContent) return "";

  const scopeId = "contract-template-preview-scope";
  let processed = htmlContent;

  // Extract styles from head first (before removing head)
  let extractedStyles = "";
  const headMatch = processed.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    const headContent = headMatch[1];
    const styleMatches = headContent.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
    if (styleMatches) {
      extractedStyles = styleMatches.join("\n");
    }
  }

  // Remove entire head section
  processed = processed.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");

  // Extract body content if it's a full HTML document
  const bodyMatch = processed.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    processed = bodyMatch[1];
  }

  // Combine extracted styles with any styles in body
  const allStyles = extractedStyles + "\n" + processed;

  // Process style tags to scope them
  const scopedContent = allStyles.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (match, attrs, styles) => {
    let scopedStyles = styles
      .replace(/\*\s*\{/g, `#${scopeId} *{`)
      .replace(/html\s*\{/g, `#${scopeId}{`)
      .replace(/body\s*\{/g, `#${scopeId}{`)
      .replace(/(^|\n|\r)([a-zA-Z0-9_\-.#\[\]:\s,>+~]+)\s*\{/g, (m, prefix, selector) => {
        const trimmed = selector.trim();
        if (trimmed.startsWith("@")) return m;
        if (trimmed.includes(`#${scopeId}`)) return m;
        return `${prefix}#${scopeId} ${trimmed}{`;
      });

    return `<style${attrs}>${scopedStyles}</style>`;
  });

  // Get body content without styles
  const bodyContent = processed.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  return `<div id="${scopeId}">${scopedContent}${bodyContent}</div>`;
};

export function ContractTemplatePreviewDialog({ open, onOpenChange, template }) {
  const [previewHtml, setPreviewHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generatePreview = () => {
      const content = template?.htmlTemplate;
      if (!content || !open) {
        setPreviewHtml("");
        return;
      }

      setIsLoading(true);
      try {
        // Replace simple placeholders with sample data
        let rendered = content;
        Object.keys(SAMPLE_CONTRACT_DATA).forEach((key) => {
          const value = SAMPLE_CONTRACT_DATA[key];
          if (typeof value === "string" || typeof value === "number") {
            rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
          }
        });

        // Handle {{#each signatories}} block
        const eachMatch = rendered.match(/\{\{#each signatories\}\}([\s\S]*?)\{\{\/each\}\}/);
        if (eachMatch) {
          const itemTemplate = eachMatch[1];
          const items = SAMPLE_CONTRACT_DATA.signatories.map((sig) => {
            let item = itemTemplate;
            item = item.replace(/\{\{this\.name\}\}/g, sig.name);
            item = item.replace(/\{\{this\.position\}\}/g, sig.position);
            item = item.replace(/\{\{name\}\}/g, sig.name);
            item = item.replace(/\{\{position\}\}/g, sig.position);
            return item;
          }).join("");
          rendered = rendered.replace(eachMatch[0], items);
        }

        // Remove any remaining Handlebars syntax
        rendered = rendered.replace(/\{\{[^{}]*\}\}/g, "");

        // Isolate styles
        rendered = isolateHTMLStyles(rendered);

        setPreviewHtml(rendered);
      } catch (error) {
        console.error("Error generating preview:", error);
        setPreviewHtml(isolateHTMLStyles(content));
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();
  }, [template, open]);

  useEffect(() => {
    if (!open) {
      setPreviewHtml("");
    }
  }, [open]);

  if (!template) return null;

  const templateName = template?.name || "Contract Template";
  const templateType = template?.templateType || "General";
  const templateDescription = template?.description || "";
  const createdAt = template?.createdAt ? new Date(template.createdAt).toLocaleDateString() : null;

  const CONTRACT_TYPE_LABELS = {
    long_term_variable: "Long Term Variable Rate",
    long_term_fixed: "Long Term Fixed Rate",
    fixed_rate_term: "Fixed Rate Term",
    garbage_bins: "Garbage Bins",
    garbage_bins_disposal: "Garbage Bins with Disposal",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl! w-[90vw]! max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 pr-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#106934]/10 rounded-lg shrink-0">
              <Eye className="h-5 w-5 text-[#106934]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <DialogTitle className="text-xl">{templateName}</DialogTitle>
                {template.isDefault && (
                  <Badge className="bg-green-600">Default</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Template Preview with Sample Data
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Template Info */}
        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-gray-200 bg-gray-50/50 px-1 -mx-1">
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Type:</span>
            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
              {CONTRACT_TYPE_LABELS[templateType] || templateType}
            </code>
          </div>
          {createdAt && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Created:</span>
              <span className="text-gray-900">{createdAt}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {templateDescription && (
          <div className="shrink-0 text-sm text-gray-600 py-2">
            <span className="font-medium text-gray-700">Description: </span>
            {templateDescription}
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-t-lg">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#106934]" />
              <span className="text-sm font-medium text-gray-700">Template Preview</span>
              <span className="text-xs text-gray-400">(with sample data)</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto border border-t-0 border-gray-200 rounded-b-lg bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#106934]" />
                  <span className="text-sm text-gray-500">Generating preview...</span>
                </div>
              </div>
            ) : previewHtml ? (
              <div
                className="p-6 prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-600"
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  maxWidth: "100%",
                  isolation: "isolate",
                  position: "relative",
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtmlWithStyles(previewHtml) }}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No preview available</p>
                  <p className="text-xs mt-1">This template has no content</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
