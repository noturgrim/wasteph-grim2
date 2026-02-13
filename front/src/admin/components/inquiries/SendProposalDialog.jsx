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
import { AlertCircle, Mail, Eye, Loader2 } from "lucide-react";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";
import { PDFViewer } from "../PDFViewer";

export function SendProposalDialog({ open, onOpenChange, inquiry, onSuccess, onSendingChange }) {
  const [isSending, setIsSending] = useState(false);
  const [proposalData, setProposalData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  // Reset PDF state when dialog closes or inquiry changes
  useEffect(() => {
    if (!open) {
      setPdfPreviewUrl("");
      setIsLoadingPdf(false);
      setShowPreview(false);
      setProposalData(null);
    }
  }, [open]);

  // Reset PDF when inquiry ID changes
  useEffect(() => {
    setPdfPreviewUrl("");
    setIsLoadingPdf(false);
  }, [inquiry?.proposalId]);

  // Fetch proposal data when dialog opens
  useEffect(() => {
    const fetchProposalData = async () => {
      if (!open || !inquiry?.proposalId) return;

      setIsLoadingData(true);
      try {
        const response = await api.getProposalById(inquiry.proposalId);
        const proposal = response.data || response;

        // Parse proposal data
        const data = typeof proposal.proposalData === "string"
          ? JSON.parse(proposal.proposalData)
          : proposal.proposalData;

        setProposalData(data);
      } catch (error) {
        console.error("Failed to fetch proposal data:", error);
        toast.error("Failed to load proposal details");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchProposalData();
  }, [open, inquiry?.proposalId]);

  if (!inquiry) return null;

  const handlePreview = async () => {
    if (!inquiry.proposalId) {
      toast.error("No proposal found for this inquiry");
      return;
    }

    setIsLoadingPdf(true);
    setShowPreview(true);

    // Use requestAnimationFrame to ensure loading text renders before PDF loads
    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        try {
          // First, get the proposal to check if PDF exists
          const response = await api.getProposalById(inquiry.proposalId);
          const proposal = response.data || response;

          const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

          if (proposal.pdfUrl) {
            // PDF already exists - fetch as blob and convert to base64 for viewing
            const pdfResponse = await fetch(
              `${API_BASE_URL}/proposals/${inquiry.proposalId}/pdf`,
              {
                method: "GET",
                credentials: "include",
              }
            );
            if (!pdfResponse.ok) throw new Error("Failed to fetch PDF");
            const blob = await pdfResponse.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              setPdfPreviewUrl(reader.result);
              setIsLoadingPdf(false);
            };
            reader.readAsDataURL(blob);
            return; // Early return since we're using async reader
          } else {
            // Generate preview PDF (for proposals without PDF yet)
            const previewResponse = await fetch(
              `${API_BASE_URL}/proposals/${inquiry.proposalId}/preview-pdf`,
              {
                method: "GET",
                credentials: "include",
              }
            );
            const previewData = await previewResponse.json();
            if (previewData.success) {
              setPdfPreviewUrl(`data:application/pdf;base64,${previewData.data.pdfBase64}`);
            } else {
              throw new Error(previewData.message || "Failed to generate PDF");
            }
          }
        } catch (error) {
          console.error("Failed to load PDF:", error);
          toast.error(error.message || "Failed to load PDF preview");
          setShowPreview(false); // Go back to info view on error
        } finally {
          setIsLoadingPdf(false);
        }
      });
    });
  };

  const handleSend = async () => {
    if (!inquiry.proposalId) {
      toast.error("No proposal found for this inquiry");
      return;
    }

    setIsSending(true);
    if (onSendingChange) onSendingChange(true);
    try {
      await api.sendProposal(inquiry.proposalId, true);
      toast.success(`Proposal sent successfully to ${inquiry.email}`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message || "Failed to send proposal");
    } finally {
      setIsSending(false);
      if (onSendingChange) onSendingChange(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showPreview} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Send Proposal to Client
            </DialogTitle>
            <DialogDescription>
              This will send the approved proposal to the client via email
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Client Information */}
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-2">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Client Name
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {inquiry.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Email Address
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {inquiry.email}
                </p>
              </div>
              {inquiry.company && (
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Company
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {inquiry.company}
                  </p>
                </div>
              )}
            </div>

            {/* Confirmation Message */}
            <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Confirm before sending
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  The client will receive an email with the proposal PDF attached.
                  This action will update the proposal status to "Sent".
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={isSending}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview PDF
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {isSending ? "Sending..." : "Send to Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview - Uses PDFViewer component */}
      {showPreview && (
        <PDFViewer
          fileUrl={isLoadingPdf ? "" : pdfPreviewUrl}
          fileName={`${inquiry.name} - Proposal.pdf`}
          title="Proposal Preview"
          onClose={() => setShowPreview(false)}
          isOpen={showPreview}
        />
      )}
    </>
  );
}

