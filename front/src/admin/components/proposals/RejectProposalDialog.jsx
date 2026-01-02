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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { XCircle } from "lucide-react";

export function RejectProposalDialog({ open, onOpenChange, proposal, onConfirm }) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rejectionReason.trim()) {
      return; // Validation handled by required field
    }

    setIsSubmitting(true);
    try {
      await onConfirm(rejectionReason);
      setRejectionReason(""); // Reset after success
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen) => {
    if (!isOpen && !isSubmitting) {
      setRejectionReason(""); // Reset on close
    }
    onOpenChange(isOpen);
  };

  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Reject Proposal
          </DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting this proposal. The sales team will be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Proposal Summary */}
          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-semibold">{proposal.inquiryName}</p>
                <p className="text-sm text-muted-foreground">{proposal.inquiryEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requested By</p>
                <p className="text-sm font-medium">
                  {proposal.requestedByName || "Unknown User"}
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Reason (Required) */}
          <div>
            <Label htmlFor="rejectionReason">
              Rejection Reason <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this proposal is being rejected (e.g., pricing issues, incorrect services, compliance concerns)..."
              rows={4}
              className="mt-1"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              This reason will be visible to the sales team who created the proposal.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              <strong>Note:</strong> The sales team can revise and resubmit this proposal
              after addressing the rejection reason.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !rejectionReason.trim()}
          >
            {isSubmitting ? "Rejecting..." : "Reject Proposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
