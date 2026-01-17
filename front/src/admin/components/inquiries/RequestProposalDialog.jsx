import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Edit3, Loader2, Sparkles, Send, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { api } from "../../services/api";
import { toast } from "sonner";
import TiptapEditor from "@/components/common/TiptapEditor";

// Service Type Options
const SERVICE_TYPE_OPTIONS = [
  { value: "waste_collection", label: "Waste Collection (Compactor Hauling)", icon: "🚛" },
  { value: "hazardous", label: "Hazardous Waste Collection", icon: "☢️" },
  { value: "fixed_monthly", label: "Fixed Monthly Rate", icon: "📅" },
  { value: "clearing", label: "Clearing Project", icon: "🏗️" },
  { value: "one_time", label: "One Time Hauling", icon: "🚚" },
  { value: "long_term", label: "Long Term Garbage (Per-kg)", icon: "⚖️" },
  { value: "recyclables", label: "Purchase of Recyclables", icon: "♻️" },
];

// Service Type to Template Type Mapping
const SERVICE_TO_TEMPLATE_MAP = {
  waste_collection: "compactor_hauling",
  hazardous: "hazardous_waste",
  fixed_monthly: "fixed_monthly",
  clearing: "clearing_project",
  one_time: "one_time_hauling",
  long_term: "long_term",
  recyclables: "recyclables_purchase",
};

