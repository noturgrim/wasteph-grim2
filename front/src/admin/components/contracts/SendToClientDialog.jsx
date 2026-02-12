import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Eye, AlertTriangle, Mail } from "lucide-react";
import { api } from "../../services/api";
import { PDFViewer } from "../PDFViewer";

export function SendToClientDialog({ open, onOpenChange, contract, onConfirm }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handleSubmit = async () => {
    const clientEmail = contract?.inquiry?.email;
    if (!clientEmail) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(clientEmail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = async () => {
    if (!contract?.contract?.id) return;
    try {
      setIsPreviewing(true);
      const dataUrl = await api.previewContractPdf(contract.contract.id);
      setPreviewPdfUrl(dataUrl);
      setShowPdfViewer(true);
    } catch (error) {
      console.error("Failed to load PDF preview:", error);
    } finally {
      setIsPreviewing(false);
    }
  };

  if (!contract) return null;

  const clientName = contract.inquiry?.name || "N/A";
  const clientEmail = contract.inquiry?.email || "N/A";

  const handleDialogOpenChange = (isOpen) => {
    // Prevent parent dialog from closing while PDF preview is open
    if (!isOpen && showPdfViewer) return;
    onOpenChange(isOpen);
  };

  return (
  <>
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Send Contract to Client
          </DialogTitle>
          <DialogDescription>
            Send the finalized contract to the client via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Info */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-semibold">{clientName}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{clientEmail}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Final Delivery
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                This will send the contract to the client. Make sure you've reviewed the document and confirmed the email address.
              </p>
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
            onClick={handlePreview}
            disabled={!contract?.contract?.id || isPreviewing}
          >
            {isPreviewing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {isPreviewing ? "Loading..." : "Preview Contract"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !clientEmail || clientEmail === "N/A"}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Sending..." : "Send to Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {showPdfViewer && previewPdfUrl && (
      <PDFViewer
        fileUrl={previewPdfUrl}
        fileName={`${contract?.inquiry?.name || "Contract"} - Contract.pdf`}
        title="Contract PDF Preview"
        onClose={() => setShowPdfViewer(false)}
        isOpen={showPdfViewer}
      />
    )}
    </>
  );
}
