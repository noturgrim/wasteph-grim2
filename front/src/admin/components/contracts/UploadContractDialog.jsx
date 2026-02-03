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
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

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
  const [isEditing, setIsEditing] = useState(false);
  const [pendingData, setPendingData] = useState({});

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

  // Generate change log for admin notes
  const generateChangeLog = () => {
    const changes = [];

    const fieldLabels = {
      contractType: "Contract Type",
      clientName: "Client Name",
      companyName: "Company Name",
      clientEmailContract: "Client Email",
      clientAddress: "Client Address",
      contractStartDate: "Contract Start Date",
      contractEndDate: "Contract End Date",
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
      setIsEditing(false);
      setPendingData({});
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
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Contract Details
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sales Person: {salesPersonName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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

              {/* Contract Details Fields */}
              <div className="space-y-4">
                {(() => {
                  const d = isEditing ? pendingData : editedData;
                  return (
                    <>
                      {/* Contract Type */}
                      <div>
                        <Label>Contract Type *</Label>
                        <Select
                          value={d.contractType}
                          onValueChange={(value) => handleChange("contractType", value)}
                          disabled={!isEditing}
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
                          <Label>Client Name *</Label>
                          <Input
                            value={d.clientName || ""}
                            onChange={(e) => handleChange("clientName", e.target.value)}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Company Name *</Label>
                          <Input
                            value={d.companyName || ""}
                            onChange={(e) => handleChange("companyName", e.target.value)}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Client Email *</Label>
                          <Input
                            type="email"
                            value={d.clientEmailContract || ""}
                            onChange={(e) => handleChange("clientEmailContract", e.target.value)}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Client Address *</Label>
                          <Input
                            value={d.clientAddress || ""}
                            onChange={(e) => handleChange("clientAddress", e.target.value)}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Contract Period */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Contract Start *</Label>
                          <div className="mt-1">
                            <DatePicker
                              date={d.contractStartDate ? new Date(d.contractStartDate + "T00:00:00") : undefined}
                              onDateChange={(date) => handleChange("contractStartDate", date ? format(date, "yyyy-MM-dd") : "")}
                              placeholder="Pick start date"
                              disabled={!isEditing}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Contract End *</Label>
                          <div className="mt-1">
                            <DatePicker
                              date={d.contractEndDate ? new Date(d.contractEndDate + "T00:00:00") : undefined}
                              onDateChange={(date) => handleChange("contractEndDate", date ? format(date, "yyyy-MM-dd") : "")}
                              placeholder="Pick end date"
                              disabled={!isEditing}
                              fromDate={d.contractStartDate ? new Date(d.contractStartDate + "T00:00:00") : undefined}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Service Address (Lat/Long) */}
                      <div>
                        <Label>Service Address (Coordinates) *</Label>
                        <div className="grid grid-cols-2 gap-4 mt-1">
                          <Input
                            type="number"
                            step="any"
                            value={d.serviceLatitude || ""}
                            onChange={(e) => handleChange("serviceLatitude", e.target.value)}
                            placeholder="Latitude"
                            disabled={!isEditing}
                          />
                          <Input
                            type="number"
                            step="any"
                            value={d.serviceLongitude || ""}
                            onChange={(e) => handleChange("serviceLongitude", e.target.value)}
                            placeholder="Longitude"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      {/* Collection Schedule */}
                      <div>
                        <Label>Collection Schedule *</Label>
                        <Select
                          value={d.collectionSchedule}
                          onValueChange={(value) => handleChange("collectionSchedule", value)}
                          disabled={!isEditing}
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
                        {d.collectionSchedule === "other" && (
                          <Input
                            value={d.collectionScheduleOther || ""}
                            onChange={(e) => handleChange("collectionScheduleOther", e.target.value)}
                            placeholder="Specify schedule"
                            disabled={!isEditing}
                            className="mt-2"
                          />
                        )}
                      </div>

                      {/* Waste Allowance & Rate */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Waste Allowance *</Label>
                          <Input
                            value={d.wasteAllowance || ""}
                            onChange={(e) => handleChange("wasteAllowance", e.target.value)}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Rate per KG *</Label>
                          <Input
                            value={d.ratePerKg || ""}
                            onChange={(e) => handleChange("ratePerKg", e.target.value)}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Signatories */}
                      <div>
                        <div className="flex items-center justify-between">
                          <Label>Signatories *</Label>
                          {isEditing && (
                            <Button type="button" variant="outline" size="sm" onClick={addSignatory}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Signatory
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2 mt-2">
                          {(Array.isArray(d.signatories) ? d.signatories : []).map((signatory, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={signatory.name}
                                onChange={(e) => handleSignatoryChange(index, "name", e.target.value)}
                                placeholder="Name"
                                disabled={!isEditing}
                                className="flex-1"
                              />
                              <Input
                                value={signatory.position}
                                onChange={(e) => handleSignatoryChange(index, "position", e.target.value)}
                                placeholder="Position"
                                disabled={!isEditing}
                                className="flex-1"
                              />
                              {isEditing && d.signatories.length > 1 && (
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
                        </div>
                      </div>

                      {/* Special Clauses */}
                      <div>
                        <Label>Special Clauses *</Label>
                        <Textarea
                          value={d.specialClauses || ""}
                          onChange={(e) => handleChange("specialClauses", e.target.value)}
                          rows={3}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>

                      {/* Client Requests */}
                      <div>
                        <Label>Client Requests *</Label>
                        <Textarea
                          value={d.clientRequests || ""}
                          onChange={(e) => handleChange("clientRequests", e.target.value)}
                          rows={3}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>

                      {/* Request Notes from Sales (read-only display) */}
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
                    </>
                  );
                })()}
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
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || !pdfFile}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Submitting..." : "Submit Contract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
