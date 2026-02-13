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
import { Ticket, AlertCircle, ImagePlus, X, Eye, Paperclip, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";
import { PDFViewer } from "../PDFViewer";

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

export const EditTicketDialog = ({
  open,
  onOpenChange,
  ticketId,
  clients = [],
  onSuccess,
}) => {
  const [ticket, setTicket] = useState(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    clientId: "",
    category: "",
    priority: "medium",
    subject: "",
    description: "",
  });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFileUrl, setViewerFileUrl] = useState("");
  const [viewerFileName, setViewerFileName] = useState("");
  const [viewerFileType, setViewerFileType] = useState("");
  const [isLoadingViewUrl, setIsLoadingViewUrl] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open && ticketId) {
      // Blur any focused element to prevent aria-hidden focus warning
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      
      const fetchTicket = async () => {
        setIsLoadingTicket(true);
        setTicket(null);
        try {
          const response = await api.getTicketById(ticketId);
          const fullTicket = response?.data;
          setTicket(fullTicket);
          if (fullTicket) {
            setFormData({
              clientId: fullTicket.clientId || "",
              category: fullTicket.category || "",
              priority: fullTicket.priority || "medium",
              subject: fullTicket.subject || "",
              description: fullTicket.description || "",
            });
          }
        } catch (error) {
          toast.error("Failed to load ticket");
          console.error("Fetch ticket error:", error);
          onOpenChange(false);
        } finally {
          setIsLoadingTicket(false);
        }
      };
      fetchTicket();
      setValidationErrors([]);
      setSelectedFiles([]);
    } else if (!open) {
      setTicket(null);
    }
  }, [open, ticketId, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setValidationErrors([]);
      setSelectedFiles([]);
    }
  }, [open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  const handleFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setValidationErrors([]);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setValidationErrors([
          {
            field: "attachment",
            message: `Invalid file type: ${file.name}. Allowed: images (JPEG, PNG, GIF, WebP), PDF, Word, Excel, text`,
          },
        ]);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setValidationErrors([
          { field: "attachment", message: `${file.name} exceeds 10MB limit` },
        ]);
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

  const handleDeleteClick = (attachment) => {
    setAttachmentToDelete(attachment);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!attachmentToDelete || !ticket?.id) return;
    setIsDeleting(true);
    try {
      await api.deleteTicketAttachment(ticket.id, attachmentToDelete.id);
      toast.success("Attachment deleted");
      setTicket((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((a) => a.id !== attachmentToDelete.id),
      }));
      setDeleteConfirmOpen(false);
      setAttachmentToDelete(null);
    } catch (error) {
      toast.error("Failed to delete attachment");
      console.error("Delete attachment error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewAttachment = async (attachment) => {
    if (!ticket?.id) return;
    setIsLoadingViewUrl(attachment.id);
    try {
      const response = await api.getTicketAttachmentViewUrl(ticket.id, attachment.id);
      const { viewUrl, fileName, fileType } = response?.data || {};
      if (viewUrl) {
        setViewerFileUrl(viewUrl);
        setViewerFileName(fileName || attachment.fileName);
        setViewerFileType(fileType || "");
        setViewerOpen(true);
      } else {
        toast.error("Failed to load file");
      }
    } catch (error) {
      toast.error("Failed to load file");
      console.error("View attachment error:", error);
    } finally {
      setIsLoadingViewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors([]);

    const errors = [];
    if (!formData.clientId) {
      errors.push({ field: "clientId", message: "Please select a client" });
    }
    if (!formData.category || formData.category.trim() === "") {
      errors.push({ field: "category", message: "Category is required" });
    }
    if (!formData.subject || formData.subject.trim().length < 3) {
      errors.push({ field: "subject", message: "Subject must be at least 3 characters" });
    }
    if (!formData.description || formData.description.trim().length < 10) {
      errors.push({
        field: "description",
        message: "Description must be at least 10 characters",
      });
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const updatePayload = {
        clientId: formData.clientId,
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
      };

      await api.updateTicket(ticket.id, updatePayload);

      let uploadedCount = 0;
      const failedFiles = [];

      if (selectedFiles?.length > 0) {
        for (const file of selectedFiles) {
          try {
            const uploadResponse = await api.uploadTicketAttachment(ticket.id, file);
            if (uploadResponse?.success && uploadResponse?.data?.fileUrl) {
              uploadedCount += 1;
            }
          } catch (uploadError) {
            failedFiles.push(file.name);
            console.error(`Attachment upload error for ${file.name}:`, uploadError);
          }
        }
      }

      if (failedFiles.length > 0) {
        toast.error(
          `Ticket updated. ${failedFiles.length} attachment(s) failed: ${failedFiles.join(", ")}`
        );
      } else if (uploadedCount > 0) {
        toast.success(`Ticket updated. ${uploadedCount} attachment(s) uploaded.`);
      } else {
        toast.success("Ticket updated successfully");
      }

      onSuccess?.();
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
      <DialogContent
        className="w-[95vw] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6"
        onInteractOutside={(e) => {
          if (viewerOpen) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            Edit Ticket
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {ticket?.ticketNumber || "—"} — Update ticket details
          </DialogDescription>
        </DialogHeader>

        {isLoadingTicket ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !ticket ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Failed to load ticket
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 min-w-0 overflow-x-hidden">
          <div className="space-y-2 min-w-0">
            <Label htmlFor="client" className="text-sm">Client *</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => handleChange("clientId", value)}
              required
            >
              <SelectTrigger className="w-full text-sm min-w-0 justify-center [&>span]:flex [&>span]:flex-col [&>span]:items-center [&>span]:w-full">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-3rem)]">
                {clients.map((client) => (
                  <SelectItem 
                    key={client.id} 
                    value={client.id}
                    className="cursor-pointer max-w-full"
                  >
                    <div className="flex flex-col min-w-0 max-w-full items-center text-center">
                      <span className="truncate font-medium">{client.companyName}</span>
                      {(client.contactPerson || client.email) && (
                        <span className="text-xs text-muted-foreground truncate">
                          {client.contactPerson && client.contactPerson}
                          {client.contactPerson && client.email && " · "}
                          {client.email && client.email}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {validationErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4 dark:border-red-800 dark:bg-red-950">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-red-600 dark:text-red-400" />
                <ul className="list-disc space-y-1 pl-4 text-xs sm:text-sm text-red-800 dark:text-red-200">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
            <div className="space-y-2 min-w-0">
              <Label htmlFor="category" className="text-sm">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
                required
              >
                <SelectTrigger className="text-sm w-full min-w-0">
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

            <div className="space-y-2 min-w-0">
              <Label htmlFor="priority" className="text-sm">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange("priority", value)}
                required
              >
                <SelectTrigger className="text-sm w-full min-w-0">
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

          <div className="space-y-2 min-w-0">
            <Label htmlFor="subject" className="text-sm">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder="Brief description of the issue"
              required
              className="text-sm w-full min-w-0"
            />
          </div>

          <div className="space-y-2 min-w-0">
            <Label htmlFor="description" className="text-sm">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Detailed description of the issue, feedback, or request"
              rows={6}
              required
              className="text-sm w-full min-w-0 resize-none"
            />
          </div>

          {/* Existing attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Paperclip className="h-4 w-4" />
                Existing Attachments ({ticket.attachments.length})
              </Label>
              <div className="space-y-2 rounded-lg border p-2 sm:p-3">
                {ticket.attachments.map((attachment, index) => (
                  <div
                    key={`existing-${attachment.id}-${index}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border bg-muted/30 p-2 sm:px-3 sm:py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium truncate">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {attachment.fileSize
                          ? `${(attachment.fileSize / 1024).toFixed(2)} KB`
                          : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewAttachment(attachment)}
                        disabled={isLoadingViewUrl === attachment.id}
                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        {isLoadingViewUrl === attachment.id ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <>
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(attachment)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/50"
                        aria-label={`Delete ${attachment.fileName}`}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new attachments */}
          <div className="space-y-2">
            <Label htmlFor="attachment" className="text-sm">Add New Attachments (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Images, PDF, Word, Excel, or text. Max 10MB each.
            </p>
            <div
              className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-gray-900"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Click to add files"
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
                <ImagePlus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="text-xs sm:text-sm">Click to add files (or drag and drop)</span>
              </div>
            </div>
            {selectedFiles.length > 0 && (
              <ul className="space-y-2 mt-2">
                {selectedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ImagePlus className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0"
                      onClick={() => handleRemoveFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>

      <PDFViewer
        fileUrl={viewerFileUrl}
        fileName={viewerFileName}
        fileType={viewerFileType}
        title="Attachment"
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewerFileUrl("");
          setViewerFileName("");
          setViewerFileType("");
        }}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{attachmentToDelete?.fileName}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
