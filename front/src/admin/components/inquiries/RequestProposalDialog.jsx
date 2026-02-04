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
  ArrowLeft,
  ArrowRight,
  Edit3,
  Loader2,
  Sparkles,
  Send,
  AlertCircle,
  Skull,
  Calendar,
  Building2,
  PackageCheck,
  Scale,
  Recycle,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";
import ProposalHtmlEditor from "@/components/common/ProposalHtmlEditor";

export function RequestProposalDialog({
  open,
  onOpenChange,
  inquiry,
  onSuccess,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEditor, setIsLoadingEditor] = useState(false);
  const [template, setTemplate] = useState(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedServiceName, setSelectedServiceName] = useState("");

  // Editor content state - track saved vs current
  const [editorInitialContent, setEditorInitialContent] = useState("");
  const [savedEditorContent, setSavedEditorContent] = useState({
    html: "",
    json: null,
  });
  const [hasUnsavedEditorChanges, setHasUnsavedEditorChanges] = useState(false);

  // Store template structure (head + styles) separately
  const templateStructureRef = useRef({ head: "", bodyTag: "", styles: "" });

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

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompany: "",
    clientAddress: "",
    proposalDate: "",
  });

  // Load services and pre-populate from inquiry
  useEffect(() => {
    const initialize = async () => {
      if (!open) return;

      // Load services from database
      try {
        const response = await api.getServices();
        setServices(response.data || []);
      } catch (error) {
        console.error("Failed to load services:", error);
      }

      // Check if this is a revision of a disapproved proposal
      const isRevision =
        inquiry?.proposalId && inquiry?.proposalStatus === "disapproved";

      if (isRevision) {
        // Load existing proposal data for editing
        try {
          const response = await api.getProposalById(inquiry.proposalId);
          const proposal = response.data || response;
          const existingData =
            typeof proposal.proposalData === "string"
              ? JSON.parse(proposal.proposalData)
              : proposal.proposalData;

          // Pre-populate form with existing proposal data
          setFormData({
            clientName: existingData.clientName || inquiry.name || "",
            clientEmail: existingData.clientEmail || inquiry.email || "",
            clientPhone: existingData.clientPhone || inquiry.phone || "",
            clientCompany: existingData.clientCompany || inquiry.company || "",
            clientPosition:
              existingData.clientPosition || inquiry.position || "",
            clientAddress: existingData.clientAddress || inquiry.location || "",
            proposalDate:
              existingData.proposalDate ||
              new Date().toISOString().split("T")[0],
            notes: existingData.notes || "",
          });

          // Load template from inquiry's service
          if (inquiry.serviceId) {
            setSelectedServiceId(inquiry.serviceId);
            await loadTemplateFromService(inquiry.serviceId);
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
            notes: "",
          });

          // Pre-select service if available from inquiry
          if (inquiry.serviceId) {
            setSelectedServiceId(inquiry.serviceId);
            await loadTemplateFromService(inquiry.serviceId);
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

  const validateField = (field, value) => {
    let error = "";

    switch (field) {
      case "clientName":
        if (!value.trim()) {
          error = "Name is required";
        } else if (value.trim().length < 2) {
          error = "Name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s.'-]+$/.test(value)) {
          error =
            "Name can only contain letters, spaces, and basic punctuation";
        }
        break;

      case "clientEmail":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;

      case "clientPhone":
        if (!value.trim()) {
          error = "Phone number is required";
        } else if (!/^[\d\s+()-]+$/.test(value)) {
          error = "Phone number can only contain digits, spaces, +, -, ( )";
        } else if (value.replace(/[\s+()-]/g, "").length < 7) {
          error = "Phone number must have at least 7 digits";
        }
        break;

      case "clientCompany":
        if (!value.trim()) {
          error = "Company name is required";
        } else if (value.trim().length < 2) {
          error = "Company name must be at least 2 characters";
        }
        break;

      case "clientAddress":
        if (!value.trim()) {
          error = "Address is required";
        } else if (value.trim().length < 5) {
          error = "Address must be at least 5 characters";
        }
        break;

      case "proposalDate":
        if (!value) {
          error = "Proposal date is required";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleInputChange = (field, value) => {
    // Update form data
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate and update errors
    const error = validateField(field, value);
    setValidationErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Load template from service (using database relationship service -> template)
  const loadTemplateFromService = async (serviceId) => {
    if (!serviceId) {
      toast.error("No service selected for this inquiry");
      return;
    }

    setIsLoadingTemplate(true);
    try {
      // Fetch service with its linked template
      const response = await api.getServiceById(serviceId);
      const service = response.data || response;

      // Store service name for display
      setSelectedServiceName(service.name || "");

      if (service.template && service.template.id) {
        setTemplate(service.template);
        toast.success(`Loaded template: ${service.template.name}`);
      } else {
        // Service has no template linked
        toast.warning(`No template configured for ${service.name}`);
        setTemplate(null);
      }
    } catch (error) {
      console.error("Failed to load template from service:", error);
      toast.error("Could not load template for this service");
      setTemplate(null);
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // Handle service selection
  const handleServiceChange = async (serviceId) => {
    setSelectedServiceId(serviceId);
    await loadTemplateFromService(serviceId);
  };

  // Render template server-side and load into editor
  const prepareEditorContent = async () => {
    if (!template?.htmlTemplate) {
      toast.error("Template not loaded");
      return;
    }

    setIsLoadingEditor(true);
    try {
      const formattedDate = new Date(formData.proposalDate).toLocaleDateString(
        "en-PH",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      // Build data payload matching template placeholders.
      // services/pricing are empty at this stage — sales fills them in the editor.
      // The table structure (thead, styling) still renders; only the body rows are empty.
      const templateData = {
        clientName: formData.clientName || "Client Name",
        clientEmail: formData.clientEmail || "",
        clientPhone: formData.clientPhone || "",
        clientCompany: formData.clientCompany || "",
        clientPosition: formData.clientPosition || "",
        clientAddress: formData.clientAddress || "",
        proposalDate: formattedDate,
        validUntilDate: new Date(
          Date.now() + (formData.validityDays || 30) * 24 * 60 * 60 * 1000
        ).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),

        // Aliases for common template variations
        name: formData.clientName || "Client Name",
        email: formData.clientEmail || "",
        phone: formData.clientPhone || "",
        company: formData.clientCompany || "",
        position: formData.clientPosition || "",
        address: formData.clientAddress || "",
        date: formattedDate,

        // Structured data — empty so {{#each}} renders structure only
        services: [],
        pricing: { subtotal: 0, tax: 0, discount: 0, total: 0, taxRate: 12 },
        terms: {
          paymentTerms: "Net 30",
          validityDays: formData.validityDays || 30,
          notes: formData.notes || "",
        },
      };

      // Server-side Handlebars compilation — handles {{#each}}, {{#if}}, helpers like {{currency}}
      const response = await api.renderProposalTemplate(template.htmlTemplate, templateData);
      if (!response.success) {
        throw new Error("Template rendering failed");
      }
      const rendered = response.data.html;

      // Extract template structure (head with styles) for the contentEditable editor
      const headMatch = rendered.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      const bodyTagMatch = rendered.match(/<body[^>]*>/i);
      const bodyMatch = rendered.match(/<body[^>]*>([\s\S]*)<\/body>/i);

      if (headMatch && bodyMatch) {
        const styleMatch = headMatch[0].match(
          /<style[^>]*>([\s\S]*?)<\/style>/gi
        );
        const inlineStyles = styleMatch
          ? styleMatch.map((s) => s.replace(/<\/?style[^>]*>/gi, "")).join("\n")
          : "";

        templateStructureRef.current = {
          head: headMatch[0],
          bodyTag: bodyTagMatch ? bodyTagMatch[0] : "<body>",
          styles: inlineStyles,
        };

        setEditorInitialContent(bodyMatch[1]);
        setSavedEditorContent({ html: rendered, json: null });
      } else {
        // Fallback: no head/body structure, use as-is
        templateStructureRef.current = { head: "", bodyTag: "", styles: "" };
        setEditorInitialContent(rendered);
        setSavedEditorContent({ html: rendered, json: null });
      }

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
    // Reconstruct full HTML with template structure (head + styles)
    const { head, bodyTag } = templateStructureRef.current;

    let fullHtml = html;
    if (head && bodyTag) {
      // Build complete HTML document
      fullHtml = `<!DOCTYPE html>
<html>
${head}
${bodyTag}
  ${html}
</body>
</html>`;
    }

    setSavedEditorContent({ html: fullHtml, json });
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
        notes: formData.notes || "",

        // Terms
        terms: {
          validityDays: formData.validityDays,
        },

        // The actual proposal content (edited HTML and JSON for re-editing)
        editedHtmlContent: savedEditorContent.html,
        editedJsonContent: savedEditorContent.json,
      };

      // Check if revising a disapproved proposal
      const isRevision =
        inquiry?.proposalId && inquiry?.proposalStatus === "disapproved";

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

      // Update inquiry with selected service and any additional client info added during proposal creation
      if (inquiry.id) {
        try {
          const inquiryUpdateData = {};

          // Always update serviceId if selected
          if (selectedServiceId) {
            inquiryUpdateData.serviceId = selectedServiceId;
          }

          // Update client info fields if they were added/modified during proposal creation
          if (formData.clientName && formData.clientName !== inquiry.name) {
            inquiryUpdateData.name = formData.clientName;
          }
          if (formData.clientEmail && formData.clientEmail !== inquiry.email) {
            inquiryUpdateData.email = formData.clientEmail;
          }
          if (formData.clientPhone && formData.clientPhone !== inquiry.phone) {
            inquiryUpdateData.phone = formData.clientPhone;
          }
          if (
            formData.clientCompany &&
            formData.clientCompany !== inquiry.company
          ) {
            inquiryUpdateData.company = formData.clientCompany;
          }
          // Map clientAddress to location field in inquiry table
          if (
            formData.clientAddress &&
            formData.clientAddress !== inquiry.location
          ) {
            inquiryUpdateData.location = formData.clientAddress;
          }

          // Only make API call if there's data to update
          if (Object.keys(inquiryUpdateData).length > 0) {
            await api.updateInquiry(inquiry.id, inquiryUpdateData);
          }
        } catch (error) {
          console.error("Failed to update inquiry:", error);
          // Don't show error to user as the proposal was created successfully
        }
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

  const isFormValid =
    formData.clientName &&
    formData.clientEmail &&
    formData.clientPhone &&
    formData.clientCompany &&
    formData.clientAddress &&
    formData.proposalDate &&
    !validationErrors.clientName &&
    !validationErrors.clientEmail &&
    !validationErrors.clientPhone &&
    !validationErrors.clientCompany &&
    !validationErrors.clientAddress &&
    !validationErrors.proposalDate;
  const canSubmit =
    savedEditorContent.html && !hasUnsavedEditorChanges && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[1000px]! max-w-[95vw]! h-[90vh]! max-h-[90vh]! flex flex-col p-0 gap-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Two Column Layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar - Progress Steps */}
          <div className="w-[280px] shrink-0 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col">
            {/* Header in Sidebar */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {inquiry?.proposalStatus === "disapproved"
                  ? "Revise Proposal"
                  : "Create Proposal"}
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
                      : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      currentStep === 1
                        ? "bg-white/20 text-white"
                        : currentStep > 1
                        ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                        : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {currentStep > 1 ? "✓" : "1"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">
                      Service Type
                    </p>
                    <p
                      className={`text-xs mt-0.5 leading-tight ${
                        currentStep === 1
                          ? "text-white/80"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      Select service category
                    </p>
                  </div>
                </div>
                {/* Connector Line */}
                <div
                  className={`absolute left-[27px] top-[52px] w-0.5 h-3 ${
                    currentStep > 1
                      ? "bg-green-400 dark:bg-green-600"
                      : "bg-gray-300 dark:bg-gray-600"
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
                      : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      currentStep === 2
                        ? "bg-white/20 text-white"
                        : currentStep > 2
                        ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                        : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {currentStep > 2 ? "✓" : "2"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">
                      Client Info
                    </p>
                    <p
                      className={`text-xs mt-0.5 leading-tight ${
                        currentStep === 2
                          ? "text-white/80"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      Enter client details
                    </p>
                  </div>
                </div>
                {/* Connector Line */}
                <div
                  className={`absolute left-[27px] top-[52px] w-0.5 h-3 ${
                    currentStep > 2
                      ? "bg-green-400 dark:bg-green-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              </div>

              {/* Step 3 */}
              <div>
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    currentStep === 3
                      ? "bg-[#15803d] text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      currentStep === 3
                        ? "bg-white/20 text-white"
                        : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">
                      Edit & Submit
                    </p>
                    <p
                      className={`text-xs mt-0.5 leading-tight ${
                        currentStep === 3
                          ? "text-white/80"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
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
            <div
              className={`flex-1 px-8 py-6 min-h-0 ${
                currentStep === 3
                  ? "flex flex-col overflow-hidden"
                  : "overflow-y-auto"
              }`}
            >
              {/* Rejection Banner */}
              {inquiry?.proposalStatus === "disapproved" &&
                inquiry?.proposalRejectionReason && (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                      Rejection Reason:
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {inquiry.proposalRejectionReason}
                    </p>
                  </div>
                )}

              {currentStep === 1 ? (
                /* STEP 1: Service Type Selection */
                <div className="space-y-5">
                  {/* Step Title */}
                  <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Select Service Type
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Choose the service type for this inquiry's proposal
                    </p>
                  </div>

                  {/* Template Auto-Selected Indicator */}
                  {selectedServiceId && template && !isLoadingTemplate && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 max-w-3xl">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                        <div className="flex items-baseline gap-2">
                          <p className="text-xs font-medium text-green-900 dark:text-green-100">
                            Template Auto-Selected:
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            <span className="font-semibold">
                              {template.name}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Service Cards Grid */}
                  <div className="grid grid-cols-2 gap-4 max-w-3xl">
                    {services.map((service) => {
                      const isSelected = selectedServiceId === service.id;
                      // Map service names to icons
                      const iconMap = {
                        "Fixed Monthly Rate": Calendar,
                        "Hazardous Waste": Skull,
                        "Clearing Project": Building2,
                        "Long Term Garbage": Scale,
                        "One-time Hauling": PackageCheck,
                        "Purchase of Recyclables": Recycle,
                      };
                      const Icon = iconMap[service.name] || Building2;

                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => handleServiceChange(service.id)}
                          disabled={isLoadingTemplate}
                          className={`relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all text-center min-h-[140px] bg-white dark:bg-gray-800 ${
                            isSelected
                              ? "border-[#15803d]"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          } ${
                            isLoadingTemplate
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          {/* Checkbox Circle - Top Right Inside */}
                          <div className="absolute top-3 right-3">
                            {isSelected ? (
                              <div className="w-5 h-5 bg-[#15803d] rounded-full flex items-center justify-center">
                                <Check
                                  className="w-3 h-3 text-white"
                                  strokeWidth={3}
                                />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                            )}
                          </div>

                          {/* Icon */}
                          <div className="w-12 h-12 bg-white dark:bg-white border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center mb-3 text-gray-700 dark:text-gray-700 shadow-sm">
                            <Icon className="w-6 h-6" />
                          </div>

                          {/* Label */}
                          <h3
                            className={`font-semibold text-sm mb-1 ${
                              isSelected
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {service.name}
                          </h3>

                          {/* Subtitle */}
                          <p
                            className={`text-xs leading-relaxed ${
                              isSelected
                                ? "text-gray-600 dark:text-gray-400"
                                : "text-gray-500 dark:text-gray-500"
                            }`}
                          >
                            {service.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {isLoadingTemplate && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
                      <span className="ml-3 text-gray-600 dark:text-gray-400">
                        Loading template...
                      </span>
                    </div>
                  )}
                </div>
              ) : currentStep === 2 ? (
                /* STEP 2: Client Information Form */
                <div className="space-y-6">
                  {/* Step Title */}
                  <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Client Information
                    </h2>
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
                            onChange={(e) =>
                              handleInputChange("clientName", e.target.value)
                            }
                            placeholder="John Doe"
                            aria-invalid={!!validationErrors.clientName}
                          />
                          {validationErrors.clientName && (
                            <p className="text-xs text-red-500 mt-1">
                              {validationErrors.clientName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientPosition">Position/Title</Label>
                          <Input
                            id="clientPosition"
                            value={formData.clientPosition}
                            onChange={(e) =>
                              handleInputChange(
                                "clientPosition",
                                e.target.value
                              )
                            }
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
                            onChange={(e) =>
                              handleInputChange("clientCompany", e.target.value)
                            }
                            placeholder="ABC Corporation"
                            aria-invalid={!!validationErrors.clientCompany}
                          />
                          {validationErrors.clientCompany && (
                            <p className="text-xs text-red-500 mt-1">
                              {validationErrors.clientCompany}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientEmail">
                            Email <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="clientEmail"
                            type="email"
                            value={formData.clientEmail}
                            onChange={(e) =>
                              handleInputChange("clientEmail", e.target.value)
                            }
                            placeholder="john@example.com"
                            aria-invalid={!!validationErrors.clientEmail}
                          />
                          {validationErrors.clientEmail && (
                            <p className="text-xs text-red-500 mt-1">
                              {validationErrors.clientEmail}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="clientPhone">
                            Phone <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="clientPhone"
                            value={formData.clientPhone}
                            onChange={(e) =>
                              handleInputChange("clientPhone", e.target.value)
                            }
                            placeholder="+63 912 345 6789"
                            aria-invalid={!!validationErrors.clientPhone}
                          />
                          {validationErrors.clientPhone && (
                            <p className="text-xs text-red-500 mt-1">
                              {validationErrors.clientPhone}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proposalDate">
                            Proposal Date{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <DatePicker
                            date={
                              formData.proposalDate
                                ? new Date(formData.proposalDate)
                                : undefined
                            }
                            onDateChange={(date) =>
                              handleInputChange(
                                "proposalDate",
                                date ? format(date, "yyyy-MM-dd") : ""
                              )
                            }
                            placeholder="Select proposal date"
                          />
                          {validationErrors.proposalDate && (
                            <p className="text-xs text-red-500 mt-1">
                              {validationErrors.proposalDate}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="validityDays">
                            Proposal Validity (Days)
                          </Label>
                          <Input
                            id="validityDays"
                            type="number"
                            placeholder="Enter number of days"
                            value={formData.validityDays}
                            onChange={(e) =>
                              handleInputChange(
                                "validityDays",
                                e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : ""
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="clientAddress">
                          Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="clientAddress"
                          value={formData.clientAddress}
                          onChange={(e) =>
                            handleInputChange("clientAddress", e.target.value)
                          }
                          placeholder="123 Business St, Metro Manila"
                          aria-invalid={!!validationErrors.clientAddress}
                        />
                        {validationErrors.clientAddress && (
                          <p className="text-xs text-red-500 mt-1">
                            {validationErrors.clientAddress}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">
                          Additional Notes (Optional)
                        </Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) =>
                            handleInputChange("notes", e.target.value)
                          }
                          placeholder="Any additional notes for this proposal..."
                          rows={3}
                        />
                      </div>

                      {/* Service & Template Info */}
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                          <p className="text-xs font-medium text-green-900 dark:text-green-100">
                            Proposal Configuration
                          </p>
                        </div>
                        {selectedServiceName && (
                          <div className="text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">
                              Service:{" "}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedServiceName}
                            </span>
                          </div>
                        )}
                        {template && (
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Template:{" "}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {template.name}
                            </span>
                          </div>
                        )}
                        {!template && (
                          <div className="text-sm text-amber-700 dark:text-amber-400">
                            No template configured for this service
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* STEP 3: Edit & Submit */
                <div className="flex flex-col h-full min-h-0">
                  {/* Step Title */}
                  <div className="pb-4 border-b border-gray-200 dark:border-gray-700 shrink-0 mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Edit & Submit Proposal
                    </h2>
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
                          Use the toolbar to format text. Click "Save Changes"
                          before submitting.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Unsaved Changes Warning - uses visibility to prevent layout shift */}
                  <div
                    className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm shrink-0 mb-3 transition-all duration-200 ${
                      hasUnsavedEditorChanges
                        ? "visible opacity-100"
                        : "invisible opacity-0 h-0 mb-0 p-0 border-0"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        You have unsaved changes. Save before submitting.
                      </span>
                    </div>
                  </div>

                  {/* Editor */}
                  {isLoadingEditor ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
                      <span className="ml-3 text-gray-600 dark:text-gray-400">
                        Loading editor...
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0">
                      <ProposalHtmlEditor
                        content={editorInitialContent}
                        templateStyles={templateStructureRef.current.styles}
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
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(2)}
                      disabled={!selectedServiceId || isLoadingTemplate}
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
                      disabled={
                        !isFormValid || isLoadingEditor || isLoadingTemplate
                      }
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
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className={`min-w-[140px] ${
                        !canSubmit ? "opacity-50" : ""
                      }`}
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