export function RequestProposalDialog({ open, onOpenChange, inquiry, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEditor, setIsLoadingEditor] = useState(false);
  const [template, setTemplate] = useState(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState("");

  // Editor content state - track saved vs current
  const [editorInitialContent, setEditorInitialContent] = useState("");
  const [savedEditorContent, setSavedEditorContent] = useState({ html: "", json: null });
  const [hasUnsavedEditorChanges, setHasUnsavedEditorChanges] = useState(false);

  // Client info form state
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompany: "",
    clientPosition: "",
    clientAddress: "",
    proposalDate: new Date().toISOString().split("T")[0],
    validityDays: 30,
    notes: "",
  });

  // Pre-populate from inquiry and load existing proposal data if revising
  useEffect(() => {
    const initialize = async () => {
      if (!open) return;

      // Check if this is a revision of a rejected proposal
      const isRevision = inquiry?.proposalId && inquiry?.proposalStatus === "rejected";

      if (isRevision) {
        // Load existing proposal data for editing
        try {
          const response = await api.getProposalById(inquiry.proposalId);
          const proposal = response.data || response;
          const existingData = typeof proposal.proposalData === "string"
            ? JSON.parse(proposal.proposalData)
            : proposal.proposalData;

          // Pre-populate form with existing proposal data
          setFormData({
            clientName: existingData.clientName || inquiry.name || "",
            clientEmail: existingData.clientEmail || inquiry.email || "",
            clientPhone: existingData.clientPhone || inquiry.phone || "",
            clientCompany: existingData.clientCompany || inquiry.company || "",
            clientPosition: existingData.clientPosition || inquiry.position || "",
            clientAddress: existingData.clientAddress || inquiry.location || "",
            proposalDate: existingData.proposalDate || new Date().toISOString().split("T")[0],
            validityDays: existingData.validityDays || 30,
            notes: existingData.notes || "",
          });

          // Set service type
          const serviceType = existingData.serviceType || inquiry.serviceType;
          if (serviceType) {
            setSelectedServiceType(serviceType);
            await loadTemplateForServiceType(serviceType);
          }

          // If we have edited content, load directly into editor (skip to step 3)
          if (existingData.editedHtmlContent) {
            setEditorInitialContent(existingData.editedHtmlContent);
            setSavedEditorContent({
              html: existingData.editedHtmlContent,
              json: existingData.editedJsonContent || null,
            });
            setHasUnsavedEditorChanges(false);
            // Go directly to editor step
            setCurrentStep(3);
          }
        } catch (error) {
          console.error("Failed to load existing proposal:", error);
          // Fall back to normal flow
          if (inquiry) {
            setFormData({
              clientName: inquiry.name || "",
              clientEmail: inquiry.email || "",
              clientPhone: inquiry.phone || "",
              clientCompany: inquiry.company || "",
              clientPosition: inquiry.position || "",
              clientAddress: inquiry.location || "",
              proposalDate: new Date().toISOString().split("T")[0],
              validityDays: 30,
              notes: "",
            });
          }
        }
      } else {
        // Normal new proposal flow - pre-populate from inquiry
        if (inquiry) {
          setFormData({
            clientName: inquiry.name || "",
            clientEmail: inquiry.email || "",
            clientPhone: inquiry.phone || "",
            clientCompany: inquiry.company || "",
            clientPosition: inquiry.position || "",
            clientAddress: inquiry.location || "",
            proposalDate: new Date().toISOString().split("T")[0],
            validityDays: 30,
            notes: "",
          });

          // Pre-select service type if available from inquiry
          if (inquiry.serviceType) {
            setSelectedServiceType(inquiry.serviceType);
            await loadTemplateForServiceType(inquiry.serviceType);
          }
        }
      }
    };

    initialize();
  }, [open, inquiry]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setEditorInitialContent("");
      setSavedEditorContent({ html: "", json: null });
      setHasUnsavedEditorChanges(false);
    }
  }, [open]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Load template based on selected service type
  const loadTemplateForServiceType = async (serviceType) => {
    if (!serviceType) return;

    setIsLoadingTemplate(true);
    try {
      const templateType = SERVICE_TO_TEMPLATE_MAP[serviceType];
      if (!templateType) {
        toast.error("Invalid service type selected");
        return;
      }

      // Fetch template by type
      const response = await api.getTemplateByType(templateType);
      const fetchedTemplate = response.data || response;
      setTemplate(fetchedTemplate);
    } catch (error) {
      console.error("Failed to load template for service type:", error);
      toast.error("Could not load template for this service type");

      // Fallback to default template
      try {
        const response = await api.getDefaultProposalTemplate();
        const defaultTemplate = response.data || response;
        setTemplate(defaultTemplate);
      } catch (fallbackError) {
        console.error("Failed to load default template:", fallbackError);
      }
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // Handle service type selection
  const handleServiceTypeChange = async (serviceType) => {
    setSelectedServiceType(serviceType);
    await loadTemplateForServiceType(serviceType);
  };

  // Render template with client data and load into editor
  const prepareEditorContent = async () => {
    if (!template?.htmlTemplate) {
      toast.error("Template not loaded");
      return;
    }

    setIsLoadingEditor(true);
    try {
      // Calculate validity date
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + (parseInt(formData.validityDays) || 30));

      // Prepare data for template
      const templateData = {
        clientName: formData.clientName || "Client Name",
        clientEmail: formData.clientEmail || "",
        clientPhone: formData.clientPhone || "",
        clientCompany: formData.clientCompany || "",
        clientPosition: formData.clientPosition || "",
        clientAddress: formData.clientAddress || "",
        proposalDate: new Date(formData.proposalDate).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        validUntilDate: validUntilDate.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };

      let rendered = template.htmlTemplate;

      // Handle {{#if fieldName}} ... {{/if}} conditionals
      Object.keys(templateData).forEach((key) => {
        const ifRegex = new RegExp(`\\{\\{#if ${key}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`, "g");
        if (templateData[key]) {
          rendered = rendered.replace(ifRegex, "$1");
        } else {
          rendered = rendered.replace(ifRegex, "");
        }
      });

      // Replace simple {{fieldName}} placeholders
      Object.keys(templateData).forEach((key) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        rendered = rendered.replace(regex, templateData[key] || "");
      });

      // Handle {{#each services}} blocks - remove for now
      rendered = rendered.replace(/\{\{#each\s+[\w.]+\}\}[\s\S]*?\{\{\/each\}\}/g, "");

      // Strip any remaining Handlebars syntax
      rendered = rendered.replace(/\{\{[^{}]*\}\}/g, "");

      setEditorInitialContent(rendered);
      setSavedEditorContent({ html: rendered, json: null });
      setHasUnsavedEditorChanges(false);
      setCurrentStep(3);
    } catch (error) {
      console.error("Failed to prepare editor content:", error);
      toast.error("Failed to load editor");
    } finally {
      setIsLoadingEditor(false);
    }
  };

  // Handle editor save callback
  const handleEditorSave = ({ html, json }) => {
    setSavedEditorContent({ html, json });
    setHasUnsavedEditorChanges(false);
    toast.success("Changes saved");
  };

  // Handle unsaved changes notification from editor
  const handleUnsavedChange = (hasChanges) => {
    setHasUnsavedEditorChanges(hasChanges);
  };

  // Handle submit
  const handleSubmit = async () => {
    // Check if there are unsaved changes
    if (hasUnsavedEditorChanges) {
      toast.error("Please save your changes before submitting");
      return;
    }

    if (!savedEditorContent.html) {
      toast.error("No proposal content to submit");
      return;
    }

    setIsSubmitting(true);
    try {
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + (parseInt(formData.validityDays) || 30));

      // Prepare proposal data with structured format + edited HTML
      const proposalData = {
        // Client info
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        clientCompany: formData.clientCompany,
        clientPosition: formData.clientPosition,
        clientAddress: formData.clientAddress,

        // Proposal metadata
        proposalDate: formData.proposalDate,
        validityDays: parseInt(formData.validityDays) || 30,
        serviceType: selectedServiceType,
        notes: formData.notes || "",

        // The actual proposal content (edited HTML and JSON for re-editing)
        editedHtmlContent: savedEditorContent.html,
        editedJsonContent: savedEditorContent.json,
      };

      // Check if revising a rejected proposal
      const isRevision = inquiry?.proposalId && inquiry?.proposalStatus === "rejected";

      if (isRevision) {
        await api.updateProposal(inquiry.proposalId, {
          proposalData,
          templateId: template?.id,
        });
        toast.success("Proposal request revised and resubmitted");
      } else {
        await api.createProposal({
          inquiryId: inquiry.id,
          templateId: template?.id,
          proposalData,
        });
        toast.success("Proposal request submitted for approval");
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit proposal request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.clientName && formData.clientCompany;
  const canSubmit = savedEditorContent.html && !hasUnsavedEditorChanges && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[1000px]! max-w-[95vw]! h-[90vh]! max-h-[90vh]! flex flex-col p-0 gap-0">
        {/* Two Column Layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar - Progress Steps */}
          <div className="w-[280px] shrink-0 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col">
            {/* Header in Sidebar */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {inquiry?.proposalStatus === "rejected" ? "Revise Proposal" : "Create Proposal"}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                For {inquiry?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {inquiry?.email}
              </p>
            </div>

            {/* Step Indicator - Vertical */}
            <div className="flex flex-col gap-3 flex-1">
              {/* Step 1 */}
              <div className="relative">
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    currentStep === 1
                      ? "bg-[#15803d] text-white shadow-md"
                      : currentStep > 1
                      ? "bg-white/60 dark:bg-gray-800/60 text-green-700 dark:text-green-400"
                      : "bg-white/40 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      currentStep === 1
                        ? "bg-white/20 text-white"
                        : currentStep > 1
                        ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                    }`}
                  >
                    {currentStep > 1 ? "✓" : "1"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">Service Type</p>
                    <p className={`text-xs mt-0.5 leading-tight ${
                      currentStep === 1 ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      Select service category
                    </p>
                  </div>
                </div>
                {/* Connector Line */}
                <div
                  className={`absolute left-[27px] top-[52px] w-0.5 h-3 ${
                    currentStep > 1 ? "bg-green-400 dark:bg-green-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    currentStep === 2
                      ? "bg-[#15803d] text-white shadow-md"
                      : currentStep > 2
                      ? "bg-white/60 dark:bg-gray-800/60 text-green-700 dark:text-green-400"
                      : "bg-white/40 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      currentStep === 2
                        ? "bg-white/20 text-white"
                        : currentStep > 2
                        ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                    }`}
                  >
                    {currentStep > 2 ? "✓" : "2"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">Client Info</p>
                    <p className={`text-xs mt-0.5 leading-tight ${
                      currentStep === 2 ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      Enter client details
                    </p>
                  </div>
                </div>
                {/* Connector Line */}
                <div
                  className={`absolute left-[27px] top-[52px] w-0.5 h-3 ${
                    currentStep > 2 ? "bg-green-400 dark:bg-green-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              </div>

              {/* Step 3 */}
              <div>
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    currentStep === 3
                      ? "bg-[#15803d] text-white shadow-md"
                      : "bg-white/40 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      currentStep === 3
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                    }`}
                  >
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">Edit & Submit</p>
                    <p className={`text-xs mt-0.5 leading-tight ${
                      currentStep === 3 ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      Customize proposal
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Help Text at Bottom */}
            <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Need help? Contact support at support@wasteph.com
              </p>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Content */}
            <div className={`flex-1 px-8 py-6 min-h-0 ${currentStep === 3 ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
          {/* Rejection Banner */}
          {inquiry?.proposalStatus === "rejected" && inquiry?.proposalRejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-700">{inquiry.proposalRejectionReason}</p>
            </div>
          )}

          {currentStep === 1 ? (
            /* STEP 1: Service Type Selection */
            <div className="space-y-6">
              {/* Step Title */}
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Service Type</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Choose the type of service for this proposal
                </p>
              </div>

              <div className="space-y-2 max-w-xl">
                <Label htmlFor="serviceType" className="text-sm font-semibold">
                  Service Type <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  The appropriate template will be automatically selected based on your choice.
                </p>
                <Select value={selectedServiceType} onValueChange={handleServiceTypeChange}>
                  <SelectTrigger id="serviceType" className="w-full h-12 text-base">
                    <SelectValue placeholder="Select a service type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{option.icon}</span>
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template Auto-Selected Indicator */}
              {selectedServiceType && template && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Template Auto-Selected
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        <span className="font-semibold">{template.name}</span> will be used for this proposal
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingTemplate && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#106934]" />
                  <span className="ml-3 text-gray-600">Loading template...</span>
                </div>
              )}
            </div>
          ) : currentStep === 2 ? (
            /* STEP 2: Client Information Form */
            <div className="space-y-6">
              {/* Step Title */}
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Client Information</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enter the client details for this proposal
                </p>
              </div>

              {isLoadingTemplate ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#106934]" />
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">
                        Client Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => handleInputChange("clientName", e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientPosition">Position/Title</Label>
                      <Input
                        id="clientPosition"
                        value={formData.clientPosition}
                        onChange={(e) => handleInputChange("clientPosition", e.target.value)}
                        placeholder="Operations Manager"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientCompany">
                        Company <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="clientCompany"
                        value={formData.clientCompany}
                        onChange={(e) => handleInputChange("clientCompany", e.target.value)}
                        placeholder="ABC Corporation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail">Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => handleInputChange("clientEmail", e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientPhone">Phone</Label>
                      <Input
                        id="clientPhone"
                        value={formData.clientPhone}
                        onChange={(e) => handleInputChange("clientPhone", e.target.value)}
                        placeholder="+63 912 345 6789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proposalDate">Proposal Date</Label>
                      <DatePicker
                        date={formData.proposalDate ? new Date(formData.proposalDate) : undefined}
                        onDateChange={(date) => 
                          handleInputChange("proposalDate", date ? format(date, "yyyy-MM-dd") : "")
                        }
                        placeholder="Select proposal date"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientAddress">Address</Label>
                    <Input
                      id="clientAddress"
                      value={formData.clientAddress}
                      onChange={(e) => handleInputChange("clientAddress", e.target.value)}
                      placeholder="123 Business St, Metro Manila"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validityDays">Proposal Valid For (Days)</Label>
                    <Input
                      id="validityDays"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.validityDays}
                      onChange={(e) => handleInputChange("validityDays", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Any additional notes for this proposal..."
                      rows={3}
                    />
                  </div>

                  {/* Template Info */}
                  {template && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Using template: </span>
                      <span className="font-medium text-gray-900 dark:text-white">{template.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* STEP 3: Edit & Submit */
            <div className="flex flex-col h-full min-h-0">
              {/* Step Title */}
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700 shrink-0 mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit & Submit Proposal</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Customize the proposal content and submit for approval
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm shrink-0 mb-3">
                <div className="flex items-start gap-2">
                  <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-blue-800 dark:text-blue-100 font-medium">
                      Edit your proposal content below
                    </p>
                    <p className="text-blue-600 dark:text-blue-300 mt-1">
                      Use the toolbar to format text. Click "Save Changes" before submitting.
                    </p>
                  </div>
                </div>
              </div>

              {/* Unsaved Changes Warning - uses visibility to prevent layout shift */}
              <div
                className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm shrink-0 mb-3 transition-all duration-200 ${
                  hasUnsavedEditorChanges ? 'visible opacity-100' : 'invisible opacity-0 h-0 mb-0 p-0 border-0'
                }`}
              >
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>You have unsaved changes. Save before submitting.</span>
                </div>
              </div>

              {/* Editor */}
              {isLoadingEditor ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading editor...</span>
                </div>
              ) : (
                <div className="flex-1 min-h-0">
                  <TiptapEditor
                    content={editorInitialContent}
                    onChange={handleEditorSave}
                    onUnsavedChange={handleUnsavedChange}
                    className="h-full"
                  />
                </div>
              )}
            </div>
          )}
            </div>

            {/* Footer - Inside Right Content Area */}
            <div className="px-8 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between gap-3">
                {currentStep === 1 ? (
                  <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(2)}
                      disabled={!selectedServiceType || isLoadingTemplate}
                      className="min-w-[120px]"
                    >
                      {isLoadingTemplate ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      Next Step
                    </Button>
                  </>
                ) : currentStep === 2 ? (
                  <>
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={prepareEditorContent}
                      disabled={!isFormValid || isLoadingEditor || isLoadingTemplate}
                      className="min-w-[140px]"
                    >
                      {isLoadingEditor ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Edit3 className="h-4 w-4 mr-2" />
                      )}
                      Edit Proposal
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setCurrentStep(2)} disabled={isSubmitting}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className={`min-w-[140px] ${!canSubmit ? "opacity-50" : ""}`}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Submit Request
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
