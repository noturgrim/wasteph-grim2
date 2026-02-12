import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { format } from "date-fns";

const entityTypeConfig = {
  proposal: {
    label: "Proposal",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
  },
  contract: {
    label: "Contract",
    className:
      "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700",
  },
  signed_contract: {
    label: "Signed Contract",
    className:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",
  },
  hardbound_contract: {
    label: "Hardbound",
    className:
      "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
  },
  custom_template: {
    label: "Custom Template",
    className:
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
  },
  ticket_attachment: {
    label: "Ticket Attachment",
    className:
      "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
  },
};

const actionLabels = {
  generated: "Generated",
  uploaded: "Uploaded",
  signed: "Signed by Client",
};

const formatFileSize = (bytes) => {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function FileDetailsDialog({ open, onOpenChange, file }) {
  if (!file) return null;

  const config =
    entityTypeConfig[file.entityType] || entityTypeConfig.proposal;
  const uploaderName = file.uploaderFirstName
    ? `${file.uploaderFirstName} ${file.uploaderLastName}`
    : "Client";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            File Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about this file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Info */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">File Name</p>
              <p className="font-medium break-all">{file.fileName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline" className={`mt-1 ${config.className}`}>
                  {config.label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Action</p>
                <p className="font-medium">
                  {actionLabels[file.action] || file.action}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">File Size</p>
                <p className="font-medium">{formatFileSize(file.fileSize)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MIME Type</p>
                <p className="font-medium text-sm">
                  {file.fileType || "Unknown"}
                </p>
              </div>
            </div>
          </div>

          {/* Related Entity */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Related Entity</p>
              <p className="font-mono text-sm font-medium">
                {file.relatedEntityNumber || "-"}
              </p>
            </div>
            {file.clientName && (
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{file.clientName}</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {file.action === "signed" ? "Signed By" : "Uploaded By"}
                </p>
                <p className="font-medium">{uploaderName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {file.createdAt
                    ? format(new Date(file.createdAt), "MMM dd, yyyy HH:mm")
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
