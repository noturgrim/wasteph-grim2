import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
import { DatePicker } from "@/components/ui/date-picker";
import {
  ArrowLeft,
  ArrowRight,
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
  Eye,
  Upload,
  FileText,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";
import ProposalHtmlEditor from "@/components/common/ProposalHtmlEditor";
import { sanitizeHtmlWithStyles } from "@/utils/sanitize";

export function RequestProposalDialog({
  open,
  onOpenChange,
  inquiry,
  onSuccess,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingEditor, setIsLoadingEditor] = useState(false);
  const [template, setTemplate] = useState(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [subTypes, setSubTypes] = useState([]);
  const [selectedSubTypeId, setSelectedSubTypeId] = useState("");
  const [selectedSubTypeName, setSelectedSubTypeName] = useState("");
  const [isLoadingSubTypes, setIsLoadingSubTypes] = useState(false);

  // Upload fallback mode
  const [creationMode, setCreationMode] = useState("template"); // "template" | "upload"
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

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
    clientIndustry: "",
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
    clientIndustry: "",
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

          // If the original was an uploaded PDF, default to upload mode
          if (existingData.isUploadedPdf) {
            setCreationMode("upload");
          }

          // Load template from inquiry's service
          if (inquiry.serviceId) {
            setSelectedServiceId(inquiry.serviceId);
            await loadTemplateFromService(inquiry.serviceId);
          }

          // If we have edited content, check if we should use current template or saved HTML
          if (existingData.editedHtmlContent) {
            const savedHtml = existingData.editedHtmlContent;

            // Check if saved HTML uses old flexbox structure (needs re-rendering)
            const usesFlexbox = savedHtml.includes("display: flex");
            const hasContentWrapper = savedHtml.includes(
              '<div class="content">',
            );
            const hasTableHeader = savedHtml.includes("header-table");

            if (usesFlexbox || !hasContentWrapper || !hasTableHeader) {
              // Old template structure - re-render from current template instead

              // Extract just the editable content from saved HTML
              const bodyMatch = savedHtml.match(
                /<body[^>]*>([\s\S]*?)<\/body>/i,
              );
              if (bodyMatch) {
                let editableContent = "";
                try {
                  const container = document.createElement("div");
                  container.innerHTML = sanitizeHtmlWithStyles(bodyMatch[1]);

                  // Try to extract meaningful content (skip header/footer)
                  // Look for date, recipient, greeting sections
                  const dateDiv = container.querySelector(".date");
                  const recipientDiv = container.querySelector(".recipient");
                  const greetingDiv = container.querySelector(".greeting");
                  const introDiv = container.querySelector(".intro");

                  if (dateDiv && recipientDiv) {
                    // Extract from date onwards (all editable content)
                    const tempDiv = document.createElement("div");
                    let foundDate = false;
                    Array.from(container.children).forEach((child) => {
                      if (child.classList.contains("date")) foundDate = true;
                      if (foundDate && !child.classList.contains("header")) {
                        tempDiv.appendChild(child.cloneNode(true));
                      }
                    });
                    editableContent = tempDiv.innerHTML;
                  } else {
                    // Fallback: use all body content
                    editableContent = bodyMatch[1];
                  }
                } catch (e) {
                  editableContent = bodyMatch[1];
                }

                // Now render the CURRENT template with this content
                // We need to re-fetch the template and merge the saved content
                // For now, just proceed to step 2 to re-render
                // (User can click "Generate Proposal" to get fresh template)
                toast.info(
                  "This proposal uses an older template format. Please click 'Generate Proposal' to update it.",
                  { duration: 5000 },
                );
                setCurrentStep(2);
              }
            } else {
              // Current template structure - use saved HTML as-is
              // Extract head, body, and styles (same pattern as prepareEditorContent)
              const headMatch = savedHtml.match(
                /<head[^>]*>([\s\S]*?)<\/head>/i,
              );
              const bodyTagMatch = savedHtml.match(/<body[^>]*>/i);
              const bodyMatch = savedHtml.match(
                /<body[^>]*>([\s\S]*)<\/body>/i,
              );

              if (headMatch && bodyMatch) {
                const styleMatch = headMatch[0].match(
                  /<style[^>]*>([\s\S]*?)<\/style>/gi,
                );
                const inlineStyles = styleMatch
                  ? styleMatch
                      .map((s) => s.replace(/<\/?style[^>]*>/gi, ""))
                      .join("\n")
                  : "";

                const fullBodyHtml = bodyMatch[1] || "";

                // Try to find .content wrapper (editable section)
                let editorBodyContent = fullBodyHtml;
                try {
                  const container = document.createElement("div");
                  container.innerHTML = sanitizeHtmlWithStyles(fullBodyHtml);
                  const contentNode = container.querySelector(".content");
                  if (contentNode) {
                    editorBodyContent = contentNode.innerHTML || "";
                  }
                } catch {
                  // Fallback: use full body HTML
                  editorBodyContent = fullBodyHtml;
                }

                // Populate templateStructureRef so handleEditorSave can reconstruct
                templateStructureRef.current = {
                  head: headMatch[0],
                  bodyTag: bodyTagMatch ? bodyTagMatch[0] : "<body>",
                  styles: inlineStyles,
                  bodyHtml: fullBodyHtml,
                  contentSelector: ".content",
                };

                // Load extracted content into editor
                setEditorInitialContent(editorBodyContent);

                setSavedEditorContent({
                  html: savedHtml, // Keep original full HTML as saved
                  json: existingData.editedJsonContent || null,
                });
                setHasUnsavedEditorChanges(false);
                // Go directly to editor step
                setCurrentStep(3);
              } else {
                // No structure found, load as-is (may be legacy or corrupted)
                console.warn(
                  "No template structure found in editedHtmlContent, loading as-is",
                );
                setEditorInitialContent(savedHtml);
                templateStructureRef.current = {
                  head: "",
                  bodyTag: "",
                  styles: "",
                };

                setSavedEditorContent({
                  html: savedHtml,
                  json: existingData.editedJsonContent || null,
                });
                setHasUnsavedEditorChanges(false);
                setCurrentStep(3);
              }
            }
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
      setCreationMode("template");
      setUploadedPdf(null);
      setShowUploadModal(false);
      setEditorInitialContent("");
      setSavedEditorContent({ html: "", json: null });
      setHasUnsavedEditorChanges(false);
      setSubTypes([]);
      setSelectedSubTypeId("");
      setSelectedSubTypeName("");
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

      case "clientIndustry":
        if (!value) {
          error = "Industry is required";
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
        toast.warning(`No template available for ${service.name}`);
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

  // Handle service selection — load template + sub-types in parallel
  const handleServiceChange = async (serviceId) => {
    setSelectedServiceId(serviceId);
    setSelectedSubTypeId("");
    setSelectedSubTypeName("");
    setSubTypes([]);

    // Fetch template and sub-types in parallel
    setIsLoadingSubTypes(true);
    await Promise.all([
      loadTemplateFromService(serviceId),
      api
        .getServiceSubTypes(serviceId)
        .then((res) => setSubTypes(res.data || []))
        .catch(() => setSubTypes([])),
    ]);
    setIsLoadingSubTypes(false);
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
        },
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
          Date.now() + (formData.validityDays || 30) * 24 * 60 * 60 * 1000,
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
      const response = await api.renderProposalTemplate(
        template.htmlTemplate,
        templateData,
      );
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
          /<style[^>]*>([\s\S]*?)<\/style>/gi,
        );
        const inlineStyles = styleMatch
          ? styleMatch.map((s) => s.replace(/<\/?style[^>]*>/gi, "")).join("\n")
          : "";

        const fullBodyHtml = bodyMatch[1] || "";

        // Default editable content is full body, but if template uses a
        // conventional ".content" wrapper (as in DEFAULT_TEMPLATE_HTML),
        // only load that inner HTML into the editor so we can preserve
        // the surrounding layout structure (header, footer, etc.).
        let editorBodyContent = fullBodyHtml;
        try {
          const container = document.createElement("div");
          container.innerHTML = sanitizeHtmlWithStyles(fullBodyHtml);
          const contentNode = container.querySelector(".content");
          if (contentNode) {
            editorBodyContent = contentNode.innerHTML || "";
          }
        } catch {
          // Fallback: if DOM parsing fails for any reason, keep full body HTML
          editorBodyContent = fullBodyHtml;
        }

        templateStructureRef.current = {
          head: headMatch[0],
          bodyTag: bodyTagMatch ? bodyTagMatch[0] : "<body>",
          styles: inlineStyles,
          // Keep original body HTML so we can surgically replace just the
          // editable section when saving, instead of losing layout wrappers.
          bodyHtml: fullBodyHtml,
          contentSelector: ".content",
        };

        setEditorInitialContent(editorBodyContent);
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
    const { head, bodyTag, bodyHtml, contentSelector } =
      templateStructureRef.current;

    // By default, use the editor's HTML as the body content.
    // If we have the original body HTML and a known editable container
    // (".content"), surgically replace only that inner HTML so we preserve
    // the outer layout wrappers from the template.
    let bodyContentForSave = html;

    if (bodyHtml && contentSelector) {
      try {
        const container = document.createElement("div");
        container.innerHTML = sanitizeHtmlWithStyles(bodyHtml);
        const target = container.querySelector(contentSelector);

        if (target) {
          // Success: replace only the editable section
          target.innerHTML = sanitizeHtmlWithStyles(html);
          bodyContentForSave = container.innerHTML;
        } else {
          // Selector not found, use full body replacement
          bodyContentForSave = html;
        }
      } catch (error) {
        console.error("DOM parsing failed during surgical replacement:", error);
        bodyContentForSave = html;
      }
    } else {
      // No template structure available, use raw editor content
      bodyContentForSave = html;
    }

    let fullHtml = bodyContentForSave;
    if (head && bodyTag) {
      // Build complete HTML document
      fullHtml = `<!DOCTYPE html>
<html>
${head}
${bodyTag}
  ${bodyContentForSave}
</body>
</html>`;
    } else {
      console.warn("No template structure available - saving raw HTML");
    }

    // Validate that we have a complete HTML document
    const isCompleteHtml =
      fullHtml.includes("<!DOCTYPE") &&
      fullHtml.includes("<html") &&
      fullHtml.includes("<head") &&
      fullHtml.includes("<body");

    if (!isCompleteHtml) {
      console.error("Saved HTML is incomplete, missing document structure:", {
        hasDoctype: fullHtml.includes("<!DOCTYPE"),
        hasHtml: fullHtml.includes("<html"),
        hasHead: fullHtml.includes("<head"),
        hasBody: fullHtml.includes("<body"),
        htmlPreview: fullHtml.substring(0, 200),
      });

      // Attempt to wrap in minimal document structure
      if (!fullHtml.includes("<!DOCTYPE")) {
        const styles = templateStructureRef.current.styles || "";
        fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposal</title>
  ${styles ? `<style>${styles}</style>` : ""}
</head>
<body>
  ${html}
</body>
</html>`;
        console.warn("Wrapped incomplete HTML in minimal document structure");
      }
    }

    setSavedEditorContent({ html: fullHtml, json });
    setHasUnsavedEditorChanges(false);
    toast.success("Changes saved");
  };

  // Handle unsaved changes notification from editor
  const handleUnsavedChange = (hasChanges) => {
    setHasUnsavedEditorChanges(hasChanges);
  };

  // Generate PDF blob URL for preview
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const generatePdfPreview = async () => {
    if (!savedEditorContent.html) {
      toast.error("No content to preview. Please generate the proposal first.");
      return;
    }

    setIsLoadingPreview(true);
    try {
      // Call backend to generate PDF from HTML using api service (handles CSRF)
      const blob = await api.requestBlob("/proposals/preview-pdf", {
        method: "POST",
        body: JSON.stringify({ html: savedEditorContent.html }),
      });

      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
    } catch (error) {
      console.error("PDF preview error:", error);
      toast.error("Failed to generate PDF preview");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Cleanup PDF blob URL when component unmounts or preview closes
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  // Generate preview when dialog opens and cleanup on close
  useEffect(() => {
    if (showPreview && !pdfPreviewUrl && savedEditorContent.html) {
      generatePdfPreview();
    } else if (!showPreview && pdfPreviewUrl) {
      // Cleanup when closing
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPreview]);

  // Show confirmation before submitting
  const handleSubmitClick = () => {
    if (creationMode === "upload") {
      if (!uploadedPdf) {
        toast.error("Please upload a PDF file");
        return;
      }
      setShowSubmitConfirm(true);
      return;
    }
    if (hasUnsavedEditorChanges) {
      toast.error("Please save your changes before submitting");
      return;
    }
    if (!savedEditorContent.html) {
      toast.error("No proposal content to submit");
      return;
    }
    setShowSubmitConfirm(true);
  };

  // Actual submit after confirmation
  const handleSubmit = async () => {
    setShowSubmitConfirm(false);
    setIsSubmitting(true);
    try {
      if (creationMode === "upload") {
        // Upload PDF fallback flow
        const uploadFormData = new FormData();
        uploadFormData.append("proposalPdf", uploadedPdf);
        uploadFormData.append(
          "proposalData",
          JSON.stringify({
            inquiryId: inquiry.id,
            clientName: formData.clientName,
            clientEmail: formData.clientEmail,
            clientPhone: formData.clientPhone,
            clientCompany: formData.clientCompany,
            clientPosition: formData.clientPosition,
            clientAddress: formData.clientAddress,
            clientIndustry: formData.clientIndustry,
            proposalDate: formData.proposalDate,
            validityDays: formData.validityDays,
            notes: formData.notes || "",
          })
        );
        if (selectedSubTypeId) {
          uploadFormData.append("serviceSubTypeId", selectedSubTypeId);
        }

        await api.createProposalWithUpload(uploadFormData);
        toast.success("Proposal uploaded and submitted for approval");
      } else {
        // Template editor flow (existing)
        const proposalData = {
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          clientCompany: formData.clientCompany,
          clientPosition: formData.clientPosition,
          clientAddress: formData.clientAddress,
          clientIndustry: formData.clientIndustry,
          proposalDate: formData.proposalDate,
          notes: formData.notes || "",
          terms: {
            validityDays: formData.validityDays,
          },
          editedHtmlContent: savedEditorContent.html,
          editedJsonContent: savedEditorContent.json,
          templateMetadata: {
            templateId: template?.id,
            templateName: template?.name,
            serviceId: selectedServiceId,
            serviceName: selectedServiceName,
            serviceSubTypeId: selectedSubTypeId || null,
            serviceSubTypeName: selectedSubTypeName || null,
            editedAt: new Date().toISOString(),
            editorVersion: "tiptap-v1",
          },
        };

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
            serviceSubTypeId: selectedSubTypeId || null,
            proposalData,
          });
          toast.success("Proposal request submitted for approval");
        }
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
    formData.clientIndustry &&
    formData.clientAddress &&
    formData.proposalDate &&
    !validationErrors.clientName &&
    !validationErrors.clientEmail &&
    !validationErrors.clientPhone &&
    !validationErrors.clientCompany &&
    !validationErrors.clientIndustry &&
    !validationErrors.clientAddress &&
    !validationErrors.proposalDate;
  const canSubmit =
    creationMode === "upload"
      ? uploadedPdf && !isSubmitting
      : savedEditorContent.html && !hasUnsavedEditorChanges && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${
          currentStep === 3
            ? "w-full sm:w-[1400px]! max-w-[98vw]! h-[98vh] sm:h-[95vh]! max-h-[98vh] sm:max-h-[95vh]!"
            : "w-full sm:w-[1000px]! max-w-[95vw]! h-[98vh] sm:h-[90vh]! max-h-[98vh] sm:max-h-[90vh]!"
        } flex flex-col p-0 gap-0 transition-all duration-300`}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>
            {inquiry?.proposalStatus === "disapproved"
              ? "Revise Proposal"
              : "Create Proposal"}
          </DialogTitle>
          <DialogDescription>
            Proposal creation wizard for {inquiry?.name}
          </DialogDescription>
        </VisuallyHidden>
        {/* Two Column Layout */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Left Sidebar - Progress Steps (Hidden on mobile, horizontal stepper shown instead) */}
          <div className="hidden md:flex w-[280px] shrink-0 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-r border-gray-200 dark:border-gray-700 p-6 flex-col">
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
                      Create & Submit
                    </p>
                    <p
                      className={`text-xs mt-0.5 leading-tight ${
                        currentStep === 3
                          ? "text-white/80"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      Edit or upload proposal
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
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            {/* Mobile Header with Stepper */}
            <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shrink-0">
              <div className="mb-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {inquiry?.proposalStatus === "disapproved"
                    ? "Revise Proposal"
                    : "Create Proposal"}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {inquiry?.name} • {inquiry?.email}
                </p>
              </div>
              {/* Horizontal Stepper */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          currentStep === step
                            ? "bg-[#15803d] text-white"
                            : currentStep > step
                              ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {currentStep > step ? "✓" : step}
                      </div>
                      <span
                        className={`text-xs font-medium truncate ${
                          currentStep === step
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {step === 1 ? "Service" : step === 2 ? "Info" : "Create"}
                      </span>
                    </div>
                    {step < 3 && (
                      <div
                        className={`h-0.5 flex-1 mx-1 ${
                          currentStep > step
                            ? "bg-green-400 dark:bg-green-600"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div
              className={`flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6 min-h-0 ${
                currentStep === 3
                  ? "flex flex-col overflow-hidden"
                  : "overflow-y-auto overflow-x-hidden"
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
                  <div className="pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      Select Service Type
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl">
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
                          className={`relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border-2 transition-all text-center min-h-[120px] sm:min-h-[140px] bg-white dark:bg-gray-800 ${
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

                  {/* Sub-type selector (shown when service has sub-types) */}
                  {selectedServiceId &&
                    subTypes.length > 0 &&
                    !isLoadingSubTypes && (
                      <div className="max-w-3xl space-y-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Select {selectedServiceName} Type
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Choose the specific hauling method
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          {subTypes.map((subType) => {
                            const isSelected = selectedSubTypeId === subType.id;
                            return (
                              <button
                                key={subType.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSubTypeId(subType.id);
                                  setSelectedSubTypeName(subType.name);
                                }}
                                className={`relative flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center ${
                                  isSelected
                                    ? "border-[#15803d] bg-green-50 dark:bg-green-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                                } cursor-pointer`}
                              >
                                <div className="absolute top-2.5 right-2.5">
                                  {isSelected ? (
                                    <div className="w-4 h-4 bg-[#15803d] rounded-full flex items-center justify-center">
                                      <Check
                                        className="w-2.5 h-2.5 text-white"
                                        strokeWidth={3}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                                  )}
                                </div>
                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                                  {subType.name}
                                </h4>
                                {subType.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {subType.description}
                                  </p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {(isLoadingTemplate || isLoadingSubTypes) && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
                      <span className="ml-3 text-gray-600 dark:text-gray-400">
                        Loading...
                      </span>
                    </div>
                  )}
                </div>
              ) : currentStep === 2 ? (
                /* STEP 2: Client Information Form */
                <div className="space-y-4 sm:space-y-6">
                  {/* Step Title */}
                  <div className="pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      Client Information
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Enter the client details for this proposal
                    </p>
                  </div>

                  {isLoadingTemplate ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[#106934]" />
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-2xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                                e.target.value,
                              )
                            }
                            placeholder="Operations Manager"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                                date ? format(date, "yyyy-MM-dd") : "",
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="clientIndustry">
                            Industry <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.clientIndustry || undefined}
                            onValueChange={(value) =>
                              handleInputChange("clientIndustry", value)
                            }
                          >
                            <SelectTrigger
                              id="clientIndustry"
                              aria-invalid={!!validationErrors.clientIndustry}
                            >
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="food_and_beverage">
                                Food & Beverage
                              </SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="manufacturing">
                                Manufacturing
                              </SelectItem>
                              <SelectItem value="healthcare">
                                Healthcare
                              </SelectItem>
                              <SelectItem value="hospitality">
                                Hospitality
                              </SelectItem>
                              <SelectItem value="education">
                                Education
                              </SelectItem>
                              <SelectItem value="construction">
                                Construction
                              </SelectItem>
                              <SelectItem value="real_estate">
                                Real Estate
                              </SelectItem>
                              <SelectItem value="logistics">
                                Logistics
                              </SelectItem>
                              <SelectItem value="agriculture">
                                Agriculture
                              </SelectItem>
                              <SelectItem value="technology">
                                Technology
                              </SelectItem>
                              <SelectItem value="government">
                                Government
                              </SelectItem>
                              <SelectItem value="residential">
                                Residential
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {validationErrors.clientIndustry && (
                            <p className="text-xs text-red-500 mt-1">
                              {validationErrors.clientIndustry}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="validityDays">
                            Proposal Validity (Days)
                          </Label>
                          <Input
                            id="validityDays"
                            type="number"
                            placeholder="Enter number of days"
                            className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                            value={formData.validityDays ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              handleInputChange(
                                "validityDays",
                                raw === "" ? "" : parseInt(raw, 10) || "",
                              );
                            }}
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
                              {selectedSubTypeName &&
                                ` - ${selectedSubTypeName}`}
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
                  <div className="pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700 shrink-0 mb-3 sm:mb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {creationMode === "upload" ? "Upload & Submit Proposal" : "Edit & Submit Proposal"}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {creationMode === "upload"
                            ? "Upload a pre-made PDF proposal for approval"
                            : "Customize the proposal content and submit for approval"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto" />
                    </div>
                  </div>

                  {creationMode === "upload" ? (
                    /* Upload mode - show selected file */
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {uploadedPdf?.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {uploadedPdf && (uploadedPdf.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUploadedPdf(null);
                              setCreationMode("template");
                              if (!editorInitialContent) {
                                prepareEditorContent();
                              }
                            }}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                          <Check className="h-4 w-4" />
                          <span>Ready to submit for approval</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Template editor mode (existing) */
                    <>
                      {/* Instructions */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm shrink-0 mb-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-blue-800 dark:text-blue-100 font-medium">
                              The proposal below is shown in unstyled format for easy editing
                            </p>
                            <p className="text-blue-600 dark:text-blue-300 mt-1">
                              Use the toolbar to format text. Click "Save Changes" before submitting.
                              To see how it will actually look in the final PDF with proper styling and formatting,
                              click the <strong>"Full Preview"</strong> button above.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Unsaved Changes Warning */}
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
                        <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
                          <ProposalHtmlEditor
                            content={editorInitialContent}
                            templateStyles={templateStructureRef.current.styles}
                            onChange={handleEditorSave}
                            onUnsavedChange={handleUnsavedChange}
                            className="h-full"
                            onFullPreview={creationMode === "template" ? () => setShowPreview(true) : undefined}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Inside Right Content Area */}
            <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
                {currentStep === 1 ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(2)}
                      disabled={
                        !selectedServiceId ||
                        isLoadingTemplate ||
                        isLoadingSubTypes ||
                        (subTypes.length > 0 && !selectedSubTypeId)
                      }
                      className="w-full sm:w-auto sm:min-w-[120px]"
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
                    <Button variant="outline" onClick={() => setCurrentStep(1)} className="w-full sm:w-auto">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        if (creationMode === "upload") {
                          setCurrentStep(3);
                        } else {
                          prepareEditorContent();
                        }
                      }}
                      disabled={
                        !isFormValid || isLoadingEditor || isLoadingTemplate
                      }
                      className="w-full sm:w-auto sm:min-w-[140px]"
                    >
                      {isLoadingEditor ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      Next Step
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUploadModal(true)}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">Upload PDF Instead</span>
                        <span className="sm:hidden">Upload PDF</span>
                      </Button>
                      <Button
                        onClick={handleSubmitClick}
                        disabled={!canSubmit}
                        className={`w-full sm:w-auto sm:min-w-[140px] ${
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
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Upload PDF Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Proposal PDF</DialogTitle>
            <DialogDescription>
              Upload a pre-made PDF proposal instead of using the template editor.
              It will still go through admin approval.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {!uploadedPdf ? (
              <label
                htmlFor="proposal-pdf-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-[#15803d] hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-colors p-8"
              >
                <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Click to select a PDF file
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PDF only, max 10MB
                </p>
                <input
                  id="proposal-pdf-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.type !== "application/pdf") {
                      toast.error("Only PDF files are allowed");
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("File size must be less than 10MB");
                      return;
                    }
                    setUploadedPdf(file);
                    setCreationMode("upload");
                    setShowUploadModal(false);
                  }}
                />
              </label>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                      {uploadedPdf.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(uploadedPdf.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedPdf(null)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>
            {uploadedPdf && (
              <Button
                onClick={() => {
                  setCreationMode("upload");
                  setShowUploadModal(false);
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Use This PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Proposal Submission</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Please verify that all client information is accurate before
                  submitting. Once submitted, the following details will be
                  locked into the proposal:
                </p>
                <div className="rounded-md border p-3 bg-muted/50 text-sm space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Name:</span>{" "}
                    {formData.clientName}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Email:</span>{" "}
                    {formData.clientEmail}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Company:
                    </span>{" "}
                    {formData.clientCompany}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Phone:</span>{" "}
                    {formData.clientPhone || "Not provided"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Address:
                    </span>{" "}
                    {formData.clientAddress || "Not provided"}
                  </p>
                </div>
                <p className="text-amber-600 dark:text-amber-500 text-sm font-medium">
                  This data cannot be changed after submission. If any detail is
                  incorrect, go back and update the inquiry first.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Confirm & Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[98vw] w-[2200px] h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle>Full Proposal Preview</DialogTitle>
            <DialogDescription>
              This is how your proposal will look when generated as PDF
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                  Generating PDF preview...
                </span>
              </div>
            ) : pdfPreviewUrl ? (
              <iframe
                src={pdfPreviewUrl}
                title="PDF Preview"
                className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg"
                style={{ minHeight: "600px" }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>No preview available</p>
                <Button
                  onClick={generatePdfPreview}
                  className="mt-4"
                  size="sm"
                >
                  Generate Preview
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
