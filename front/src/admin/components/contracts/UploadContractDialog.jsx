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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Loader2,
  AlertCircle,
  FileCheck,
  Edit,
  Plus,
  X,
  Download,
} from "lucide-react";

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

export function UploadContractDialog({
  open,
  onOpenChange,
  contract,
  users,
  onConfirm,
}) {
  const [pdfFile, setPdfFile] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Editable contract data
  const [editedData, setEditedData] = useState({});
  const [originalData, setOriginalData] = useState({});

  const handleDownloadTemplate = () => {
    const url = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/contracts/${contract.contract.id}/custom-template`;
    const a = document.createElement("a");
    a.href = url;
    a.download = true;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
        requestNotes: contractData.requestNotes || "",
      };

      setEditedData(data);
      setOriginalData(data);
    }
  }, [contract, open]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError("");

    if (file) {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        setPdfFile(null);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        setPdfFile(null);
        return;
      }

      setPdfFile(file);
    }
  };

  const handleChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatoryChange = (index, field, value) => {
    const newSignatories = [...editedData.signatories];
    newSignatories[index][field] = value;
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
      const newSignatories = editedData.signatories.filter(
        (_, i) => i !== index,
      );
      setEditedData((prev) => ({ ...prev, signatories: newSignatories }));
    }
  };

  // Generate change log for admin notes
  const generateChangeLog = () => {
    const changes = [];

    const fieldLabels = {
      contractType: "Contract Type",
      clientName: "Client Name",
      companyName: "Company Name",
      clientEmailContract: "Client Email",
      clientAddress: "Client Address",
      contractDuration: "Contract Duration",
      serviceLatitude: "Service Latitude",
      serviceLongitude: "Service Longitude",
      collectionSchedule: "Collection Schedule",
      collectionScheduleOther: "Collection Schedule (Other)",
      wasteAllowance: "Waste Allowance",
      specialClauses: "Special Clauses",
      ratePerKg: "Rate per KG",
      clientRequests: "Client Requests",
    };

    Object.keys(fieldLabels).forEach((field) => {
      if (editedData[field] !== originalData[field]) {
        changes.push(
          `${fieldLabels[field]}: "${originalData[field]}" → "${editedData[field]}"`,
        );
      }
    });

    // Check signatories changes
    const originalSigs = JSON.stringify(originalData.signatories);
    const editedSigs = JSON.stringify(editedData.signatories);
    if (originalSigs !== editedSigs) {
      changes.push("Signatories: Modified");
    }

    if (changes.length > 0) {
      return (
        "Admin made the following changes:\n" +
        changes.map((c) => `• ${c}`).join("\n") +
        "\n\n"
      );
    }
    return "";
  };

  const handleSubmit = async (sendToSales) => {
    if (!pdfFile) {
      setError("Please select a PDF file");
      return;
    }

    setIsSubmitting(true);
    try {
      const changeLog = generateChangeLog();
      const finalNotes = changeLog + adminNotes;

      await onConfirm(pdfFile, finalNotes, sendToSales, editedData);

      // Reset on success
      setPdfFile(null);
      setAdminNotes("");
      setError("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen) => {
    if (!isOpen && !isSubmitting) {
      setPdfFile(null);
      setAdminNotes("");
      setError("");
      setEditedData({});
      setOriginalData({});
    }
    onOpenChange(isOpen);
  };

  if (!contract) return null;

  const salesPerson = users.find(
    (u) => u.id === contract.proposal?.requestedBy,
  );
  const salesPersonName = salesPerson
    ? `${salesPerson.firstName} ${salesPerson.lastName}`
    : "Unknown";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Upload Contract & Review Details
          </DialogTitle>
          <DialogDescription>
            Review and edit contract details, then upload the PDF document.
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
                      <Edit className="h-4 w-4" />
                      Edit Contract Details
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sales Person: {salesPersonName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Template Alert (if provided) */}
              {contract?.contract?.customTemplateUrl && (
                <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                        Client Custom Template Provided
                      </h4>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        The client has provided their own contract template.{" "}
                        <button
                          type="button"
                          onClick={handleDownloadTemplate}
                          className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          Download Template
                          <Download className="h-3 w-3" />
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Editable Fields */}
              <div className="space-y-4">
                {/* Contract Type */}
                <div>
                  <Label htmlFor="contractType">Contract Type *</Label>
                  <Select
                    value={editedData.contractType}
                    onValueChange={(value) =>
                      handleChange("contractType", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select contract type" />
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
                  <div>
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={editedData.clientName}
                      onChange={(e) =>
                        handleChange("clientName", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={editedData.companyName}
                      onChange={(e) =>
                        handleChange("companyName", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientEmailContract">Client Email *</Label>
                    <Input
                      id="clientEmailContract"
                      type="email"
                      value={editedData.clientEmailContract}
                      onChange={(e) =>
                        handleChange("clientEmailContract", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientAddress">Client Address *</Label>
                    <Input
                      id="clientAddress"
                      value={editedData.clientAddress}
                      onChange={(e) =>
                        handleChange("clientAddress", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Contract Duration */}
                <div>
                  <Label htmlFor="contractDuration">Contract Duration *</Label>
                  <Input
                    id="contractDuration"
                    value={editedData.contractDuration}
                    onChange={(e) =>
                      handleChange("contractDuration", e.target.value)
                    }
                    placeholder="e.g., January 1, 2024 - December 31, 2024"
                    className="mt-1"
                  />
                </div>

                {/* Service Address (Lat/Long) */}
                <div>
                  <Label>Service Address (Coordinates) *</Label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <Input
                      type="number"
                      step="any"
                      value={editedData.serviceLatitude}
                      onChange={(e) =>
                        handleChange("serviceLatitude", e.target.value)
                      }
                      placeholder="Latitude"
                    />
                    <Input
                      type="number"
                      step="any"
                      value={editedData.serviceLongitude}
                      onChange={(e) =>
                        handleChange("serviceLongitude", e.target.value)
                      }
                      placeholder="Longitude"
                    />
                  </div>
                </div>

                {/* Collection Schedule */}
                <div>
                  <Label htmlFor="collectionSchedule">
                    Collection Schedule *
                  </Label>
                  <Select
                    value={editedData.collectionSchedule}
                    onValueChange={(value) =>
                      handleChange("collectionSchedule", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLLECTION_SCHEDULES.map((schedule) => (
                        <SelectItem key={schedule.value} value={schedule.value}>
                          {schedule.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editedData.collectionSchedule === "other" && (
                    <Input
                      value={editedData.collectionScheduleOther}
                      onChange={(e) =>
                        handleChange("collectionScheduleOther", e.target.value)
                      }
                      placeholder="Specify schedule"
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Waste Allowance & Rate */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wasteAllowance">Waste Allowance *</Label>
                    <Input
                      id="wasteAllowance"
                      value={editedData.wasteAllowance}
                      onChange={(e) =>
                        handleChange("wasteAllowance", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ratePerKg">Rate per KG *</Label>
                    <Input
                      id="ratePerKg"
                      value={editedData.ratePerKg}
                      onChange={(e) =>
                        handleChange("ratePerKg", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Signatories */}
                <div>
                  <Label>Signatories *</Label>
                  <div className="space-y-2 mt-2">
                    {(Array.isArray(editedData.signatories)
                      ? editedData.signatories
                      : []
                    ).map((signatory, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={signatory.name}
                          onChange={(e) =>
                            handleSignatoryChange(index, "name", e.target.value)
                          }
                          placeholder="Name"
                          className="flex-1"
                        />
                        <Input
                          value={signatory.position}
                          onChange={(e) =>
                            handleSignatoryChange(
                              index,
                              "position",
                              e.target.value,
                            )
                          }
                          placeholder="Position"
                          className="flex-1"
                        />
                        {editedData.signatories.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSignatory(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSignatory}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Signatory
                    </Button>
                  </div>
                </div>

                {/* Special Clauses */}
                <div>
                  <Label htmlFor="specialClauses">Special Clauses *</Label>
                  <Textarea
                    id="specialClauses"
                    value={editedData.specialClauses}
                    onChange={(e) =>
                      handleChange("specialClauses", e.target.value)
                    }
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Client Requests */}
                <div>
                  <Label htmlFor="clientRequests">Client Requests *</Label>
                  <Textarea
                    id="clientRequests"
                    value={editedData.clientRequests}
                    onChange={(e) =>
                      handleChange("clientRequests", e.target.value)
                    }
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Request Notes from Sales */}
                {editedData.requestNotes && (
                  <div>
                    <Label>Request Notes from Sales</Label>
                    <div className="mt-1 p-3 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {editedData.requestNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Upload Form */}
          <div className="overflow-y-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="sticky top-0 bg-background pb-2 border-b z-10">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Upload Contract PDF
                </h3>
              </div>

              {/* File Upload */}
              <div>
                <Label htmlFor="contractPdf">Contract PDF *</Label>
                <Input
                  id="contractPdf"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a PDF file (max 10MB)
                </p>
                {pdfFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <FileCheck className="h-4 w-4" />
                    {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)}{" "}
                    MB)
                  </div>
                )}
                {error && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="adminNotes">
                  Additional Notes for Sales{" "}
                  <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any additional notes or instructions..."
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Changes made will be automatically logged in notes.
                </p>
              </div>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> All changes will be tracked and sent to
                  sales automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || !pdfFile}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Draft
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || !pdfFile}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Uploading..." : "Save & Send to Sales"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
