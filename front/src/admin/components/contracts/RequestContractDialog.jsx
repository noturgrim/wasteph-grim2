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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Plus, X, Upload, FileCheck, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { toast } from "../../utils/toast";

const INITIAL_FORM_STATE = {
  contractType: "",
  clientName: "",
  companyName: "",
  clientEmailContract: "",
  clientAddress: "",
  contractStartDate: "",
  contractEndDate: "",
  serviceLatitude: "",
  serviceLongitude: "",
  collectionSchedule: "",
  collectionScheduleOther: "",
  wasteAllowance: "",
  specialClauses: "",
  signatories: [{ name: "", position: "" }],
  ratePerKg: "",
  clientRequests: "",
  requestNotes: "",
};

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

export function RequestContractDialog({
  open,
  onOpenChange,
  contract,
  onConfirm,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCustomTemplate, setHasCustomTemplate] = useState(false);
  const [customTemplateFile, setCustomTemplateFile] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Auto-fill data from proposal/inquiry when dialog opens
  useEffect(() => {
    if (contract && open) {
      const inquiry = contract.inquiry || {};
      const proposal = contract.proposal || {};

      // Parse proposal data if it exists
      let proposalData = {};
      if (proposal.proposalData) {
        try {
          proposalData =
            typeof proposal.proposalData === "string"
              ? JSON.parse(proposal.proposalData)
              : proposal.proposalData;
        } catch (e) {
          console.error("Failed to parse proposal data:", e);
        }
      }

      setFormData((prev) => ({
        ...prev,
        clientName: proposalData.clientName || inquiry.name || "",
        companyName: proposalData.clientCompany || inquiry.company || "",
        clientEmailContract: proposalData.clientEmail || inquiry.email || "",
      }));
    }
  }, [contract, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatoryChange = (index, field, value) => {
    const newSignatories = [...formData.signatories];
    newSignatories[index][field] = value;
    setFormData((prev) => ({ ...prev, signatories: newSignatories }));
  };

  const addSignatory = () => {
    setFormData((prev) => ({
      ...prev,
      signatories: [...prev.signatories, { name: "", position: "" }],
    }));
  };

  const removeSignatory = (index) => {
    if (formData.signatories.length > 1) {
      const newSignatories = formData.signatories.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, signatories: newSignatories }));
    }
  };

  const validateForm = () => {
    const errors = [];

    // All fields are now required
    if (!formData.contractType) errors.push("Contract type is required");
    if (!formData.clientName) errors.push("Client name is required");
    if (!formData.companyName) errors.push("Company name is required");
    if (!formData.clientEmailContract) errors.push("Client email is required");
    if (!formData.clientAddress) errors.push("Client address is required");
    if (!formData.contractStartDate) errors.push("Contract start date is required");
    if (!formData.contractEndDate) errors.push("Contract end date is required");
    if (!formData.serviceLatitude) errors.push("Service latitude is required");
    if (!formData.serviceLongitude)
      errors.push("Service longitude is required");
    if (!formData.collectionSchedule)
      errors.push("Collection schedule is required");
    if (
      formData.collectionSchedule === "other" &&
      !formData.collectionScheduleOther
    ) {
      errors.push("Please specify the collection schedule");
    }
    if (!formData.wasteAllowance) errors.push("Waste allowance is required");
    if (!formData.specialClauses) errors.push("Special clauses are required");
    if (!formData.ratePerKg) errors.push("Rate per kg is required");
    if (!formData.clientRequests) errors.push("Client requests are required");
    if (!formData.requestNotes) errors.push("Request notes are required");

    // Validate signatories
    const hasEmptySignatory = formData.signatories.some(
      (sig) => !sig.name.trim() || !sig.position.trim(),
    );
    if (hasEmptySignatory) {
      errors.push("All signatories must have a name and position");
    }

    // Validate custom template if checkbox is checked
    if (hasCustomTemplate && !customTemplateFile) {
      errors.push("Please upload the custom contract template");
    }

    if (errors.length > 0) {
      toast.error(errors[0]);
      return false;
    }

    return true;
  };

  const handleCustomTemplateChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF or DOCX)
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error("Only PDF or Word documents are allowed");
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setCustomTemplateFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onConfirm(formData, hasCustomTemplate ? customTemplateFile : null);
      // Reset form after successful submission
      setHasCustomTemplate(false);
      setCustomTemplateFile(null);
      setFormData(INITIAL_FORM_STATE);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen) => {
    if (!isOpen && !isSubmitting) {
      // Reset form on close
      setFormData(INITIAL_FORM_STATE);
      setHasCustomTemplate(false);
      setCustomTemplateFile(null);
    }
    onOpenChange(isOpen);
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Request Contract
          </DialogTitle>
          <DialogDescription>
            Fill in the contract details for admin to create the contract
            document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Type - Required */}
          <div>
            <Label htmlFor="contractType">
              Contract Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.contractType}
              onValueChange={(value) => handleChange("contractType", value)}
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

          {/* Client Name - Required */}
          <div>
            <Label htmlFor="clientName">
              Client Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => handleChange("clientName", e.target.value)}
              placeholder="Contact person name"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Contact person or representative name
            </p>
          </div>

          {/* Company Name - Required */}
          <div>
            <Label htmlFor="companyName">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder="Full CORPORATE NAME"
              className="mt-1"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Full corporate or company name
            </p>
          </div>

          {/* Client Email - Required */}
          <div>
            <Label htmlFor="clientEmailContract">
              Client E-Mail <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clientEmailContract"
              type="email"
              value={formData.clientEmailContract}
              onChange={(e) =>
                handleChange("clientEmailContract", e.target.value)
              }
              placeholder="client@company.com"
              className="mt-1"
            />
          </div>

          {/* Client Address - Required */}
          <div>
            <Label htmlFor="clientAddress">
              Client Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clientAddress"
              value={formData.clientAddress}
              onChange={(e) => handleChange("clientAddress", e.target.value)}
              placeholder="Client's business or billing address"
              className="mt-1"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Client's business or billing address
            </p>
          </div>

          {/* Contract Period - Required */}
          <div>
            <Label>
              Contract Period <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                <DatePicker
                  date={formData.contractStartDate ? new Date(formData.contractStartDate + "T00:00:00") : undefined}
                  onDateChange={(date) => handleChange("contractStartDate", date ? format(date, "yyyy-MM-dd") : "")}
                  placeholder="Pick start date"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">End Date</p>
                <DatePicker
                  date={formData.contractEndDate ? new Date(formData.contractEndDate + "T00:00:00") : undefined}
                  onDateChange={(date) => handleChange("contractEndDate", date ? format(date, "yyyy-MM-dd") : "")}
                  placeholder="Pick end date"
                  fromDate={formData.contractStartDate ? new Date(formData.contractStartDate + "T00:00:00") : undefined}
                />
              </div>
            </div>
          </div>

          {/* Service Address (Latitude/Longitude) - Required */}
          <div>
            <Label>
              Service Address (Coordinates){" "}
              <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div>
                <Input
                  id="serviceLatitude"
                  type="number"
                  step="any"
                  value={formData.serviceLatitude}
                  onChange={(e) =>
                    handleChange("serviceLatitude", e.target.value)
                  }
                  placeholder="Latitude (e.g., 14.5995)"
                  required
                />
              </div>
              <div>
                <Input
                  id="serviceLongitude"
                  type="number"
                  step="any"
                  value={formData.serviceLongitude}
                  onChange={(e) =>
                    handleChange("serviceLongitude", e.target.value)
                  }
                  placeholder="Longitude (e.g., 120.9842)"
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              GPS coordinates of the service location
            </p>
          </div>

          {/* Collection Schedule - Required */}
          <div>
            <Label htmlFor="collectionSchedule">
              Schedule of Garbage Collection{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.collectionSchedule}
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
            {formData.collectionSchedule === "other" && (
              <Input
                value={formData.collectionScheduleOther}
                onChange={(e) =>
                  handleChange("collectionScheduleOther", e.target.value)
                }
                placeholder="Specify schedule"
                className="mt-2"
              />
            )}
          </div>

          {/* Waste Allowance - Required */}
          <div>
            <Label htmlFor="wasteAllowance">
              Waste Allowance <span className="text-red-500">*</span>
            </Label>
            <Input
              id="wasteAllowance"
              value={formData.wasteAllowance}
              onChange={(e) => handleChange("wasteAllowance", e.target.value)}
              placeholder="Allocated amount for fixed clients"
              className="mt-1"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Allocated amount for fixed clients
            </p>
          </div>

          {/* Special Clauses - Required */}
          <div>
            <Label htmlFor="specialClauses">
              Special Clauses or Requests{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="specialClauses"
              value={formData.specialClauses}
              onChange={(e) => handleChange("specialClauses", e.target.value)}
              placeholder="Does the client have any special clauses or requests?"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Signatories - Required */}
          <div>
            <Label>
              Signatories and their Position{" "}
              <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-3 mt-2">
              {formData.signatories.map((signatory, index) => (
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
                      handleSignatoryChange(index, "position", e.target.value)
                    }
                    placeholder="Position"
                    className="flex-1"
                  />
                  {formData.signatories.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSignatory(index)}
                      className="shrink-0"
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

          {/* Rate Per Kg - Required */}
          <div>
            <Label htmlFor="ratePerKg">
              Rate per KG <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ratePerKg"
              value={formData.ratePerKg}
              onChange={(e) => handleChange("ratePerKg", e.target.value)}
              placeholder="e.g., PHP 3.50/kg food - VAT ex."
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Specify type of waste - whether VAT exclusive or inclusive (e.g.,
              PHP 3.50/kg food - VAT ex.)
            </p>
          </div>

          {/* Client Requests - Required */}
          <div>
            <Label htmlFor="clientRequests">
              Client Requests <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="clientRequests"
              value={formData.clientRequests}
              onChange={(e) => handleChange("clientRequests", e.target.value)}
              placeholder="If any, please provide client requests of modifications through here"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Request Notes - Required */}
          <div>
            <Label htmlFor="requestNotes">
              Request Notes <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="requestNotes"
              value={formData.requestNotes}
              onChange={(e) => handleChange("requestNotes", e.target.value)}
              placeholder="Add any additional notes for admin..."
              rows={2}
              className="mt-1"
              required
            />
          </div>

          {/* Custom Contract Template */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="hasCustomTemplate"
                checked={hasCustomTemplate}
                onCheckedChange={setHasCustomTemplate}
              />
              <Label
                htmlFor="hasCustomTemplate"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Client has custom contract template
              </Label>
            </div>

            {hasCustomTemplate && (
              <div>
                <Label htmlFor="customTemplate">
                  Upload Custom Template <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customTemplate"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleCustomTemplateChange}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload PDF or Word document (max 10MB)
                </p>
                {customTemplateFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <FileCheck className="h-4 w-4" />
                    {customTemplateFile.name} ({(customTemplateFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-900 dark:text-green-100">
              <strong>Note:</strong> Admin will be notified and will prepare the
              contract document based on the details you provide.
            </p>
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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Requesting..." : "Request Contract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
