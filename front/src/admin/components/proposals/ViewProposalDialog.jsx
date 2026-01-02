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
import { format } from "date-fns";
import { CheckCircle2, XCircle, Download } from "lucide-react";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Proposal Details</DialogTitle>
          <DialogDescription>
            Review complete proposal information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{proposal.inquiryName}</h3>
              <p className="text-sm text-muted-foreground">{proposal.inquiryEmail}</p>
            </div>
            {getStatusBadge(proposal.status)}
          </div>

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
        </div>

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
                Approve & Send
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
