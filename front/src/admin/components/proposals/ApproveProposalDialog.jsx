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
import { CheckCircle2 } from "lucide-react";

export function ApproveProposalDialog({ open, onOpenChange, proposal, onConfirm }) {
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(adminNotes);
      setAdminNotes(""); // Reset after success
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen) => {
    if (!isOpen && !isSubmitting) {
      setAdminNotes(""); // Reset on close
    }
    onOpenChange(isOpen);
  };

  if (!proposal) return null;

  let totalAmount = 0;
  try {
    const data = typeof proposal.proposalData === 'string'
      ? JSON.parse(proposal.proposalData)
      : proposal.proposalData;
    totalAmount = data?.pricing?.total || 0;
  } catch (error) {
    console.error("Failed to parse proposal data:", error);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Approve Proposal
          </DialogTitle>
          <DialogDescription>
            This will approve the proposal and automatically send it to the client via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Proposal Summary */}
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-semibold">{proposal.inquiryName}</p>
                <p className="text-sm text-muted-foreground">{proposal.inquiryEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold text-green-600">
                  ₱{parseFloat(totalAmount).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Notes (Optional) */}
          <div>
            <Label htmlFor="adminNotes">
              Admin Notes <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any internal notes about this approval..."
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              These notes are internal only and will not be sent to the client.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              <strong>Note:</strong> Once approved, the proposal PDF will be generated and sent
              to {proposal.inquiryEmail}. This action cannot be undone.
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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Approving..." : "Approve & Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
