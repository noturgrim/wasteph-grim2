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
import { api } from "../../services/api";

export function TemplatePreviewDialog({ open, onOpenChange, template, htmlContent }) {
  const [previewHtml, setPreviewHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Generate preview when modal opens — server-side Handlebars via /render endpoint
  useEffect(() => {
    const generatePreview = async () => {
      const content = htmlContent || template?.htmlTemplate || template?.html_content;
      if (!content || !open) {
        setPreviewHtml("");
        return;
      }

      setIsLoading(true);
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
          companyName: "WASTE • PH",
          companyTagline: "PRIVATE WASTE MANAGEMENT",
          companyAddress: "UNIT 503, THE MERIDIAN CONDOMINIUM, GOLAM DR., KASAMBAGAN, CEBU CITY",
          services: [
            { name: "Waste Collection Service", quantity: 1, unitPrice: 5000, subtotal: 5000 },
            { name: "Disposal Service", quantity: 1, unitPrice: 3000, subtotal: 3000 },
          ],
          pricing: {
            subtotal: 8000,
            tax: 960,
            discount: 0,
            total: 8960,
            taxRate: 12,
            monthlyRate: 5000,
            wasteAllowance: 1000,
            excessRate: 4,
          },
          terms: "Standard terms and conditions apply.",
          wasteAllowance: 1000,
          excessRate: 4,
        };

        const response = await api.renderProposalTemplate(content, sampleData);
        if (response.success && response.data?.html) {
          setPreviewHtml(response.data.html);
        }
      } catch (error) {
        console.error("Error generating preview:", error);
        setPreviewHtml("");
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();
  }, [template, htmlContent, open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPreviewHtml("");
    }
  }, [open]);

  if (!template && !htmlContent) return null;

  const templateName = template?.name || "Template Preview";
  const templateKey = template?.template_key || template?.serviceType || "N/A";
  const templateDescription = template?.description || "";
  const isActive = template?.is_active !== undefined ? template.is_active : true;
  const createdAt = template?.created_at ? new Date(template.created_at).toLocaleDateString() : null;
  const linkedServices = template?.service_types || template?.permit_types || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl !w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 pr-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#106934]/10 rounded-lg shrink-0">
              <Eye className="h-5 w-5 text-[#106934]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <DialogTitle className="text-xl">{templateName}</DialogTitle>
                {template && (
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className={isActive ? "bg-green-600" : ""}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Template Preview with Sample Data
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Template Info */}
        {template && (
          <>
            <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-gray-200 bg-gray-50/50 px-1 -mx-1">
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Key:</span>
                <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                  {templateKey}
                </code>
              </div>
              {createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">{createdAt}</span>
                </div>
              )}
              {linkedServices.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Services:</span>
                  <span className="text-gray-900">{linkedServices.length} linked</span>
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
          </>
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
          <div className="flex-1 overflow-hidden border border-t-0 border-gray-200 rounded-b-lg bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#106934]" />
                  <span className="text-sm text-gray-500">Generating preview...</span>
                </div>
              </div>
            ) : previewHtml ? (
              <iframe
                srcdoc={previewHtml}
                title="Template Preview"
                sandbox="allow-same-origin"
                className="w-full h-full border-0"
                style={{ minHeight: "400px" }}
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
          <Button variant="outline" onClick={onOpenChange}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
