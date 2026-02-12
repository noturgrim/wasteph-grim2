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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  FileCheck,
  Plus,
  X,
  Edit,
  Code2,
  RefreshCw,
  Upload,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";
import ContractHtmlEditor from "@/components/common/ContractHtmlEditor";
import { PDFViewer } from "../PDFViewer";

const CONTRACT_TYPES = [
  { value: "long_term_variable", label: "LONG TERM GARBAGE VARIABLE CHARGE" },
  {
    value: "long_term_fixed",
    label: "LONG TERM GARBAGE FIXED CHARGE (MORE THAN 50,000 PHP / MONTH)",
  },
  { value: "fixed_rate_term", label: "FIXED RATE TERM" },
  { value: "garbage_bins", label: "GARBAGE BINS" },
  { value: "garbage_bins_disposal", label: "GARBAGE BINS WITH DISPOSAL" },
];

const COLLECTION_SCHEDULES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "bi_weekly", label: "Bi-Weekly" },
  { value: "other", label: "Others (specify)" },
];

export function GenerateContractDialog({
  open,
  onOpenChange,
  contract,
  users,
  onConfirm,
}) {
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState("");
  const [savedHtml, setSavedHtml] = useState("");
  const [isLoadingHtml, setIsLoadingHtml] = useState(false);
  const [hasUnsavedHtmlChanges, setHasUnsavedHtmlChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingData, setPendingData] = useState({});
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState("");
  const [pendingPdfFile, setPendingPdfFile] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const templateStructureRef = useRef({ head: "", bodyTag: "", styles: "" });
  const uploadInputRef = useRef(null);

  // Initialize data when dialog opens
  useEffect(() => {
    if (contract && open) {
      const contractData = contract.contract || {};

      // Parse signatories
      let signatories = [];
      if (contractData.signatories) {
        try {
          signatories =
            typeof contractData.signatories === "string"
              ? JSON.parse(contractData.signatories)
              : contractData.signatories;
        } catch (e) {
          console.error("Failed to parse signatories:", e);
        }
      }

      const data = {
        contractType: contractData.contractType || "",
        clientName: contractData.clientName || "",
        companyName: contractData.companyName || "",
        clientIndustry: contractData.clientIndustry || "",
        clientEmailContract: contractData.clientEmailContract || "",
        clientAddress: contractData.clientAddress || "",
        contractStartDate: contractData.contractStartDate ? contractData.contractStartDate.slice(0, 10) : "",
        contractEndDate: contractData.contractEndDate ? contractData.contractEndDate.slice(0, 10) : "",
        serviceLatitude: contractData.serviceLatitude || "",
        serviceLongitude: contractData.serviceLongitude || "",
        collectionSchedule: contractData.collectionSchedule || "",
        collectionScheduleOther: contractData.collectionScheduleOther || "",
        wasteAllowance: contractData.wasteAllowance || "",
        specialClauses: contractData.specialClauses || "",
        signatories:
          signatories.length > 0 ? signatories : [{ name: "", position: "" }],
        ratePerKg: contractData.ratePerKg || "",
        clientRequests: contractData.clientRequests || "",
      };

      setEditedData(data);
      setOriginalData(data);
      setAdminNotes("");
      setPdfPreviewUrl("");
      setIsEditing(false);
      setPendingData({});
      setIsEditModalOpen(false);
      setRenderedHtml("");
      setSavedHtml("");
      setHasUnsavedHtmlChanges(false);

      // If contract already has a generated PDF, mark as generated and load it
      if (contractData.contractPdfUrl) {
        setIsGenerated(true);
        // Auto-load the existing PDF
        setTimeout(() => {
          setIsLoadingPdf(true);
          const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
          fetch(`${API_BASE_URL}/contracts/${contractData.id}/pdf`, {
            method: "GET",
            credentials: "include",
          })
            .then((res) => {
              if (!res.ok) throw new Error("Failed to fetch PDF");
              return res.blob();
            })
            .then((blob) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                setPdfPreviewUrl(reader.result);
                setIsLoadingPdf(false);
              };
              reader.readAsDataURL(blob);
            })
            .catch((err) => {
              console.error("Failed to load existing PDF:", err);
              setIsLoadingPdf(false);
            });
        }, 0);
      } else {
        setIsGenerated(false);
      }
    }
  }, [contract, open]);

  const handleFieldChange = (field, value) => {
    setPendingData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatoryChange = (index, field, value) => {
    const newSignatories = [...pendingData.signatories];
    newSignatories[index] = { ...newSignatories[index], [field]: value };
    setPendingData((prev) => ({ ...prev, signatories: newSignatories }));
  };

  const addSignatory = () => {
    setPendingData((prev) => ({
      ...prev,
      signatories: [...prev.signatories, { name: "", position: "" }],
    }));
  };

  const removeSignatory = (index) => {
    if (pendingData.signatories.length > 1) {
      setPendingData((prev) => ({
        ...prev,
        signatories: prev.signatories.filter((_, i) => i !== index),
      }));
    }
  };

  const handleEditStart = () => {
    setPendingData({ ...editedData });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setPendingData({});
    setIsEditing(false);
  };

  const handleEditSave = () => {
    setEditedData(pendingData);
    setPendingData({});
    setIsEditing(false);
  };

  const handlePreview = async () => {
    try {
      setIsPreviewing(true);
      const response = await api.previewContractFromTemplate(
        contract.contract.id,
        editedData
      );

      if (response.success) {
        setPreviewPdfUrl(`data:application/pdf;base64,${response.data}`);
        setShowPdfViewer(true);
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate preview");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handlePreviewInPanel = async () => {
    try {
      setIsLoadingPdf(true);
      const response = await api.previewContractFromTemplate(
        contract.contract.id,
        editedData
      );

      if (response.success) {
        setPdfPreviewUrl(`data:application/pdf;base64,${response.data}`);
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate preview");
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (pendingPdfFile) {
        // If a PDF was selected, upload it instead of generating from template
        await api.uploadContractPdf(
          contract.contract.id,
          pendingPdfFile,
          adminNotes || null,
          editedData,
        );

        toast.success("Contract PDF uploaded successfully");
      } else {
        // Default flow: generate contract from template
        await api.generateContractFromTemplate(
          contract.contract.id,
          editedData,
          adminNotes || null,
        );

        toast.success("Contract submitted successfully");

        // Load the saved PDF
        await loadGeneratedPdf();
      }

      setIsGenerated(true);
      setPendingPdfFile(null);

      // Notify parent and close dialog so list can refresh
      if (typeof onConfirm === "function") {
        await onConfirm();
      }
      if (typeof onOpenChange === "function") {
        onOpenChange(false);
      }
    } catch (error) {
      toast.error(error.message || "Failed to submit contract");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPdfInstead = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setPendingPdfFile(file);

    // Reset file input so the same file can be re-selected if needed
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const loadGeneratedPdf = async () => {
    try {
      setIsLoadingPdf(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await fetch(
        `${API_BASE_URL}/contracts/${contract.contract.id}/pdf`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to fetch PDF");

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfPreviewUrl(reader.result);
        setIsLoadingPdf(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to load PDF:", error);
      toast.error("Failed to load contract PDF");
      setIsLoadingPdf(false);
    }
  };

  const handleEditContract = async () => {
    try {
      setIsLoadingHtml(true);
      const response = await api.getRenderedContractHtml(contract.contract.id);
      if (response.success) {
        const fullHtml = response.data.html;

        // Extract template structure (head, styles, body) for the editor
        const headMatch = fullHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
        const bodyTagMatch = fullHtml.match(/<body[^>]*>/i);
        const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);

        if (headMatch && bodyMatch) {
          // Extract ALL style tags from head
          const styleMatch = headMatch[0].match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
          const inlineStyles = styleMatch
            ? styleMatch.map((s) => s.replace(/<\/?style[^>]*>/gi, "")).join("\n")
            : "";

          const fullBodyHtml = bodyMatch[1] || "";

          // Try to extract just the editable content (exclude non-editable header)
          let editorBodyContent = fullBodyHtml;
          let contentSelector = null;

          try {
            const container = document.createElement("div");
            container.innerHTML = fullBodyHtml;

            // Try to find .content wrapper (editable section)
            const contentNode = container.querySelector(".content");
            if (contentNode) {
              editorBodyContent = contentNode.innerHTML || "";
              contentSelector = ".content";
            } else {
              // No .content wrapper - check if there's a header we should exclude
              const headerNode = container.querySelector(".header");
              if (headerNode) {
                // Remove the header from the editable content
                headerNode.remove();
                editorBodyContent = container.innerHTML;
                contentSelector = null; // We'll reconstruct without a specific selector
              } else {
                // No header, use full body
                editorBodyContent = fullBodyHtml;
                contentSelector = null;
              }
            }
          } catch {
            // Fallback: use full body HTML
            editorBodyContent = fullBodyHtml;
            contentSelector = null;
          }

          templateStructureRef.current = {
            head: headMatch[0],
            bodyTag: bodyTagMatch ? bodyTagMatch[0] : "<body>",
            styles: inlineStyles,
            bodyHtml: fullBodyHtml, // Keep full body for reconstruction
            contentSelector: contentSelector, // Where to insert edited content back (null if no wrapper)
          };

          console.log("Extracted styles length:", inlineStyles.length);
          console.log("Styles preview:", inlineStyles.substring(0, 200));
          console.log("Body content preview:", editorBodyContent.substring(0, 800));
          console.log("Content has .content wrapper:", fullBodyHtml.includes('class="content"'));
          console.log("Content has .section class:", editorBodyContent.includes('class="section"'));
          console.log("Content has .info-grid class:", editorBodyContent.includes('class="info-grid"'));

          setRenderedHtml(editorBodyContent);
          setSavedHtml(fullHtml);
        } else {
          // Fallback: no head/body structure, use as-is
          console.warn("No head/body structure found in contract HTML");
          templateStructureRef.current = { head: "", bodyTag: "", styles: "" };
          setRenderedHtml(fullHtml);
          setSavedHtml(fullHtml);
        }

        setIsEditModalOpen(true);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load contract HTML");
    } finally {
      setIsLoadingHtml(false);
    }
  };

  const handleEditorSave = ({ html }) => {
    const { head, bodyTag, bodyHtml, contentSelector } = templateStructureRef.current;

    let fullHtml = html;

    if (head && bodyTag) {
      // Try to surgically replace only the editable content section
      let bodyContentForSave = html;

      if (bodyHtml) {
        if (contentSelector) {
          // There's a specific content wrapper (like .content)
          try {
            const container = document.createElement("div");
            container.innerHTML = bodyHtml;
            const target = container.querySelector(contentSelector);

            if (target) {
              // Success: replace only the editable section
              target.innerHTML = html;
              bodyContentForSave = container.innerHTML;
              console.debug("Successfully replaced content in selector:", contentSelector);
            } else {
              // Selector not found, use full body replacement
              console.warn(
                `Content selector "${contentSelector}" not found in template body. ` +
                `Using full body replacement instead.`
              );
              bodyContentForSave = html;
            }
          } catch (error) {
            console.error("DOM parsing failed during surgical replacement:", error);
            bodyContentForSave = html;
          }
        } else {
          // No content selector - we removed header, so reconstruct with header + new content
          try {
            const container = document.createElement("div");
            container.innerHTML = bodyHtml;
            const headerNode = container.querySelector(".header");

            if (headerNode) {
              // Re-add the header before the edited content
              const headerHtml = headerNode.outerHTML;
              bodyContentForSave = `${headerHtml}\n${html}`;
              console.debug("Reconstructed body with header + edited content");
            } else {
              // No header found, use edited content as-is
              bodyContentForSave = html;
            }
          } catch (error) {
            console.error("Failed to reconstruct with header:", error);
            bodyContentForSave = html;
          }
        }
      } else {
        // No template structure available, use raw editor content
        console.debug("No template structure, using raw editor HTML");
        bodyContentForSave = html;
      }

      // Reconstruct full HTML document
      fullHtml = `<!DOCTYPE html>\n<html>\n${head}\n${bodyTag}\n${bodyContentForSave}\n</body>\n</html>`;

      // Validate completeness
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
        });
      }
    }

    setSavedHtml(fullHtml);
  };

  const handleSaveAndRegenerate = async () => {
    try {
      setIsRegenerating(true);
      // Persist the edited HTML without changing status
      await api.saveEditedHtml(contract.contract.id, savedHtml);

      // Regenerate preview PDF from the saved HTML
      const response = await api.previewContractFromTemplate(
        contract.contract.id,
        editedData,
        savedHtml
      );

      if (response.success) {
        setPdfPreviewUrl(`data:application/pdf;base64,${response.data}`);
      }

      toast.success("Contract regenerated successfully");
      setHasUnsavedHtmlChanges(false);
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to regenerate contract");
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!contract) return null;

  const salesPerson = users?.find(
    (u) => u.id === contract.proposal?.requestedBy,
  );
  const salesPersonName = salesPerson
    ? `${salesPerson.firstName} ${salesPerson.lastName}`
    : "Unknown";

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl! w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-green-600" />
            Generate Contract from Template
          </DialogTitle>
          <DialogDescription>
            Review and edit contract details, then generate the PDF document.
          </DialogDescription>
        </DialogHeader>

        {/* Two Column Layout */}
        <div
          className="grid gap-6 overflow-hidden flex-1"
          style={{ gridTemplateColumns: "2fr 1fr" }}
        >
          {/* LEFT COLUMN - Editable Contract Details */}
          <div className="border-r pr-6 overflow-y-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="sticky top-0 bg-background pb-3 border-b z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Contract Details
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sales Person: {salesPersonName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGenerated && (
                      <Badge className="bg-green-600">Generated</Badge>
                    )}
                    {!isEditing ? (
                      <Button type="button" variant="outline" size="sm" onClick={handleEditStart}>
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button type="button" variant="ghost" size="sm" onClick={handleEditCancel}>
                          Cancel
                        </Button>
                        <Button type="button" size="sm" onClick={handleEditSave} className="bg-blue-600 hover:bg-blue-700">
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Contract Details Fields */}
              <div className="space-y-4">
                {(() => {
                  const d = isEditing ? pendingData : editedData;
                  return (
                    <>
                      {/* Contract Type */}
                      <div className="space-y-2">
                        <Label>Contract Type *</Label>
                        <Select
                          value={d.contractType}
                          onValueChange={(value) => handleFieldChange("contractType", value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTRACT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Client Information */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Client Name *</Label>
                          <Input
                            value={d.clientName || ""}
                            onChange={(e) => handleFieldChange("clientName", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Company Name *</Label>
                          <Input
                            value={d.companyName || ""}
                            onChange={(e) => handleFieldChange("companyName", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Industry</Label>
                          <Select
                            value={d.clientIndustry || undefined}
                            onValueChange={(value) => handleFieldChange("clientIndustry", value)}
                            disabled={!isEditing}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="food_and_beverage">Food & Beverage</SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="hospitality">Hospitality</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="construction">Construction</SelectItem>
                              <SelectItem value="real_estate">Real Estate</SelectItem>
                              <SelectItem value="logistics">Logistics</SelectItem>
                              <SelectItem value="agriculture">Agriculture</SelectItem>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="government">Government</SelectItem>
                              <SelectItem value="residential">Residential</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Client Email *</Label>
                          <Input
                            type="email"
                            value={d.clientEmailContract || ""}
                            onChange={(e) => handleFieldChange("clientEmailContract", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Contract Start *</Label>
                          <DatePicker
                            date={d.contractStartDate ? new Date(d.contractStartDate + "T00:00:00") : undefined}
                            onDateChange={(date) => handleFieldChange("contractStartDate", date ? format(date, "yyyy-MM-dd") : "")}
                            placeholder="Pick start date"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Contract End *</Label>
                          <DatePicker
                            date={d.contractEndDate ? new Date(d.contractEndDate + "T00:00:00") : undefined}
                            onDateChange={(date) => handleFieldChange("contractEndDate", date ? format(date, "yyyy-MM-dd") : "")}
                            placeholder="Pick end date"
                            disabled={!isEditing}
                            fromDate={d.contractStartDate ? new Date(d.contractStartDate + "T00:00:00") : undefined}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Client Address *</Label>
                        <Textarea
                          value={d.clientAddress || ""}
                          onChange={(e) => handleFieldChange("clientAddress", e.target.value)}
                          rows={2}
                          disabled={!isEditing}
                        />
                      </div>

                      {/* Service Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Collection Schedule *</Label>
                          <Select
                            value={d.collectionSchedule}
                            onValueChange={(value) => handleFieldChange("collectionSchedule", value)}
                            disabled={!isEditing}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COLLECTION_SCHEDULES.map((schedule) => (
                                <SelectItem key={schedule.value} value={schedule.value}>
                                  {schedule.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {d.collectionSchedule === "other" && (
                          <div className="space-y-2">
                            <Label>Specify Schedule *</Label>
                            <Input
                              value={d.collectionScheduleOther || ""}
                              onChange={(e) => handleFieldChange("collectionScheduleOther", e.target.value)}
                              disabled={!isEditing}
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Waste Allowance *</Label>
                          <Input
                            value={d.wasteAllowance || ""}
                            onChange={(e) => handleFieldChange("wasteAllowance", e.target.value)}
                            placeholder="e.g., 500 kg/month"
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Rate per Kg *</Label>
                          <Input
                            value={d.ratePerKg || ""}
                            onChange={(e) => handleFieldChange("ratePerKg", e.target.value)}
                            placeholder="e.g., PHP 3.50/kg"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      {/* GPS Coordinates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Service Latitude *</Label>
                          <Input
                            value={d.serviceLatitude || ""}
                            onChange={(e) => handleFieldChange("serviceLatitude", e.target.value)}
                            placeholder="e.g., 14.5995"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Service Longitude *</Label>
                          <Input
                            value={d.serviceLongitude || ""}
                            onChange={(e) => handleFieldChange("serviceLongitude", e.target.value)}
                            placeholder="e.g., 120.9842"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      {/* Special Clauses */}
                      <div className="space-y-2">
                        <Label>Special Clauses *</Label>
                        <Textarea
                          value={d.specialClauses || ""}
                          onChange={(e) => handleFieldChange("specialClauses", e.target.value)}
                          rows={3}
                          disabled={!isEditing}
                        />
                      </div>

                      {/* Client Requests */}
                      <div className="space-y-2">
                        <Label>Client Requests *</Label>
                        <Textarea
                          value={d.clientRequests || ""}
                          onChange={(e) => handleFieldChange("clientRequests", e.target.value)}
                          rows={2}
                          disabled={!isEditing}
                        />
                      </div>

                      {/* Signatories */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Signatories *</Label>
                          {isEditing && (
                            <Button type="button" variant="outline" size="sm" onClick={addSignatory}>
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Add Signatory
                            </Button>
                          )}
                        </div>

                        {d.signatories?.map((signatory, index) => (
                          <div key={index} className="flex gap-3 items-start p-3 border rounded-lg">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <Input
                                placeholder="Full Name"
                                value={signatory.name}
                                onChange={(e) => handleSignatoryChange(index, "name", e.target.value)}
                                disabled={!isEditing}
                              />
                              <Input
                                placeholder="Position/Title"
                                value={signatory.position}
                                onChange={(e) => handleSignatoryChange(index, "position", e.target.value)}
                                disabled={!isEditing}
                              />
                            </div>
                            {isEditing && d.signatories.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeSignatory(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}

                {/* Admin Notes — always editable */}
                <div className="space-y-2">
                  <Label htmlFor="adminNotes">
                    Additional Notes for Sales{" "}
                    <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Add any notes for sales team..."
                  />
                </div>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Note:</strong> All changes will be tracked and sent to sales automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Contract PDF */}
          <div className="overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-background pb-2 border-b z-10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Contract PDF
              </h3>
              <div className="flex items-center gap-2">
                {pdfPreviewUrl && !isGenerated && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePreviewInPanel}
                    disabled={isLoadingPdf}
                  >
                    {isLoadingPdf ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    )}
                    Refresh
                  </Button>
                )}
                {pdfPreviewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEditContract}
                    disabled={isLoadingHtml}
                  >
                    {isLoadingHtml ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Code2 className="h-3.5 w-3.5 mr-1" />
                    )}
                    Edit Contract
                  </Button>
                )}
                {isGenerated && (
                  <Badge className="bg-green-600">Submitted</Badge>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-[500px] border rounded-lg overflow-hidden bg-gray-50 dark:bg-black mt-2">
              {isLoadingPdf ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                    <p className="text-sm font-medium text-gray-600">Loading contract PDF...</p>
                  </div>
                </div>
              ) : pdfPreviewUrl ? (
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full border-0"
                  title="Contract PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Preview the contract before submitting
                    </p>
                    <Button
                      onClick={handlePreviewInPanel}
                      variant="default"
                      className="inline-flex items-center"
                    >
                      <FileCheck className="mr-2 h-4 w-4" />
                      Preview Contract
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsUploadModalOpen(true)}
            disabled={isSubmitting || isGenerated}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload PDF Instead
          </Button>
          {pendingPdfFile && !isGenerated && (
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <FileCheck className="h-3 w-3" />
              <span>Using uploaded PDF: {pendingPdfFile.name}</span>
              <button
                type="button"
                aria-label="Remove uploaded PDF"
                onClick={() => {
                  setPendingPdfFile(null);
                  if (uploadInputRef.current) {
                    uploadInputRef.current.value = "";
                  }
                }}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isGenerated}
            className={isGenerated ? "bg-green-600 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerated ? (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Submitted
              </>
            ) : isSubmitting ? "Submitting..." : "Submit Contract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit Contract HTML Modal */}
    <Dialog open={isEditModalOpen} onOpenChange={(val) => {
      if (!val) {
        setIsEditModalOpen(false);
        setHasUnsavedHtmlChanges(false);
      }
    }}>
      <DialogContent className="max-w-4xl! w-full max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-blue-600" />
            Edit Contract HTML
          </DialogTitle>
          <DialogDescription>
            Edit the contract content directly. Save your changes, then regenerate the PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <ContractHtmlEditor
            content={renderedHtml}
            templateStyles={templateStructureRef.current.styles}
            onChange={handleEditorSave}
            onUnsavedChange={setHasUnsavedHtmlChanges}
          />
        </div>

        <div className="text-xs text-gray-500 mt-3 px-1">
          <strong>Save Changes</strong> confirms your edits in the editor above. <strong>Save &amp; Regenerate</strong> persists your edits and regenerates the contract PDF preview.
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditModalOpen(false);
              setHasUnsavedHtmlChanges(false);
            }}
            disabled={isRegenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAndRegenerate}
            variant="outline"
            disabled={isRegenerating || hasUnsavedHtmlChanges || !savedHtml}
            className="border-green-600 text-green-700 hover:bg-green-50"
          >
            {isRegenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Save &amp; Regenerate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {showPdfViewer && previewPdfUrl && (
      <PDFViewer
        fileUrl={previewPdfUrl}
        fileName={`${editedData.clientName || "Contract"} - Preview.pdf`}
        title="Contract Preview"
        onClose={() => setShowPdfViewer(false)}
        isOpen={showPdfViewer}
      />
    )}

    {/* Upload PDF Instead modal */}
    <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Use this PDF for the contract?</DialogTitle>
          <DialogDescription className="text-sm">
            Choose a PDF file that will be used instead of the generated
            contract template.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <label
            htmlFor="contract-pdf-upload"
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors px-6 py-8 text-center"
          >
            <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
              Click to choose a PDF file
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              PDF only, maximum size 10MB
            </p>
          </label>
          <Input
            id="contract-pdf-upload"
            ref={uploadInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUploadPdfInstead}
          />

          {pendingPdfFile && (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground text-left">
              <span className="font-medium">Selected file:</span>{" "}
              <span>{pendingPdfFile.name}</span>
            </div>
          )}

          <div className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            This will replace the generated template with your uploaded PDF for
            this contract submission.
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsUploadModalOpen(false);
              setPendingPdfFile(null);
              if (uploadInputRef.current) {
                uploadInputRef.current.value = "";
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={!pendingPdfFile}
            onClick={() => {
              setIsUploadModalOpen(false);
              if (pendingPdfFile) {
                toast.success(
                  "PDF selected. Click \"Submit Contract\" to upload it.",
                );
              }
            }}
          >
            Use this PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
