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
import { AlertCircle, Mail, Eye } from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";

export function SendProposalDialog({ open, onOpenChange, inquiry, onSuccess }) {
  const [isSending, setIsSending] = useState(false);
  const [proposalData, setProposalData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

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
            // PDF already exists (approved proposal)
            setPdfPreviewUrl(`${API_BASE_URL}/proposals/${inquiry.proposalId}/pdf`);
          } else {
            // Generate preview PDF (for proposals without PDF yet)
            const previewResponse = await fetch(
              `${API_BASE_URL}/proposals/${inquiry.proposalId}/preview-pdf`,
              {
                method: "POST",
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
    try {
      await api.sendProposal(inquiry.proposalId, true);
      toast.success(`Proposal sent successfully to ${inquiry.email}`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message || "Failed to send proposal");
    } finally {
      setIsSending(false);
    }
  };

  // Calculate total amount from proposal data
  const totalAmount = proposalData?.pricing?.total
    ? `₱${parseFloat(proposalData.pricing.total).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : isLoadingData
    ? "Loading..."
    : "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={showPreview ? "!w-[70vw] !max-w-[70vw] h-[90vh] !max-h-[90vh] overflow-hidden flex flex-col" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Send Proposal to Client
          </DialogTitle>
          <DialogDescription>
            This will send the approved proposal to the client via email
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <>
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
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Total Amount
                  </p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {totalAmount}
                  </p>
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
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
                <Mail className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send to Client"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* PDF Preview */}
            <div className="flex-1 overflow-hidden">
              {isLoadingPdf ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium">Loading PDF preview...</p>
                    <p className="text-sm text-muted-foreground">Please wait, this may take a moment</p>
                  </div>
                </div>
              ) : pdfPreviewUrl ? (
                <iframe
                  src={pdfPreviewUrl}
                  title="Proposal PDF Preview"
                  className="w-full h-full border rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Failed to load PDF preview</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(false)}
                disabled={isSending}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send to Client"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

