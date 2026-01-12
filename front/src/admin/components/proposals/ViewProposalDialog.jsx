import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Download, FileText, Eye } from "lucide-react";

const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { label: "Pending Review", variant: "secondary" },
    approved: { label: "Approved", variant: "default" },
    rejected: { label: "Rejected", variant: "destructive" },
    sent: { label: "Sent to Client", variant: "success" },
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

export function ViewProposalDialog({
  open,
  onOpenChange,
  proposal,
  users = [],
  onApprove,
  onReject,
  onDownload
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  if (!proposal) return null;

  const requestedByUser = users.find(u => u.id === proposal.requestedBy);
  const reviewedByUser = users.find(u => u.id === proposal.reviewedBy);

  let proposalData = {};
  try {
    proposalData = typeof proposal.proposalData === 'string'
      ? JSON.parse(proposal.proposalData)
      : proposal.proposalData;
  } catch (error) {
    console.error("Failed to parse proposal data:", error);
  }

  const { services = [], pricing = {}, terms = {} } = proposalData;

  // Load PDF when switching to PDF tab
  const handleTabChange = (value) => {
    setActiveTab(value);

    if (value === "pdf" && !pdfPreviewUrl && !isLoadingPdf) {
      setIsLoadingPdf(true);

      // Use requestAnimationFrame to ensure loading text renders before PDF loads
      requestAnimationFrame(() => {
        requestAnimationFrame(async () => {
          try {
            // If PDF already exists, use it
            if (proposal.pdfUrl) {
              const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
              setPdfPreviewUrl(`${API_BASE_URL}/proposals/${proposal.id}/pdf`);
            } else {
              // Generate preview PDF
              const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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
        });
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[70vw] !max-w-[70vw] h-[90vh] !max-h-[90vh] overflow-hidden flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Proposal Details</DialogTitle>
              <DialogDescription>
                {proposal.inquiryName} • {proposal.inquiryEmail}
              </DialogDescription>
            </div>
            {getStatusBadge(proposal.status)}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="pdf">
              <Eye className="h-4 w-4 mr-2" />
              PDF Preview
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="flex-1 overflow-y-auto mt-4 space-y-4">
            {/* Client Information */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Client Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{proposal.inquiryName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{proposal.inquiryEmail || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="text-sm font-medium">{proposal.inquiryCompany || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{proposal.inquiryPhone || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Services</h3>
            <div className="space-y-3">
              {services.map((service, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{service.name}</p>
                      {service.description && (
                        <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {service.quantity} × ₱{parseFloat(service.unitPrice).toFixed(2)}
                      </p>
                      <p className="text-sm font-semibold text-green-600">
                        ₱{parseFloat(service.subtotal).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
            <h3 className="text-sm font-semibold mb-3">Pricing Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">₱{parseFloat(pricing.subtotal || 0).toFixed(2)}</span>
              </div>
              {pricing.discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span className="font-medium">- ₱{parseFloat(pricing.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax ({pricing.taxRate || 0}%):</span>
                <span className="font-medium">₱{parseFloat(pricing.tax || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">₱{parseFloat(pricing.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Terms & Conditions</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <p className="text-sm font-medium">{terms.paymentTerms || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validity</p>
                <p className="text-sm font-medium">{terms.validityDays || 0} days</p>
              </div>
              {terms.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Additional Notes</p>
                  <p className="text-sm font-medium">{terms.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Information */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Workflow Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Requested By</p>
                <p className="text-sm font-medium">
                  {requestedByUser
                    ? `${requestedByUser.firstName} ${requestedByUser.lastName}`
                    : "Unknown User"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="text-sm font-medium">
                  {format(new Date(proposal.createdAt), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
              {proposal.reviewedBy && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Reviewed By</p>
                    <p className="text-sm font-medium">
                      {reviewedByUser
                        ? `${reviewedByUser.firstName} ${reviewedByUser.lastName}`
                        : "Unknown User"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reviewed At</p>
                    <p className="text-sm font-medium">
                      {proposal.reviewedAt
                        ? format(new Date(proposal.reviewedAt), "MMM dd, yyyy HH:mm")
                        : "N/A"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {proposal.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                  Rejection Reason:
                </p>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  {proposal.rejectionReason}
                </p>
              </div>
            )}

            {proposal.adminNotes && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Admin Notes:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  {proposal.adminNotes}
                </p>
              </div>
            )}
          </div>
          </TabsContent>

          {/* PDF Preview Tab */}
          <TabsContent value="pdf" className="flex-1 overflow-hidden mt-4">
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
                <p className="text-sm text-muted-foreground">Click to load PDF preview</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {proposal.pdfUrl && (
            <Button variant="outline" onClick={() => onDownload(proposal)}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}

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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
