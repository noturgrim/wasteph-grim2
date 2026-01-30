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
import { Checkbox } from "@/components/ui/checkbox";
import { HTMLTemplateEditor } from "../templates/HTMLTemplateEditor";

// Default template HTML for new contract templates
const DEFAULT_CONTRACT_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Contract</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px 60px;
      background: #fff;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #2c5282;
      padding-bottom: 20px;
    }

    .header h1 {
      font-size: 28px;
      color: #2c5282;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .section {
      margin-bottom: 30px;
    }

    .section h3 {
      font-size: 16px;
      color: #2c5282;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
      text-transform: uppercase;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 14px;
      color: #1a202c;
      font-weight: 500;
    }

    .signatories {
      margin-top: 60px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }

    .signature-block {
      text-align: center;
    }

    .signature-line {
      border-top: 2px solid #2d3748;
      margin-bottom: 8px;
      padding-top: 50px;
    }

    .signature-name {
      font-size: 14px;
      font-weight: bold;
      color: #2d3748;
    }

    .signature-position {
      font-size: 12px;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Service Contract</h1>
    <p>Contract No: {{contractNumber}}</p>
    <p>Date: {{contractDate}}</p>
  </div>

  <div class="section">
    <h3>Client Information</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Company Name</span>
        <span class="info-value">{{companyName}}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Contact Person</span>
        <span class="info-value">{{clientName}}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>Service Details</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Contract Type</span>
        <span class="info-value">{{contractType}}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Collection Schedule</span>
        <span class="info-value">{{collectionSchedule}}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>Agreement Signatures</h3>
    <div class="signatories">
      {{#each signatories}}
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-name">{{this.name}}</div>
        <div class="signature-position">{{this.position}}</div>
      </div>
      {{/each}}
    </div>
  </div>
</body>
</html>`;

// Contract type options
const CONTRACT_TYPES = [
  { value: "long_term_variable", label: "Long Term Variable Rate" },
  { value: "long_term_fixed", label: "Long Term Fixed Rate" },
  { value: "fixed_rate_term", label: "Fixed Rate Term" },
  { value: "garbage_bins", label: "Garbage Bins" },
  { value: "garbage_bins_disposal", label: "Garbage Bins with Disposal" },
];

export function ContractTemplateEditorDialog({ open, onOpenChange, template, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    htmlTemplate: DEFAULT_CONTRACT_TEMPLATE_HTML,
    templateType: "",
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        description: template.description || "",
        htmlTemplate: template.htmlTemplate || DEFAULT_CONTRACT_TEMPLATE_HTML,
        templateType: template.templateType || "",
        isDefault: template.isDefault || false,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        htmlTemplate: DEFAULT_CONTRACT_TEMPLATE_HTML,
        templateType: "",
        isDefault: false,
      });
    }
  }, [template]);

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      alert("Please enter a template name");
      return;
    }

    if (!formData.htmlTemplate.trim()) {
      alert("Please enter template HTML");
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Contract Template" : "Create Contract Template"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "Update the contract template details"
              : "Create a new contract template for generating contracts"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Template Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Long Term Variable Rate Contract"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of when to use this template"
              rows={2}
            />
          </div>

          {/* Contract Type */}
          <div className="space-y-2">
            <Label htmlFor="templateType">Contract Type</Label>
            <Select
              value={formData.templateType}
              onValueChange={(value) => setFormData({ ...formData, templateType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contract type (optional)" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Leave blank for a general template
            </p>
          </div>

          {/* Set as Default */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Set as default template
            </Label>
          </div>

          {/* HTML Template Editor */}
          <div className="space-y-2">
            <Label>
              Template HTML <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Use Handlebars syntax for dynamic data: {'{{contractNumber}}, {{clientName}}, etc.'}
            </p>
            <HTMLTemplateEditor
              value={formData.htmlTemplate}
              onChange={(value) => setFormData({ ...formData, htmlTemplate: value })}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {template ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
