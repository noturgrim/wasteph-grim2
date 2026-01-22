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
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { PDFViewer } from "../PDFViewer";

const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { label: "Pending Review", variant: "secondary" },
    approved: { label: "Approved", variant: "success" },
    disapproved: { label: "Disapproved", variant: "destructive" },
    accepted: { label: "Client Accepted", variant: "success" },
    rejected: { label: "Client Rejected", variant: "destructive" },
    sent: { label: "Sent to Client", variant: "default" },
  };

  const config = statusConfig[status] || { label: status, variant: "secondary" };

  return (
    <Badge
      variant={config.variant}
      className={
        config.variant === "success"
          ? "bg-green-600 hover:bg-green-700 text-white"
          : ""
      }
    >
      {config.label}
    </Badge>
  );
};

export function ReviewProposalDialog({
  open,
  onOpenChange,
  proposal,
  users = [],
  onApprove,
  onReject
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

  const { services = [], pricing = {}, terms = {} } = proposalData;

  // Handle viewing PDF
  const handleViewPdf = async () => {
    setShowPdfViewer(true);

    if (!pdfPreviewUrl && !isLoadingPdf) {
      setIsLoadingPdf(true);

      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

        // If PDF already exists on disk, fetch it as blob and convert to base64
        if (proposal.pdfUrl) {
          const response = await fetch(
            `${API_BASE_URL}/proposals/${proposal.id}/pdf`,
            {
              method: "GET",
              credentials: "include",
            }
          );
          if (!response.ok) throw new Error("Failed to fetch PDF");
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setPdfPreviewUrl(reader.result);
            setIsLoadingPdf(false);
          };
          reader.readAsDataURL(blob);
          return; // Early return since we're using async reader
        } else {
          // Generate preview PDF (for proposals without saved PDF)
          const response = await fetch(
            `${API_BASE_URL}/proposals/${proposal.id}/preview-pdf`,
            {
              method: "POST",
              credentials: "include",
            }
          );
          const data = await response.json();
          if (data.success) {
            setPdfPreviewUrl(`data:application/pdf;base64,${data.data.pdfBase64}`);
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
      <DialogContent className="w-[600px]! max-w-[90vw]! max-h-[85vh]! overflow-hidden flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Review Proposal</DialogTitle>
              <DialogDescription>
                Requested by: {requestedByUser
                  ? `${requestedByUser.firstName} ${requestedByUser.lastName}`
                  : "Unknown User"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewPdf}
                disabled={isLoadingPdf}
              >
                <Eye className="h-4 w-4 mr-2" />
                View PDF
              </Button>
              {getStatusBadge(proposal.status)}
            </div>
          </div>
        </DialogHeader>

        {/* Proposal Details */}
        <div className="flex-1 overflow-y-auto space-y-3">
            {/* Client Information */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Client Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{proposal.inquiryName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{proposal.inquiryEmail || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Company</p>
                  <p className="font-medium">{proposal.inquiryCompany || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{proposal.inquiryPhone || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Service Type</h3>
              <div className="space-y-2">
                {proposal.inquiryServiceType ? (
                  <p className="text-sm capitalize">
                    {proposal.inquiryServiceType.replace(/_/g, ' ')}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No service type specified</p>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            {terms.notes && (
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Additional Notes</h3>
                <p className="text-sm text-muted-foreground">{terms.notes}</p>
              </div>
            )}

            {/* Rejection/Admin Notes (if exists) */}
            {proposal.rejectionReason && (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                  Rejection Reason:
                </p>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  {proposal.rejectionReason}
                </p>
              </div>
            )}

            {proposal.adminNotes && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Admin Notes:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  {proposal.adminNotes}
                </p>
              </div>
            )}
          </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              // Only close if PDF viewer is not open
              if (!showPdfViewer) {
                onOpenChange(false);
              }
            }}
          >
            Close
          </Button>

          {proposal.status === "pending" && (
            <>
              <Button
                variant="destructive"
                onClick={() => {
                  onOpenChange(false);
                  onReject(proposal);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onApprove(proposal);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}
          
          {/* Info message for admin clarity */}
          {proposal.status === "pending" && (
            <div className="flex-1 text-xs text-muted-foreground text-right">
              Note: Approving allows sales to send the proposal
            </div>
          )}
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

