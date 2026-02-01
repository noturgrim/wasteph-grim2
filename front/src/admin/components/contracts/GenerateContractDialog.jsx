import { useState, useEffect } from "react";
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
  Send,
  Edit,
  Code2,
  RefreshCw,
} from "lucide-react";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";
import ProposalHtmlEditor from "@/components/common/ProposalHtmlEditor";

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
  onSendToSales,
}) {
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [isHtmlEditorMode, setIsHtmlEditorMode] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState("");
  const [savedHtml, setSavedHtml] = useState("");
  const [isLoadingHtml, setIsLoadingHtml] = useState(false);
  const [hasUnsavedHtmlChanges, setHasUnsavedHtmlChanges] = useState(false);

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
        clientEmailContract: contractData.clientEmailContract || "",
        clientAddress: contractData.clientAddress || "",
        contractDuration: contractData.contractDuration || "",
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
      setIsHtmlEditorMode(false);
      setRenderedHtml("");
      setSavedHtml("");
      setHasUnsavedHtmlChanges(false);

      // If contract already has a generated PDF, mark as generated and load it
      if (contractData.contractPdfUrl || contractData.status === "ready_for_sales") {
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
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatoryChange = (index, field, value) => {
    const newSignatories = [...editedData.signatories];
    newSignatories[index] = { ...newSignatories[index], [field]: value };
    setEditedData((prev) => ({ ...prev, signatories: newSignatories }));
  };

  const addSignatory = () => {
    setEditedData((prev) => ({
      ...prev,
      signatories: [...prev.signatories, { name: "", position: "" }],
    }));
  };

  const removeSignatory = (index) => {
    if (editedData.signatories.length > 1) {
      setEditedData((prev) => ({
        ...prev,
        signatories: prev.signatories.filter((_, i) => i !== index),
      }));
    }
  };

  const handlePreview = async () => {
    try {
      setIsPreviewing(true);
      const response = await api.previewContractFromTemplate(
        contract.contract.id,
        editedData
      );

      if (response.success) {
        // Open PDF in new window
        const pdfWindow = window.open("", "_blank");
        pdfWindow.document.write(
          `<iframe width='100%' height='100%' src='data:application/pdf;base64,${response.data}'></iframe>`
        );
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate preview");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsSubmitting(true);
      const response = await api.generateContractFromTemplate(
        contract.contract.id,
        editedData,
        adminNotes || null
      );

      toast.success("Contract generated successfully");
      setIsGenerated(true);

      // Load the generated PDF
      await loadGeneratedPdf();
    } catch (error) {
      toast.error(error.message || "Failed to generate contract");
    } finally {
      setIsSubmitting(false);
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

  const handleSendToSales = async () => {
    try {
      if (onSendToSales) {
        await onSendToSales(contract);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to send to sales:", error);
    }
  };

  const handleEditContract = async () => {
    try {
      setIsLoadingHtml(true);
      const response = await api.getRenderedContractHtml(contract.contract.id);
      if (response.success) {
        setRenderedHtml(response.data.html);
        setSavedHtml(response.data.html);
        setIsHtmlEditorMode(true);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load contract HTML");
    } finally {
      setIsLoadingHtml(false);
    }
  };

  const handleEditorSave = ({ html }) => {
    setSavedHtml(html);
  };

  const handleSaveAndRegenerate = async () => {
    try {
      setIsSubmitting(true);
      await api.generateContractFromTemplate(
        contract.contract.id,
        editedData,
        adminNotes || null,
        savedHtml
      );
      toast.success("Contract regenerated successfully");
      setIsGenerated(true);
      setHasUnsavedHtmlChanges(false);
      await loadGeneratedPdf();
    } catch (error) {
      toast.error(error.message || "Failed to regenerate contract");
    } finally {
      setIsSubmitting(false);
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
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      {isHtmlEditorMode ? (
                        <Code2 className="h-4 w-4" />
                      ) : (
                        <Edit className="h-4 w-4" />
                      )}
                      {isHtmlEditorMode ? "Edit Contract HTML" : "Edit Contract Details"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sales Person: {salesPersonName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGenerated && !isHtmlEditorMode && (
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
                    {isHtmlEditorMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsHtmlEditorMode(false);
                          setHasUnsavedHtmlChanges(false);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Back to Fields
                      </Button>
                    )}
                    {isGenerated && (
                      <Badge className="bg-green-600">Generated</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Editable Fields / HTML Editor */}
              {isHtmlEditorMode ? (
                <ProposalHtmlEditor
                  content={renderedHtml}
                  templateStyles=""
                  onChange={handleEditorSave}
                  onUnsavedChange={setHasUnsavedHtmlChanges}
                  className="min-h-[500px]"
                />
              ) : (
              <div className="space-y-4">
          {/* Contract Type */}
          <div className="space-y-2">
            <Label htmlFor="contractType">Contract Type *</Label>
            <Select
              value={editedData.contractType}
              onValueChange={(value) => handleFieldChange("contractType", value)}
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
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={editedData.clientName || ""}
                onChange={(e) => handleFieldChange("clientName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={editedData.companyName || ""}
                onChange={(e) => handleFieldChange("companyName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmailContract">Client Email *</Label>
              <Input
                id="clientEmailContract"
                type="email"
                value={editedData.clientEmailContract || ""}
                onChange={(e) =>
                  handleFieldChange("clientEmailContract", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractDuration">Contract Duration *</Label>
              <Input
                id="contractDuration"
                value={editedData.contractDuration || ""}
                onChange={(e) =>
                  handleFieldChange("contractDuration", e.target.value)
                }
                placeholder="e.g., 12 months"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientAddress">Client Address *</Label>
            <Textarea
              id="clientAddress"
              value={editedData.clientAddress || ""}
              onChange={(e) => handleFieldChange("clientAddress", e.target.value)}
              rows={2}
            />
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="collectionSchedule">Collection Schedule *</Label>
              <Select
                value={editedData.collectionSchedule}
                onValueChange={(value) =>
                  handleFieldChange("collectionSchedule", value)
                }
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

            {editedData.collectionSchedule === "other" && (
              <div className="space-y-2">
                <Label htmlFor="collectionScheduleOther">
                  Specify Schedule *
                </Label>
                <Input
                  id="collectionScheduleOther"
                  value={editedData.collectionScheduleOther || ""}
                  onChange={(e) =>
                    handleFieldChange("collectionScheduleOther", e.target.value)
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="wasteAllowance">Waste Allowance *</Label>
              <Input
                id="wasteAllowance"
                value={editedData.wasteAllowance || ""}
                onChange={(e) =>
                  handleFieldChange("wasteAllowance", e.target.value)
                }
                placeholder="e.g., 500 kg/month"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ratePerKg">Rate per Kg *</Label>
              <Input
                id="ratePerKg"
                value={editedData.ratePerKg || ""}
                onChange={(e) => handleFieldChange("ratePerKg", e.target.value)}
                placeholder="e.g., PHP 3.50/kg"
              />
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceLatitude">Service Latitude *</Label>
              <Input
                id="serviceLatitude"
                value={editedData.serviceLatitude || ""}
                onChange={(e) =>
                  handleFieldChange("serviceLatitude", e.target.value)
                }
                placeholder="e.g., 14.5995"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceLongitude">Service Longitude *</Label>
              <Input
                id="serviceLongitude"
                value={editedData.serviceLongitude || ""}
                onChange={(e) =>
                  handleFieldChange("serviceLongitude", e.target.value)
                }
                placeholder="e.g., 120.9842"
              />
            </div>
          </div>

          {/* Special Clauses */}
          <div className="space-y-2">
            <Label htmlFor="specialClauses">Special Clauses *</Label>
            <Textarea
              id="specialClauses"
              value={editedData.specialClauses || ""}
              onChange={(e) => handleFieldChange("specialClauses", e.target.value)}
              rows={3}
            />
          </div>

          {/* Client Requests */}
          <div className="space-y-2">
            <Label htmlFor="clientRequests">Client Requests *</Label>
            <Textarea
              id="clientRequests"
              value={editedData.clientRequests || ""}
              onChange={(e) => handleFieldChange("clientRequests", e.target.value)}
              rows={2}
            />
          </div>

          {/* Signatories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Signatories *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSignatory}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Signatory
              </Button>
            </div>

            {editedData.signatories?.map((signatory, index) => (
              <div key={index} className="flex gap-3 items-start p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Full Name"
                    value={signatory.name}
                    onChange={(e) =>
                      handleSignatoryChange(index, "name", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Position/Title"
                    value={signatory.position}
                    onChange={(e) =>
                      handleSignatoryChange(index, "position", e.target.value)
                    }
                  />
                </div>
                {editedData.signatories.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSignatory(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Admin Notes */}
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
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Contract PDF */}
          <div className="overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-background pb-2 border-b z-10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Contract PDF
              </h3>
              {isGenerated && (
                <Badge className="bg-green-600">Generated</Badge>
              )}
            </div>

            <div className="flex-1 min-h-[500px] border rounded-lg overflow-hidden bg-gray-50 mt-2">
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
                      Click "Generate Contract" to create the PDF
                    </p>
                    <Button onClick={handleGenerate} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileCheck className="mr-2 h-4 w-4" />
                      )}
                      Generate Contract
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

          {isHtmlEditorMode && (
            <Button
              onClick={handleSaveAndRegenerate}
              variant="outline"
              disabled={isSubmitting || hasUnsavedHtmlChanges || !savedHtml}
              className="border-green-600 text-green-700 hover:bg-green-50"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Save &amp; Regenerate
            </Button>
          )}

          <Button
            onClick={handleSendToSales}
            className="bg-green-600 hover:bg-green-700"
            disabled={!isGenerated}
          >
            <Send className="mr-2 h-4 w-4" />
            Send to Sales
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
