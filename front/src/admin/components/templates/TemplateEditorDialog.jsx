import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";
import { PDFViewer } from "../PDFViewer";
import { HTMLTemplateEditor } from "./HTMLTemplateEditor";
import { TemplatePreviewModal } from "./TemplatePreviewModal";

// Default template HTML for new templates - simple and clean
const DEFAULT_TEMPLATE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #22c55e;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #22c55e;
      margin-bottom: 5px;
    }
    .client-info {
      margin-bottom: 30px;
    }
    .client-info p {
      margin: 5px 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>BUSINESS PROPOSAL</h1>
    <p>Date: {{proposalDate}}</p>
  </div>

  <div class="client-info">
    <h3>Prepared For:</h3>
    <p><strong>{{clientName}}</strong></p>
    <p>{{clientPosition}}</p>
    <p>{{clientCompany}}</p>
    <p>{{clientAddress}}</p>
    <p>{{clientEmail}} | {{clientPhone}}</p>
  </div>

  <div class="content">
    <h3>Proposal Details</h3>
    <p>Enter your proposal content here...</p>
  </div>

  <div class="footer">
    <p>Valid until: {{validUntilDate}}</p>
    <p>Thank you for considering our services.</p>
  </div>
</body>
</html>`;

// Service type options - matches RequestProposalDialog
const SERVICE_TYPES = [
  { value: "waste_collection", label: "Waste Collection (Compactor Hauling)" },
  { value: "hazardous", label: "Hazardous Waste" },
  { value: "fixed_monthly", label: "Fixed Monthly Rate" },
  { value: "clearing", label: "Clearing Project" },
  { value: "one_time", label: "One Time Hauling" },
  { value: "long_term", label: "Long Term Garbage (Per-kg)" },
  { value: "recyclables", label: "Purchase of Recyclables" },
];

export function TemplateEditorDialog({ open, onOpenChange, template, onSave }) {
  const isEditMode = !!template;
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    serviceType: "fixed_monthly",
    htmlTemplate: DEFAULT_TEMPLATE_HTML,
    isDefault: false,
  });

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showHtmlPreviewModal, setShowHtmlPreviewModal] = useState(false);

  // Reset form when dialog opens/closes or template changes
  useEffect(() => {
    if (open) {
      if (isEditMode && template) {
        setFormData({
          name: template.name || "",
          description: template.description || "",
          serviceType: template.serviceType || "fixed_monthly",
          htmlTemplate: template.htmlTemplate || DEFAULT_TEMPLATE_HTML,
          isDefault: template.isDefault || false,
        });
      } else {
        setFormData({
          name: "",
          description: "",
          serviceType: "fixed_monthly",
          htmlTemplate: DEFAULT_TEMPLATE_HTML,
          isDefault: false,
        });
      }
      setPdfPreviewUrl("");
    }
  }, [open, template, isEditMode]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.name.trim()) {
      toast.error("Template name is required");
      return false;
    }

    if (!formData.htmlTemplate || !formData.htmlTemplate.trim()) {
      toast.error("Template content is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewTemplate = () => {
    // Show HTML preview modal instead of PDF viewer
    setShowHtmlPreviewModal(true);
  };

  return (
    <>
      <Dialog open={open && !showPdfViewer} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-7xl !w-[90vw] max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {isEditMode ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the proposal template details below"
                : "Create a new proposal template with placeholders for dynamic content"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4 min-h-0">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Template Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Fixed Monthly Rate Template"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="serviceType">
                Service Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => handleInputChange("serviceType", value)}
              >
                <SelectTrigger id="serviceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this template..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={2}
              />
            </div>

            {/* Default Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isDefault">Set as Default</Label>
                <p className="text-xs text-gray-500">
                  Default templates will be automatically selected for new proposals
                </p>
              </div>
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => handleInputChange("isDefault", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
            </div>

            {/* Template Content */}
            <div className="space-y-2">
              <Label>
                Template Content <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500">
                Write HTML directly with placeholders. Use the "Insert Placeholder" button to add dynamic fields.
              </p>
              <HTMLTemplateEditor
                content={formData.htmlTemplate}
                onChange={(html) => handleInputChange("htmlTemplate", html)}
                onFullPreview={handlePreviewTemplate}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-[#106934] hover:bg-[#0d5429] text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{isEditMode ? "Update Template" : "Create Template"}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* HTML Preview Modal */}
      <TemplatePreviewModal
        open={showHtmlPreviewModal}
        onClose={() => setShowHtmlPreviewModal(false)}
        template={{
          name: formData.name || "Template",
          template_key: formData.serviceType || "template",
          description: formData.description,
          htmlTemplate: formData.htmlTemplate,
          is_active: formData.isDefault,
        }}
        htmlContent={formData.htmlTemplate}
      />

      {/* Full-screen PDF Viewer for preview */}
      {showPdfViewer && (
        <PDFViewer
          fileUrl={isLoadingPdf ? "" : pdfPreviewUrl}
          fileName={`${formData.name || "Template"} - Preview.pdf`}
          title="Template Preview"
          onClose={() => setShowPdfViewer(false)}
          isOpen={showPdfViewer}
        />
      )}
    </>
  );
}
