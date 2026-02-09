import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Ticket, AlertCircle, ImagePlus, X, FileText } from "lucide-react";
import { format } from "date-fns";

const TICKET_CATEGORIES = [
  { value: "technical_issue", label: "Technical Issue" },
  { value: "billing_payment", label: "Billing/Payment" },
  { value: "feature_request", label: "Feature Request" },
  { value: "complaint", label: "Complaint" },
  { value: "feedback", label: "Feedback" },
  { value: "contract_legal", label: "Contract/Legal" },
  { value: "other", label: "Other" },
];

const TICKET_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const CreateTicketDialog = ({ open, onOpenChange, clientId: initialClientId, clients = [], onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    clientId: initialClientId || "",
    contractId: "",
    category: "",
    priority: "medium",
    subject: "",
    description: "",
  });

  const showClientSelector = !initialClientId && clients?.length > 0;
  const resolvedClientId = initialClientId || formData.clientId;

  // Get contracts for the selected client
  const selectedClient = clients.find((c) => c.id === resolvedClientId);
  const clientContracts = selectedClient?.contracts || [];
  const hasMultipleContracts = clientContracts.length > 1;

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ];

  useEffect(() => {
    if (!open) {
      setValidationErrors([]);
      setSelectedFiles([]);
    }
  }, [open]);

  useEffect(() => {
    if (initialClientId) {
      setFormData((prev) => ({ ...prev, clientId: initialClientId }));
    } else if (!showClientSelector) {
      setFormData((prev) => ({ ...prev, clientId: "" }));
    }
  }, [initialClientId, showClientSelector]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Reset contractId when client changes
      if (field === "clientId") next.contractId = "";
      return next;
    });
    setValidationErrors([]);
  };

  const handleFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setValidationErrors([]);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setValidationErrors([{ field: "attachment", message: `Invalid file type: ${file.name}. Allowed: images (JPEG, PNG, GIF, WebP), PDF, Word, Excel, text` }]);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setValidationErrors([{ field: "attachment", message: `${file.name} exceeds 10MB limit` }]);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
    e.target.value = "";
  };

  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors([]);

    // Frontend validation (matches backend schema)
    const errors = [];
    if (!resolvedClientId) {
      errors.push({ field: "clientId", message: showClientSelector ? "Please select a client" : "Client is required. Please try closing and reopening the dialog." });
    }
    if (hasMultipleContracts && !formData.contractId) {
      errors.push({ field: "contractId", message: "Please select which contract this ticket relates to" });
    }
    if (!formData.category || formData.category.trim() === "") {
      errors.push({ field: "category", message: "Category is required" });
    }
    if (!formData.subject || formData.subject.trim().length < 3) {
      errors.push({ field: "subject", message: "Subject must be at least 3 characters" });
    }
    if (!formData.description || formData.description.trim().length < 10) {
      errors.push({ field: "description", message: "Description must be at least 10 characters" });
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const ticketPayload = {
        clientId: resolvedClientId,
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
      };
      // Auto-set contractId: explicit selection, or auto if only 1 contract
      const resolvedContractId =
        formData.contractId || (clientContracts.length === 1 ? clientContracts[0].id : null);
      if (resolvedContractId) {
        ticketPayload.contractId = resolvedContractId;
      }
      await onSuccess(ticketPayload, selectedFiles);
      setFormData({
        clientId: initialClientId || "",
        contractId: "",
        category: "",
        priority: "medium",
        subject: "",
        description: "",
      });
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onOpenChange(false);
    } catch (error) {
      const serverErrors = error.validationErrors || [];
      if (serverErrors.length > 0) {
        setValidationErrors(serverErrors);
      } else {
        setValidationErrors([{ field: "general", message: error.message }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-blue-600" />
            Create New Ticket
          </DialogTitle>
          <DialogDescription>
            Submit a ticket for client issues, feedback, or requests
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showClientSelector && (
            <div className="space-y-2">
              <Label htmlFor="client">Client <span className="text-red-500">*</span></Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => handleChange("clientId", value)}
                required={showClientSelector}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName}
                      {client.contactPerson ? ` (${client.contactPerson})` : ""}
                      {client.email ? ` · ${client.email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {hasMultipleContracts && (
            <div className="space-y-2">
              <Label htmlFor="contract">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Related Contract <span className="text-red-500">*</span>
                </span>
              </Label>
              <Select
                value={formData.contractId || undefined}
                onValueChange={(value) => handleChange("contractId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contract" />
                </SelectTrigger>
                <SelectContent>
                  {clientContracts.map((c) => {
                    const start = c.contractStartDate
                      ? format(new Date(c.contractStartDate), "MMM dd, yyyy")
                      : null;
                    const end = c.contractEndDate
                      ? format(new Date(c.contractEndDate), "MMM dd, yyyy")
                      : null;
                    const period = start && end ? ` · ${start} – ${end}` : "";
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        {c.contractNumber}{period}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This client has {clientContracts.length} contracts. Select which contract this ticket relates to.
              </p>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                <ul className="list-disc space-y-1 pl-4 text-sm text-red-800 dark:text-red-200">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange("priority", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Detailed description of the issue, feedback, or request"
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment">Attachments (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Add multiple files. Images, PDF, Word, Excel, or text. Max 10MB each.
            </p>
            <div
              className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4 cursor-pointer hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-gray-900"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="attachment"
                accept={ALLOWED_FILE_TYPES.join(",")}
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <div className="flex items-center gap-2 text-muted-foreground">
                <ImagePlus className="h-5 w-5 shrink-0" />
                <span className="text-sm">Click to add files (or drag and drop)</span>
              </div>
            </div>
            {selectedFiles.length > 0 && (
              <ul className="space-y-2 mt-2">
                {selectedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={() => handleRemoveFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
