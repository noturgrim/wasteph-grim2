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
import { FileText, Loader2, Plus, X } from "lucide-react";
import { toast } from "../../utils/toast";

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
  const [formData, setFormData] = useState({
    contractType: "",
    clientName: "",
    companyName: "",
    clientEmailContract: "",
    clientAddress: "",
    contractDuration: "",
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
  });

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
    if (!formData.contractDuration)
      errors.push("Contract duration is required");
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

    if (errors.length > 0) {
      toast.error(errors[0]);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onConfirm(formData);
      // Reset form after successful submission
      setFormData({
        contractType: "",
        clientName: "",
        companyName: "",
        clientEmailContract: "",
        clientAddress: "",
        contractDuration: "",
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
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen) => {
    if (!isOpen && !isSubmitting) {
      // Reset form on close
      setFormData({
        contractType: "",
        clientName: "",
        companyName: "",
        clientEmailContract: "",
        clientAddress: "",
        contractDuration: "",
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
      });
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

          {/* Contract Duration - Required */}
          <div>
            <Label htmlFor="contractDuration">
              Effectivity of Contract Duration{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contractDuration"
              value={formData.contractDuration}
              onChange={(e) => handleChange("contractDuration", e.target.value)}
              placeholder="e.g., January 1, 2024 - December 31, 2024"
              className="mt-1"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Duration or length of when contract is to be live and ends
            </p>
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
