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
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { PDFViewer } from "../PDFViewer";
import { StatusBadge } from "../StatusBadge";
import { api } from "@admin/services/api";

export function ReviewProposalDialog({
  open,
  onOpenChange,
  proposal,
  users = [],
  onApprove,
  onReject,
  userRole,
}) {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  // Reset PDF state when proposal changes or dialog closes
  useEffect(() => {
    if (!open) {
      setPdfPreviewUrl("");
      setIsLoadingPdf(false);
      setShowPdfViewer(false);
    }
  }, [open]);

  // Also reset PDF when proposal ID changes
  useEffect(() => {
    setPdfPreviewUrl("");
    setIsLoadingPdf(false);
  }, [proposal?.id]);

  if (!proposal) return null;

  const requestedByUser = users.find(u => u.id === proposal.requestedBy);

  let proposalData = {};
  try {
    proposalData = typeof proposal.proposalData === 'string'
      ? JSON.parse(proposal.proposalData)
      : proposal.proposalData;
  } catch (error) {
    console.error("Failed to parse proposal data:", error);
  }

  const { services = [], pricing = {}, terms = {}, templateMetadata = {} } = proposalData;

  // Handle viewing PDF
  const handleViewPdf = async () => {
    setShowPdfViewer(true);

    if (!pdfPreviewUrl && !isLoadingPdf) {
      setIsLoadingPdf(true);

      try {
        // If PDF already exists on disk, fetch it as blob and convert to base64
        if (proposal.pdfUrl) {
          const blob = await api.requestBlob(`/proposals/${proposal.id}/pdf`, {
            method: "GET",
          });
          const reader = new FileReader();
          reader.onloadend = () => {
            setPdfPreviewUrl(reader.result);
            setIsLoadingPdf(false);
          };
          reader.readAsDataURL(blob);
          return; // Early return since we're using async reader
        } else {
          // Generate preview PDF (for proposals without saved PDF)
          // This endpoint returns JSON with base64 PDF, not a blob
          const response = await api.request(`/proposals/${proposal.id}/preview-pdf`, {
            method: "POST",
          });
          if (response.success && response.data.pdfBase64) {
            setPdfPreviewUrl(`data:application/pdf;base64,${response.data.pdfBase64}`);
          }
        }
      } catch (error) {
        console.error("Failed to load PDF:", error);
      } finally {
        setIsLoadingPdf(false);
      }
    }
  };

  const handleDialogChange = (isOpen) => {
    // Prevent closing the dialog if PDF viewer is open
    if (!isOpen && showPdfViewer) {
      return;
    }
    onOpenChange(isOpen);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="w-[95vw] sm:w-[600px]! max-w-[90vw]! max-h-[90vh]! overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl">{userRole === "sales" ? "View Proposal" : "Review Proposal"}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Requested by: {requestedByUser
                  ? `${requestedByUser.firstName} ${requestedByUser.lastName}`
                  : "Unknown User"}
              </DialogDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <StatusBadge status={proposal.status} className="shrink-0" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewPdf}
                disabled={isLoadingPdf}
                className="w-full sm:w-auto h-9"
              >
                <Eye className="h-4 w-4 mr-2" />
                View PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Proposal Details */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {/* Client Information */}
            <div className="border rounded-lg p-3 sm:p-4">
              <h3 className="text-sm font-semibold mb-3">Client Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Name</p>
                  <p className="font-medium break-words">{proposal.inquiryName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{proposal.inquiryEmail || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Company</p>
                  <p className="font-medium break-words">{proposal.inquiryCompany || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium break-words">{proposal.inquiryPhone || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="border rounded-lg p-3 sm:p-4">
              <h3 className="text-sm font-semibold mb-3">Service Type</h3>
              <div className="space-y-2">
                {templateMetadata.serviceName ? (
                  <p className="text-xs sm:text-sm break-words">
                    {templateMetadata.serviceName}
                    {templateMetadata.serviceSubTypeName && (
                      <span className="text-muted-foreground">
                        {" "}- {templateMetadata.serviceSubTypeName}
                      </span>
                    )}
                  </p>
                ) : proposal.inquiryServiceType ? (
                  <p className="text-xs sm:text-sm capitalize break-words">
                    {proposal.inquiryServiceType.replace(/_/g, " ")}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    No service type specified
                  </p>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            {terms.notes && (
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="text-sm font-semibold mb-2">Additional Notes</h3>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">{terms.notes}</p>
              </div>
            )}

            {/* Rejection/Admin Notes (if exists) */}
            {proposal.rejectionReason && (
              <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs sm:text-sm font-semibold text-red-900 dark:text-red-100">
                  Rejection Reason:
                </p>
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-200 mt-1 break-words">
                  {proposal.rejectionReason}
                </p>
              </div>
            )}

            {proposal.adminNotes && (
              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Admin Notes:
                </p>
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 mt-1 break-words">
                  {proposal.adminNotes}
                </p>
              </div>
            )}
          </div>

        <DialogFooter className="flex-col gap-3">
          {userRole !== "sales" && proposal.status === "pending" && (
            <div className="w-full text-xs text-muted-foreground text-center sm:text-right bg-muted/50 p-2 rounded">
              Note: Approving allows sales to send the proposal
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <Button 
              variant="outline" 
              onClick={() => {
                // Only close if PDF viewer is not open
                if (!showPdfViewer) {
                  onOpenChange(false);
                }
              }}
              className="w-full sm:w-auto"
            >
              Close
            </Button>

            {userRole !== "sales" && proposal.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onOpenChange(false);
                    onReject(proposal);
                  }}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onApprove(proposal);
                  }}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Full-screen PDF Viewer */}
    {showPdfViewer && (
      <PDFViewer
        fileUrl={isLoadingPdf ? "" : pdfPreviewUrl}
        fileName={`${proposal.inquiryName} - Proposal.pdf`}
        title="Proposal PDF"
        onClose={() => {
          setShowPdfViewer(false);
          // Review dialog stays open - no need to do anything else
        }}
        isOpen={showPdfViewer}
      />
    )}
  </>
  );
}

